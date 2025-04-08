from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from django.db.models import Q, Avg
from .models import (
    Venue,
    VenueCategory,
    VenueAmenity,
    VenueImage,
    VenueAvailability,
    VenueBooking,
    VenueReview,
)
from .serializers import (
    VenueSerializer,
    VenueDetailSerializer,
    VenueCategorySerializer,
    VenueAmenitySerializer,
    VenueImageSerializer,
    VenueAvailabilitySerializer,
    VenueBookingSerializer,
    VenueReviewSerializer,
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
    search_fields = ["name", "description"]


class VenueAmenityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for venue amenities (read-only).
    """

    queryset = VenueAmenity.objects.all()
    serializer_class = VenueAmenitySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description"]


class VenueViewSet(viewsets.ModelViewSet):
    """
    API endpoint for venues.
    """

    # lookup_field = "id"

    # queryset = Venue.objects.all()
    queryset = Venue.objects.filter(is_active=True)

    serializer_class = VenueSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsVenueOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "address", "city", "state"]
    ordering_fields = ["name", "created_at", "hourly_rate", "capacity"]
    ordering = ["name"]

    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, "swagger_fake_view", False):
            return Venue.objects.none()

        # queryset = Venue.objects.filter(is_active=True)
        queryset = Venue.objects.all()

        # Public list view should show only active venues
        if self.action == "list" and not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)

        # Filter by active status (admin can see inactive venues)
        if self.request.user.is_staff:
            is_active = self.request.query_params.get("is_active")
            if is_active is not None:
                is_active = is_active.lower() == "true"
                queryset = Venue.objects.filter(is_active=is_active)

        # Filter by owner
        # owner = self.request.query_params.get("owner")
        # if owner:
        #     queryset = queryset.filter(owner__id=owner)
        owner = self.request.query_params.get("owner")
        if owner == "true" and self.request.user.is_authenticated:
            queryset = queryset.filter(owner=self.request.user)
        elif owner:
            queryset = queryset.filter(owner__id=owner)

        # Filter by verification status
        is_verified = self.request.query_params.get("is_verified")
        if is_verified is not None:
            is_verified = is_verified.lower() == "true"
            queryset = queryset.filter(is_verified=is_verified)

        # Filter by category
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(categories__id=category)

        # Filter by amenity
        amenity = self.request.query_params.get("amenity")
        if amenity:
            queryset = queryset.filter(amenities__id=amenity)

        # Filter by location
        city = self.request.query_params.get("city")
        if city:
            queryset = queryset.filter(city__icontains=city)

        state = self.request.query_params.get("state")
        if state:
            queryset = queryset.filter(state__icontains=state)

        # Filter by capacity
        min_capacity = self.request.query_params.get("min_capacity")
        if min_capacity:
            queryset = queryset.filter(capacity__gte=min_capacity)

        max_capacity = self.request.query_params.get("max_capacity")
        if max_capacity:
            queryset = queryset.filter(capacity__lte=max_capacity)

        # Filter by price
        min_price = self.request.query_params.get("min_price")
        if min_price:
            queryset = queryset.filter(hourly_rate__gte=min_price)

        max_price = self.request.query_params.get("max_price")
        if max_price:
            queryset = queryset.filter(hourly_rate__lte=max_price)

        # Filter by rating
        min_rating = self.request.query_params.get("min_rating")
        if min_rating:
            queryset = queryset.annotate(avg_rating=Avg("reviews__rating")).filter(
                avg_rating__gte=min_rating
            )

        return queryset

    def get_serializer_class(self):
        if self.action == "retrieve":
            return VenueDetailSerializer
        return VenueSerializer

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def review(self, request, pk=None):
        """
        API endpoint to review a venue.
        """
        venue = self.get_object()

        # Check if already reviewed
        existing_review = VenueReview.objects.filter(
            venue=venue, user=request.user
        ).first()
        if existing_review:
            return Response(
                {"message": "You have already reviewed this venue."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = VenueReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(venue=venue, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # made additions here
    @action(
        detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated]
    )
    def my(self, request):
        """
        List venues owned by the logged-in user.
        """
        user = request.user
        # queryset = self.get_queryset().filter(owner=user)
        queryset = Venue.objects.filter(owner=user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(
        detail=True, methods=["patch"], permission_classes=[permissions.IsAuthenticated]
    )
    def toggle_active(self, request, pk=None):
        """
        Activate or deactivate a venue.
        """
        venue = self.get_object()
        if venue.owner != request.user:
            return Response(
                {"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN
            )

        venue.is_active = not venue.is_active
        venue.save()
        serializer = self.get_serializer(venue)
        return Response(serializer.data)

    @action(
        detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated]
    )
    def all_bookings(self, request, pk=None):
        """
        Return bookings for this venue.
        - If owner: return all bookings.
        - Else: return only current user's bookings for this venue.
        """
        venue = self.get_object()
        user = request.user

        # if venue.owner == user:
        #     bookings = venue.bookings.select_related("booker").all()
        # else:
        #     bookings = venue.bookings.filter(booker=user)

        bookings = venue.bookings.filter(status="confirmed").select_related("booker")

        logger.info(
            f"[all_bookings] {user.username} - Owner: {venue.owner == user} - Total: {bookings.count()}"
        )

        serializer = VenueBookingSerializer(bookings, many=True)
        return Response(serializer.data)


class VenueImageViewSet(viewsets.ModelViewSet):
    """
    API endpoint for venue images.
    """

    serializer_class = VenueImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsVenueOwnerOrReadOnly]

    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, "swagger_fake_view", False):
            return VenueImage.objects.none()

        venue_id = self.kwargs.get("venue_pk")
        if venue_id:
            return VenueImage.objects.filter(venue_id=venue_id)
        return VenueImage.objects.none()

    def perform_create(self, serializer):
        venue_id = self.kwargs.get("venue_pk")
        venue = Venue.objects.get(pk=venue_id)

        # Check if setting as primary and update existing primary image
        if serializer.validated_data.get("is_primary", False):
            VenueImage.objects.filter(venue=venue, is_primary=True).update(
                is_primary=False
            )

        serializer.save(venue=venue)


class VenueAvailabilityViewSet(viewsets.ModelViewSet):
    """
    API endpoint for venue availability.
    """

    serializer_class = VenueAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsVenueOwnerOrReadOnly]

    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, "swagger_fake_view", False):
            return VenueAvailability.objects.none()

        venue_id = self.kwargs.get("venue_pk")
        if venue_id:
            return VenueAvailability.objects.filter(venue_id=venue_id)
        return VenueAvailability.objects.none()

    def perform_create(self, serializer):
        venue_id = self.kwargs.get("venue_pk")
        venue = Venue.objects.get(pk=venue_id)
        serializer.save(venue=venue)


class VenueBookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for venue bookings.
    """

    queryset = VenueBooking.objects.all()
    serializer_class = VenueBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, "swagger_fake_view", False):
            return VenueBooking.objects.none()

        if self.request.user.is_staff:
            return VenueBooking.objects.all()

        venue_id = self.kwargs.get("venue_pk")

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
            venue_id = self.kwargs.get("venue_pk")
            venue = Venue.objects.get(pk=venue_id)

            # Calculate total price
            booking_date = serializer.validated_data.get("booking_date")
            start_time = serializer.validated_data.get("start_time")
            end_time = serializer.validated_data.get("end_time")

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

                raise serializers.ValidationError(
                    f"Minimum booking duration is {venue.min_booking_hours} hours"
                )

            # Calculate total price using Decimal to avoid type errors
            total_price = venue.hourly_rate * Decimal(str(duration))

            # Check if venue is available for booking
            day_of_week = booking_date.weekday()
            availability = VenueAvailability.objects.filter(
                venue=venue, day_of_week=day_of_week, is_available=True
            ).first()

            # Default to the venue's first availability if no match for the specific day
            if not availability:
                # Look for any availability for this venue
                any_availability = VenueAvailability.objects.filter(
                    venue=venue, is_available=True
                ).first()

                if any_availability:
                    # Use that availability for opening/closing time checks
                    availability = any_availability
                else:
                    from rest_framework import serializers

                    raise serializers.ValidationError(
                        f"Venue is not available on the selected day"
                    )

            # Check if booking time is within venue's opening hours
            if (
                start_time < availability.opening_time
                or end_time > availability.closing_time
            ):
                from rest_framework import serializers

                raise serializers.ValidationError(
                    f"Booking time must be between {availability.opening_time} and {availability.closing_time}"
                )

            # Check for overlapping bookings
            overlapping_bookings = VenueBooking.objects.filter(
                venue=venue,
                booking_date=booking_date,
                status__in=["pending", "confirmed"],
            ).filter(Q(start_time__lt=end_time, end_time__gt=start_time))

            if overlapping_bookings.exists():
                from rest_framework import serializers

                raise serializers.ValidationError("This time slot is already booked")

            # All validation passed, save the booking
            serializer.save(
                venue=venue,
                booker=self.request.user,
                total_price=total_price,
                status="confirmed",
            )

        except Venue.DoesNotExist:
            from rest_framework import serializers

            raise serializers.ValidationError("Venue not found")
        except Exception as e:
            logger.error(f"Error creating booking: {str(e)}")
            from rest_framework import serializers

            if hasattr(e, "detail"):
                # If it's already a DRF validation error, re-raise it
                raise e
            else:
                # Otherwise, wrap it in a ValidationError
                raise serializers.ValidationError(f"Error creating booking: {str(e)}")

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def cancel(self, request, pk=None):
        """
        API endpoint to cancel a booking.
        """
        booking = self.get_object()

        # Check if the booking can be cancelled
        if booking.status == "cancelled":
            return Response(
                {"message": "Booking is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.status == "completed":
            return Response(
                {"message": "Cannot cancel a completed booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update booking status
        booking.status = "cancelled"
        booking.save()

        return Response(
            {"message": "Booking cancelled successfully."}, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my(self, request):
        user = request.user

        bookings = self.queryset.filter(
            Q(booker=user) | Q(venue__owner=user), status__in=["confirmed", "cancelled"]
        ).select_related("venue", "booker", "venue__owner")

        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)


class VenueReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint for venue reviews.
    """

    serializer_class = VenueReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, "swagger_fake_view", False):
            return VenueReview.objects.none()

        venue_id = self.kwargs.get("venue_pk")
        if venue_id:
            return VenueReview.objects.filter(venue_id=venue_id)
        return VenueReview.objects.none()

    def perform_create(self, serializer):
        venue_id = self.kwargs.get("venue_pk")
        venue = Venue.objects.get(pk=venue_id)

        # Check if user has already reviewed this venue
        existing_review = VenueReview.objects.filter(
            venue=venue, user=self.request.user
        ).first()
        if existing_review:
            from rest_framework import serializers

            raise serializers.ValidationError("You have already reviewed this venue.")

        serializer.save(venue=venue, user=self.request.user)
