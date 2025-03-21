from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
from django.db.models import Q, Avg
from .models import (
    Venue, VenueCategory, VenueAmenity, VenueImage, 
    VenueAvailability, VenueBooking, VenueReview
)
from .serializers import (
    VenueSerializer, VenueDetailSerializer, VenueCategorySerializer,
    VenueAmenitySerializer, VenueImageSerializer, VenueAvailabilitySerializer,
    VenueBookingSerializer, VenueReviewSerializer
)
from users.permissions import IsOwnerOrReadOnly, IsVenueOwnerOrReadOnly
import logging

logger = logging.getLogger(__name__)

class VenueCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for venue categories (read-only).
    """
    queryset = VenueCategory.objects.all()
    serializer_class = VenueCategorySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

class VenueAmenityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for venue amenities (read-only).
    """
    queryset = VenueAmenity.objects.all()
    serializer_class = VenueAmenitySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

class VenueViewSet(viewsets.ModelViewSet):
    """
    API endpoint for venues.
    """
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsVenueOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'address', 'city', 'state']
    ordering_fields = ['name', 'created_at', 'hourly_rate', 'capacity']
    ordering = ['name']
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return Venue.objects.none()
            
        queryset = Venue.objects.filter(is_active=True)
        
        # Filter by active status (admin can see inactive venues)
        if self.request.user.is_staff:
            is_active = self.request.query_params.get('is_active')
            if is_active is not None:
                is_active = is_active.lower() == 'true'
                queryset = Venue.objects.filter(is_active=is_active)
        
        # Filter by owner
        owner = self.request.query_params.get('owner')
        if owner:
            queryset = queryset.filter(owner__id=owner)
        
        # Filter by verification status
        is_verified = self.request.query_params.get('is_verified')
        if is_verified is not None:
            is_verified = is_verified.lower() == 'true'
            queryset = queryset.filter(is_verified=is_verified)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(categories__id=category)
        
        # Filter by amenity
        amenity = self.request.query_params.get('amenity')
        if amenity:
            queryset = queryset.filter(amenities__id=amenity)
        
        # Filter by location
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        state = self.request.query_params.get('state')
        if state:
            queryset = queryset.filter(state__icontains=state)
        
        # Filter by capacity
        min_capacity = self.request.query_params.get('min_capacity')
        if min_capacity:
            queryset = queryset.filter(capacity__gte=min_capacity)
        
        max_capacity = self.request.query_params.get('max_capacity')
        if max_capacity:
            queryset = queryset.filter(capacity__lte=max_capacity)
        
        # Filter by price
        min_price = self.request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(hourly_rate__gte=min_price)
        
        max_price = self.request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(hourly_rate__lte=max_price)
        
        # Filter by rating
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.annotate(avg_rating=Avg('reviews__rating')).filter(avg_rating__gte=min_rating)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return VenueDetailSerializer
        return VenueSerializer
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def review(self, request, pk=None):
        """
        API endpoint to review a venue.
        """
        venue = self.get_object()
        
        # Check if already reviewed
        existing_review = VenueReview.objects.filter(venue=venue, user=request.user).first()
        if existing_review:
            return Response({'message': 'You have already reviewed this venue.'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = VenueReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(venue=venue, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VenueImageViewSet(viewsets.ModelViewSet):
    """
    API endpoint for venue images.
    """
    serializer_class = VenueImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsVenueOwnerOrReadOnly]
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return VenueImage.objects.none()
            
        venue_id = self.kwargs.get('venue_pk')
        if venue_id:
            return VenueImage.objects.filter(venue_id=venue_id)
        return VenueImage.objects.none()
    
    def perform_create(self, serializer):
        venue_id = self.kwargs.get('venue_pk')
        venue = Venue.objects.get(pk=venue_id)
        
        # Check if setting as primary and update existing primary image
        if serializer.validated_data.get('is_primary', False):
            VenueImage.objects.filter(venue=venue, is_primary=True).update(is_primary=False)
        
        serializer.save(venue=venue)

class VenueAvailabilityViewSet(viewsets.ModelViewSet):
    """
    API endpoint for venue availability.
    """
    serializer_class = VenueAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsVenueOwnerOrReadOnly]
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return VenueAvailability.objects.none()
            
        venue_id = self.kwargs.get('venue_pk')
        if venue_id:
            return VenueAvailability.objects.filter(venue_id=venue_id)
        return VenueAvailability.objects.none()
    
    def perform_create(self, serializer):
        venue_id = self.kwargs.get('venue_pk')
        venue = Venue.objects.get(pk=venue_id)
        serializer.save(venue=venue)

class VenueBookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for venue bookings.
    """
    serializer_class = VenueBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return VenueBooking.objects.none()
            
        if self.request.user.is_staff:
            return VenueBooking.objects.all()
        
        venue_id = self.kwargs.get('venue_pk')
        
        if venue_id:
            venue = Venue.objects.get(pk=venue_id)
            # Venue owners can see all bookings for their venues
            if venue.owner == self.request.user:
                return VenueBooking.objects.filter(venue=venue)
            # Others can only see their own bookings
            return VenueBooking.objects.filter(venue=venue, booker=self.request.user)
        
        # Return all bookings booked by the user or for venues owned by the user
        return VenueBooking.objects.filter(
            Q(booker=self.request.user) | Q(venue__owner=self.request.user)
        )
    
    def perform_create(self, serializer):
        try:
            venue_id = self.kwargs.get('venue_pk')
            venue = Venue.objects.get(pk=venue_id)
            
            # Calculate total price
            booking_date = serializer.validated_data.get('booking_date')
            start_time = serializer.validated_data.get('start_time')
            end_time = serializer.validated_data.get('end_time')
            
            # Convert time objects to hours
            start_hour = start_time.hour + start_time.minute / 60
            end_hour = end_time.hour + end_time.minute / 60
            
            # Calculate duration in hours
            duration = end_hour - start_hour
            if duration < 0:  # Handle overnight bookings
                duration += 24
            
            # Check minimum booking duration
            if duration < venue.min_booking_hours:
                from rest_framework import serializers
                raise serializers.ValidationError(f"Minimum booking duration is {venue.min_booking_hours} hours")
            
            # Calculate total price using Decimal to avoid type errors
            total_price = venue.hourly_rate * Decimal(str(duration))
            
            # Check if venue is available for booking
            day_of_week = booking_date.weekday()
            availability = VenueAvailability.objects.filter(
                venue=venue, 
                day_of_week=day_of_week,
                is_available=True
            ).first()
            
            # Default to the venue's first availability if no match for the specific day
            if not availability:
                # Look for any availability for this venue
                any_availability = VenueAvailability.objects.filter(
                    venue=venue,
                    is_available=True
                ).first()
                
                if any_availability:
                    # Use that availability for opening/closing time checks
                    availability = any_availability
                else:
                    from rest_framework import serializers
                    raise serializers.ValidationError(f"Venue is not available on the selected day")
            
            # Check if booking time is within venue's opening hours
            if start_time < availability.opening_time or end_time > availability.closing_time:
                from rest_framework import serializers
                raise serializers.ValidationError(
                    f"Booking time must be between {availability.opening_time} and {availability.closing_time}"
                )
            
            # Check for overlapping bookings
            overlapping_bookings = VenueBooking.objects.filter(
                venue=venue,
                booking_date=booking_date,
                status__in=['pending', 'confirmed'],
            ).filter(
                Q(start_time__lt=end_time, end_time__gt=start_time)
            )
            
            if overlapping_bookings.exists():
                from rest_framework import serializers
                raise serializers.ValidationError("This time slot is already booked")
            
            # All validation passed, save the booking
            serializer.save(venue=venue, booker=self.request.user, total_price=total_price)
            
        except Venue.DoesNotExist:
            from rest_framework import serializers
            raise serializers.ValidationError("Venue not found")
        except Exception as e:
            logger.error(f"Error creating booking: {str(e)}")
            from rest_framework import serializers
            if hasattr(e, 'detail'):
                # If it's already a DRF validation error, re-raise it
                raise e
            else:
                # Otherwise, wrap it in a ValidationError
                raise serializers.ValidationError(f"Error creating booking: {str(e)}")
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        """
        API endpoint to cancel a booking.
        """
        booking = self.get_object()
        
        # Check if the booking can be cancelled
        if booking.status == 'cancelled':
            return Response({'message': 'Booking is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if booking.status == 'completed':
            return Response({'message': 'Cannot cancel a completed booking.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update booking status
        booking.status = 'cancelled'
        booking.save()
        
        return Response({'message': 'Booking cancelled successfully.'}, status=status.HTTP_200_OK)

class VenueReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint for venue reviews.
    """
    serializer_class = VenueReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return VenueReview.objects.none()
            
        venue_id = self.kwargs.get('venue_pk')
        if venue_id:
            return VenueReview.objects.filter(venue_id=venue_id)
        return VenueReview.objects.none()
    
    def perform_create(self, serializer):
        venue_id = self.kwargs.get('venue_pk')
        venue = Venue.objects.get(pk=venue_id)
        
        # Check if user has already reviewed this venue
        existing_review = VenueReview.objects.filter(venue=venue, user=self.request.user).first()
        if existing_review:
            from rest_framework import serializers
            raise serializers.ValidationError('You have already reviewed this venue.')
        
        serializer.save(venue=venue, user=self.request.user)