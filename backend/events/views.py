# events/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Event, EventCategory, EventAttendee, EventComment
from .serializers import (
    EventSerializer, EventDetailSerializer, EventCategorySerializer,
    EventAttendeeSerializer, EventCommentSerializer
)
from users.permissions import IsOwnerOrReadOnly, IsOrganizerOrReadOnly
import logging

# Import the ticket models and serializers
from tickets.models import Ticket
from tickets.serializers import TicketSerializer

logger = logging.getLogger(__name__)

class EventCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for event categories (read-only).
    """
    queryset = EventCategory.objects.all()
    serializer_class = EventCategorySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

class EventViewSet(viewsets.ModelViewSet):
    """
    API endpoint for events.
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOrganizerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'categories__name']
    ordering_fields = ['start_date', 'created_at', 'title']
    ordering = ['-start_date']
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Event.objects.none()
            
        queryset = Event.objects.all()
        status_param = self.request.query_params.get('status', 'published')
        if status_param != 'all':
            queryset = queryset.filter(status=status_param)
        
        visibility_param = self.request.query_params.get('visibility', 'public')
        if visibility_param != 'all':
            if visibility_param == 'public':
                queryset = queryset.filter(visibility='public')
            elif visibility_param == 'private' and self.request.user.is_authenticated:
                queryset = queryset.filter(Q(visibility='private') & Q(organizer=self.request.user))
            elif visibility_param == 'invite_only' and self.request.user.is_authenticated:
                queryset = queryset.filter(
                    Q(visibility='invite_only') & (
                        Q(organizer=self.request.user) | 
                        Q(attendees__user=self.request.user)
                    )
                ).distinct()
        
        organizer_param = self.request.query_params.get('organizer', None)
        if organizer_param:
            queryset = queryset.filter(organizer__id=organizer_param)
        
        category_param = self.request.query_params.get('category', None)
        if category_param:
            queryset = queryset.filter(categories__id=category_param)
        
        date_param = self.request.query_params.get('date', None)
        if date_param == 'upcoming':
            queryset = queryset.filter(start_date__gte=timezone.now().date())
        elif date_param == 'past':
            queryset = queryset.filter(end_date__lt=timezone.now().date())
        
        is_free_param = self.request.query_params.get('is_free', None)
        if is_free_param is not None:
            is_free = is_free_param.lower() == 'true'
            queryset = queryset.filter(is_free=is_free)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EventDetailSerializer
        return EventSerializer
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def attend(self, request, pk=None):
        try:
            event = self.get_object()
            existing_attendance = EventAttendee.objects.filter(event=event, user=request.user).first()
            if existing_attendance:
                if existing_attendance.status == 'cancelled':
                    existing_attendance.status = 'registered'
                    existing_attendance.save()
                    return Response({'message': 'Registration renewed successfully.'}, status=status.HTTP_201_CREATED)
                return Response({'message': 'Already registered for this event.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if event.capacity is not None:
                attendees_count = event.attendees.filter(status='registered').count()
                if attendees_count >= event.capacity:
                    attendance = EventAttendee.objects.create(event=event, user=request.user, status='waitlisted')
                    return Response({
                        'message': 'Event is at capacity. You have been added to the waitlist.',
                        'attendance_id': attendance.id
                    }, status=status.HTTP_201_CREATED)
            
            attendance = EventAttendee.objects.create(event=event, user=request.user, status='registered')
            return Response({
                'message': 'Successfully registered for the event.',
                'attendance_id': attendance.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error registering for event: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register_with_ticket(self, request, pk=None):
        """
        API endpoint to register for an event and generate a ticket.
        """
        try:
            event = self.get_object()
            existing_attendance = EventAttendee.objects.filter(event=event, user=request.user).first()
            
            with transaction.atomic():
                if existing_attendance:
                    if existing_attendance.status == 'cancelled':
                        existing_attendance.status = 'registered'
                        existing_attendance.save()
                    elif existing_attendance.status == 'registered':
                        existing_ticket = Ticket.objects.filter(
                            attendee=existing_attendance,
                            status='active'
                        ).first()
                        if existing_ticket:
                            return Response({
                                'message': 'You already have an active ticket for this event.',
                                'ticket': TicketSerializer(existing_ticket, context={'request': request}).data
                            }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    if event.capacity is not None:
                        attendees_count = event.attendees.filter(status='registered').count()
                        if attendees_count >= event.capacity:
                            attendance = EventAttendee.objects.create(event=event, user=request.user, status='waitlisted')
                            return Response({
                                'message': 'Event is at capacity. You have been added to the waitlist.',
                                'attendance_id': attendance.id
                            }, status=status.HTTP_201_CREATED)
                    
                    existing_attendance = EventAttendee.objects.create(
                        event=event,
                        user=request.user,
                        status='registered'
                    )
                
                ticket_data = {
                    'status': 'active',
                    'ticket_type': request.data.get('ticket_type', 'standard'),
                    'seat_info': request.data.get('seat_info', ''),
                }
                
                if not event.is_free and event.price:
                    ticket_data['price_paid'] = event.price
                
                # Pass event and attendee in the context so the serializer's create() can set them.
                serializer = TicketSerializer(
                    data=ticket_data, 
                    context={'request': request, 'event': event, 'attendee': existing_attendance}
                )
                serializer.is_valid(raise_exception=True)
                ticket = serializer.save()
                
                return Response({
                    'message': 'Successfully registered for the event and generated ticket.',
                    'attendance_id': existing_attendance.id,
                    'ticket': TicketSerializer(ticket, context={'request': request}).data
                }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error(f"Error registering for event with ticket: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        try:
            event = self.get_object()
            attendance = EventAttendee.objects.filter(event=event, user=request.user).first()
            if not attendance or attendance.status == 'cancelled':
                return Response({'message': 'Not registered for this event.'}, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                attendance.status = 'cancelled'
                attendance.save()
                active_tickets = Ticket.objects.filter(attendee=attendance, status='active')
                for ticket in active_tickets:
                    ticket.status = 'cancelled'
                    ticket.save()
                if event.capacity is not None:
                    waitlisted = EventAttendee.objects.filter(event=event, status='waitlisted').order_by('registration_date').first()
                    if waitlisted:
                        waitlisted.status = 'registered'
                        waitlisted.save()
            
            return Response({'message': 'Registration and associated tickets cancelled successfully.'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error cancelling event registration: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_ticket(self, request, pk=None):
        try:
            event = self.get_object()
            attendance = get_object_or_404(EventAttendee, event=event, user=request.user)
            ticket = Ticket.objects.filter(attendee=attendance, status='active').first()
            if not ticket:
                return Response({'message': 'No active ticket found for this event.'}, status=status.HTTP_404_NOT_FOUND)
            return Response(TicketSerializer(ticket, context={'request': request}).data)
            
        except EventAttendee.DoesNotExist:
            return Response({'message': 'You are not registered for this event.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error retrieving ticket: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def attendee_tickets(self, request, pk=None):
        try:
            event = self.get_object()
            if event.organizer != request.user and not request.user.is_staff:
                return Response({'error': 'You do not have permission to view all tickets for this event.'}, status=status.HTTP_403_FORBIDDEN)
            tickets = Ticket.objects.filter(event=event)
            return Response(TicketSerializer(tickets, many=True, context={'request': request}).data)
            
        except Exception as e:
            logger.error(f"Error retrieving event tickets: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def comment(self, request, pk=None):
        try:
            event = self.get_object()
            serializer = EventCommentSerializer(data=request.data)
            if serializer.is_valid():
                comment = serializer.save(event=event, user=request.user)
                return Response({
                    'message': 'Comment added successfully.',
                    'comment': EventCommentSerializer(comment).data
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error adding comment: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class EventAttendeeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for event attendees (read-only).
    """
    serializer_class = EventAttendeeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return EventAttendee.objects.none()
        if self.request.user.is_staff:
            return EventAttendee.objects.all()
        event_id = self.kwargs.get('event_pk')
        if event_id:
            try:
                event = Event.objects.get(pk=event_id)
                if event.organizer == self.request.user:
                    return EventAttendee.objects.filter(event=event)
                return EventAttendee.objects.filter(event=event, user=self.request.user)
            except Event.DoesNotExist:
                return EventAttendee.objects.none()
        return EventAttendee.objects.filter(user=self.request.user)

class EventCommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for event comments.
    """
    serializer_class = EventCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return EventComment.objects.none()
        event_id = self.kwargs.get('event_pk')
        if event_id:
            return EventComment.objects.filter(event_id=event_id)
        return EventComment.objects.none()
    
    def perform_create(self, serializer):
        try:
            event_id = self.kwargs.get('event_pk')
            event = Event.objects.get(pk=event_id)
            serializer.save(event=event, user=self.request.user)
        except Event.DoesNotExist:
            from rest_framework import serializers
            raise serializers.ValidationError("Event not found")
        except Exception as e:
            logger.error(f"Error creating comment: {str(e)}")
            from rest_framework import serializers
            raise serializers.ValidationError(f"Error creating comment: {str(e)}")
