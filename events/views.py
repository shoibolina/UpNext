from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Event, EventCategory, EventAttendee, EventComment
from .serializers import (
    EventSerializer, EventDetailSerializer, EventCategorySerializer,
    EventAttendeeSerializer, EventCommentSerializer
)
from users.permissions import IsOwnerOrReadOnly, IsOrganizerOrReadOnly
import logging

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
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return Event.objects.none()
            
        queryset = Event.objects.all()
        
        # Filter by status (default to published)
        status_param = self.request.query_params.get('status', 'published')
        if status_param != 'all':
            queryset = queryset.filter(status=status_param)
        
        # Filter by visibility (default to public)
        visibility_param = self.request.query_params.get('visibility', 'public')
        if visibility_param != 'all':
            if visibility_param == 'public':
                queryset = queryset.filter(visibility='public')
            elif visibility_param == 'private' and self.request.user.is_authenticated:
                # Only show private events created by the current user
                queryset = queryset.filter(
                    Q(visibility='private') & Q(organizer=self.request.user)
                )
            elif visibility_param == 'invite_only' and self.request.user.is_authenticated:
                # Show invite-only events where the user is an attendee or organizer
                queryset = queryset.filter(
                    Q(visibility='invite_only') & (
                        Q(organizer=self.request.user) | 
                        Q(attendees__user=self.request.user)
                    )
                ).distinct()
        
        # Filter by organizer
        organizer_param = self.request.query_params.get('organizer', None)
        if organizer_param:
            queryset = queryset.filter(organizer__id=organizer_param)
        
        # Filter by category
        category_param = self.request.query_params.get('category', None)
        if category_param:
            queryset = queryset.filter(categories__id=category_param)
        
        # Filter by date
        date_param = self.request.query_params.get('date', None)
        if date_param == 'upcoming':
            queryset = queryset.filter(start_date__gte=timezone.now().date())
        elif date_param == 'past':
            queryset = queryset.filter(end_date__lt=timezone.now().date())
        
        # Filter by free/paid
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
        """
        API endpoint to register for an event.
        """
        try:
            event = self.get_object()
            
            # Check if already attending
            existing_attendance = EventAttendee.objects.filter(event=event, user=request.user).first()
            if existing_attendance:
                if existing_attendance.status == 'cancelled':
                    existing_attendance.status = 'registered'
                    existing_attendance.save()
                    return Response({'message': 'Registration renewed successfully.'}, status=status.HTTP_201_CREATED)
                return Response({'message': 'Already registered for this event.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if the event has reached capacity
            if event.capacity is not None:
                attendees_count = event.attendees.filter(status='registered').count()
                if attendees_count >= event.capacity:
                    # Add to waitlist
                    attendance = EventAttendee.objects.create(event=event, user=request.user, status='waitlisted')
                    return Response({
                        'message': 'Event is at capacity. You have been added to the waitlist.',
                        'attendance_id': attendance.id
                    }, status=status.HTTP_201_CREATED)
            
            # Create attendance record
            attendance = EventAttendee.objects.create(event=event, user=request.user, status='registered')
            return Response({
                'message': 'Successfully registered for the event.',
                'attendance_id': attendance.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error registering for event: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        """
        API endpoint to cancel event registration.
        """
        try:
            event = self.get_object()
            
            # Find attendance record
            attendance = EventAttendee.objects.filter(event=event, user=request.user).first()
            if not attendance or attendance.status == 'cancelled':
                return Response({'message': 'Not registered for this event.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Cancel registration
            attendance.status = 'cancelled'
            attendance.save()
            
            # Check waitlist and promote someone if available
            if event.capacity is not None:
                waitlisted = EventAttendee.objects.filter(event=event, status='waitlisted').order_by('registration_date').first()
                if waitlisted:
                    waitlisted.status = 'registered'
                    waitlisted.save()
            
            return Response({'message': 'Registration cancelled successfully.'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error cancelling event registration: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def comment(self, request, pk=None):
        """
        API endpoint to add a comment to an event.
        """
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
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return EventAttendee.objects.none()
            
        # Organizers can see all attendees for their events
        if self.request.user.is_staff:
            return EventAttendee.objects.all()
        
        # Get the event ID from the URL
        event_id = self.kwargs.get('event_pk')
        
        if event_id:
            try:
                event = Event.objects.get(pk=event_id)
                # Organizers can see all attendees for their events
                if event.organizer == self.request.user:
                    return EventAttendee.objects.filter(event=event)
                # Attendees can only see themselves
                return EventAttendee.objects.filter(event=event, user=self.request.user)
            except Event.DoesNotExist:
                return EventAttendee.objects.none()
        
        # Default is to show only the user's attendance records
        return EventAttendee.objects.filter(user=self.request.user)

class EventCommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for event comments.
    """
    serializer_class = EventCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return EventComment.objects.none()
            
        # Get the event ID from the URL
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