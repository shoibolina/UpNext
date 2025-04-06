from rest_framework import viewsets, permissions, status, generics, views, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
import logging

from .models import Ticket, TicketVerification
from .serializers import (
    TicketSerializer, 
    TicketVerificationSerializer,
    TicketVerificationCreateSerializer
)
from events.models import Event, EventAttendee
from users.permissions import IsOwnerOrReadOnly

logger = logging.getLogger(__name__)

class TicketViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tickets.
    """
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['ticket_number', 'event__title', 'status']
    
    def get_serializer(self, *args, **kwargs):
        """
        Return the serializer instance that should be used for validating and
        deserializing input, and for serializing output.
        """
        serializer_class = self.get_serializer_class()
        kwargs.setdefault('context', {
            'request': self.request,
            'format': self.format_kwarg,
            'view': self
        })
        return serializer_class(*args, **kwargs)
    
    def get_queryset(self):
        user = self.request.user
        
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return Ticket.objects.none()
        
        # Admins and staff can see all tickets
        if user.is_staff or user.is_superuser:
            return Ticket.objects.all()
        
        # Event organizers can see tickets for their events
        if user.is_event_organizer:
            return Ticket.objects.filter(event__organizer=user)
        
        # Regular users can only see their own tickets
        return Ticket.objects.filter(attendee__user=user)
    
    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        """
        API endpoint to get tickets for the current user.
        """
        tickets = Ticket.objects.filter(attendee__user=request.user)
        page = self.paginate_queryset(tickets)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def generate_for_event(self, request):
        """
        Generates a ticket for a user registering for an event.
        """
        try:
            event_id = request.data.get('event_id')
            if not event_id:
                return Response({"error": "Event ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            event = get_object_or_404(Event, id=event_id)
            
            # Check if the event has capacity
            if event.capacity is not None:
                attendee_count = EventAttendee.objects.filter(event=event, status='registered').count()
                if attendee_count >= event.capacity:
                    return Response(
                        {"error": "Event has reached maximum capacity"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Check if user is already registered
            existing_attendee = EventAttendee.objects.filter(event=event, user=request.user).first()
            
            with transaction.atomic():
                if existing_attendee:
                    # Update status if previously cancelled
                    if existing_attendee.status == 'cancelled':
                        existing_attendee.status = 'registered'
                        existing_attendee.save()
                    # Check if already has an active ticket
                    existing_ticket = Ticket.objects.filter(
                        attendee=existing_attendee, 
                        status='active'
                    ).first()
                    
                    if existing_ticket:
                        return Response(
                            {"error": "You already have an active ticket for this event",
                             "ticket": TicketSerializer(existing_ticket, context={'request': request}).data}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    # Create new attendee record
                    existing_attendee = EventAttendee.objects.create(
                        event=event,
                        user=request.user,
                        status='registered'
                    )
                
                # Create ticket data
                ticket_data = {
                    'event': event,
                    'attendee': existing_attendee,
                    'status': 'active',
                    'ticket_type': request.data.get('ticket_type', 'standard'),
                    'seat_info': request.data.get('seat_info', ''),
                }
                
                # Add price if event is not free
                if not event.is_free and event.price:
                    ticket_data['price_paid'] = event.price
                
                # Create ticket using serializer
                serializer = self.get_serializer(data=ticket_data)
                serializer.is_valid(raise_exception=True)
                ticket = serializer.save()
                
                return Response(
                    TicketSerializer(ticket, context={'request': request}).data, 
                    status=status.HTTP_201_CREATED
                )
        except Exception as e:
            logger.error(f"Error generating ticket: {str(e)}")
            return Response({"error": f"Error generating ticket: {str(e)}"}, 
                            status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a ticket.
        """
        try:
            ticket = self.get_object()
            
            # Only allow cancellation of active tickets
            if ticket.status != 'active':
                return Response(
                    {"error": f"Cannot cancel ticket with status: {ticket.status}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check permissions - only ticket owner or event organizer can cancel
            user = request.user
            if (ticket.attendee.user != user and 
                ticket.event.organizer != user and 
                not user.is_staff):
                return Response(
                    {"error": "You don't have permission to cancel this ticket"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            with transaction.atomic():
                # Cancel the ticket
                ticket.status = 'cancelled'
                ticket.save()
                
                # Update the attendee status
                attendee = ticket.attendee
                attendee.status = 'cancelled'
                attendee.save()
            
            return Response(
                {"status": "Ticket successfully cancelled"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error cancelling ticket: {str(e)}")
            return Response({"error": f"Error cancelling ticket: {str(e)}"}, 
                           status=status.HTTP_400_BAD_REQUEST)


class CanVerifyTicketsPermission(permissions.BasePermission):
    """
    Custom permission to only allow event organizers to verify tickets for their events.
    """
    def has_permission(self, request, view):
        # Allow admins and staff to verify tickets
        if request.user.is_staff or request.user.is_superuser:
            return True
            
        # For create actions, check if user is an organizer
        if view.action == 'create' or view.action == 'verify_by_qr':
            # Check if user is an event organizer
            if not request.user.is_event_organizer:
                return False
                
            # For ticket number verifications
            if 'ticket_number' in request.data:
                try:
                    ticket = Ticket.objects.get(ticket_number=request.data['ticket_number'])
                    # Check if user is the organizer of this event
                    return ticket.event.organizer == request.user
                except Ticket.DoesNotExist:
                    # Will be handled by the serializer validation
                    return True
                    
            # For QR verifications, we'll check in the actual view function
            return True
            
        return True


class TicketVerificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for ticket verifications.
    """
    queryset = TicketVerification.objects.all()
    permission_classes = [permissions.IsAuthenticated, CanVerifyTicketsPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['ticket__ticket_number', 'verification_location']
    
    def get_serializer(self, *args, **kwargs):
        """
        Return the serializer instance that should be used for validating and
        deserializing input, and for serializing output.
        """
        serializer_class = self.get_serializer_class()
        kwargs.setdefault('context', {
            'request': self.request,
            'format': self.format_kwarg,
            'view': self
        })
        return serializer_class(*args, **kwargs)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TicketVerificationCreateSerializer
        return TicketVerificationSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return TicketVerification.objects.none()
        
        # Admins and staff can see all verifications
        if user.is_staff or user.is_superuser:
            return TicketVerification.objects.all()
        
        # Event organizers can see verifications for their events
        if user.is_event_organizer:
            return TicketVerification.objects.filter(ticket__event__organizer=user)
        
        # Regular users can see verifications they performed
        return TicketVerification.objects.filter(verified_by=user)
    
    def perform_create(self, serializer):
        serializer.save(verified_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def verify_by_qr(self, request):
        """
        Verify a ticket using QR code data.
        """
        try:
            qr_data = request.data.get('qr_data')
            if not qr_data:
                return Response({"error": "QR data is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            if qr_data.startswith('UPNEXT-TICKET:'):
                qr_content = qr_data.replace('UPNEXT-TICKET:', '')
                import base64
                import ast
                
                # Decode and parse the QR content
                decoded_data = base64.b64decode(qr_content).decode()
                ticket_info = ast.literal_eval(decoded_data)
                
                ticket_id = ticket_info.get('ticket_id')
                if not ticket_id:
                    return Response({"error": "Invalid QR code format"}, status=status.HTTP_400_BAD_REQUEST)
                
                # Get the ticket and verify
                ticket = get_object_or_404(Ticket, id=ticket_id)
                
                # Check if user has permission to verify this ticket
                if (not request.user.is_staff and 
                    not request.user.is_superuser and 
                    ticket.event.organizer != request.user):
                    return Response(
                        {"error": "You don't have permission to verify tickets for this event"},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Check if ticket is already used
                if ticket.status != 'active':
                    return Response(
                        {"error": f"Ticket is not active. Current status: {ticket.status}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                with transaction.atomic():
                    # Mark ticket as used
                    ticket.status = 'used'
                    ticket.used_date = timezone.now()
                    ticket.save()
                    
                    # Create verification record
                    verification = TicketVerification.objects.create(
                        ticket=ticket,
                        verified_by=request.user,
                        verification_location=request.data.get('verification_location', ''),
                        verification_notes=request.data.get('verification_notes', '')
                    )
                
                return Response(
                    TicketVerificationSerializer(verification, context={'request': request}).data,
                    status=status.HTTP_200_OK
                )
            else:
                return Response({"error": "Invalid QR code format"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error verifying ticket QR code: {str(e)}")
            return Response({"error": f"Error verifying ticket: {str(e)}"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
    