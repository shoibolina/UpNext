from django.db import models
from django.conf import settings
from django.utils.text import slugify


class VenueCategory(models.Model):
    """
    Categories for venues (e.g., Conference Hall, Theater, Restaurant).
    """

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Venue Categories"


class VenueAmenity(models.Model):
    """
    Amenities that venues can offer (e.g., WiFi, Parking, AV Equipment).
    """

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # For UI icons

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Venue Amenities"


class Venue(models.Model):
    """
    Main venue model containing all venue information.
    """

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField()
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_venues"
    )

    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default="United States")

    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )

    categories = models.ManyToManyField(VenueCategory, related_name="venues")
    amenities = models.ManyToManyField(VenueAmenity, related_name="venues")

    capacity = models.PositiveIntegerField()
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    min_booking_hours = models.PositiveIntegerField(default=1)

    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Generate slug if not provided
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class VenueImage(models.Model):
    """
    Images associated with venues.
    """

    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="venue_images/")
    caption = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.venue.name}"


class VenueAvailability(models.Model):
    """
    Tracks venue availability for booking.
    """

    venue = models.ForeignKey(
        Venue, on_delete=models.CASCADE, related_name="availability"
    )
    day_of_week = models.IntegerField(
        choices=[
            (i, day)
            for i, day in enumerate(
                [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                ]
            )
        ]
    )
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    repeat_weekly = models.BooleanField(default=True)

    class Meta:
        # unique_together = ("venue", "day_of_week")
        unique_together = ("venue", "day_of_week", "opening_time", "closing_time")

    def __str__(self):
        return f"{self.venue.name} - {self.get_day_of_week_display()}"


class VenueBooking(models.Model):
    """
    Tracks venue bookings.
    """

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
    )

    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="bookings")
    event = models.OneToOneField(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="venue_booking",
        null=True,
        blank=True,
    )
    booker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="venue_bookings",
    )

    booking_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.venue.name} booked by {self.booker.email} on {self.booking_date}"


class VenueReview(models.Model):
    """
    Reviews for venues.
    """

    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(
        choices=[(i, i) for i in range(1, 6)]
    )  # 1-5 rating
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("venue", "user")

    def __str__(self):
        return f"{self.rating}-star review for {self.venue.name} by {self.user.email}"
