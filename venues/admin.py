from django.contrib import admin
from .models import (
    Venue, VenueCategory, VenueAmenity, VenueImage, 
    VenueAvailability, VenueBooking, VenueReview
)

@admin.register(VenueCategory)
class VenueCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(VenueAmenity)
class VenueAmenityAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'icon')
    search_fields = ('name',)

class VenueImageInline(admin.TabularInline):
    model = VenueImage
    extra = 1

class VenueAvailabilityInline(admin.TabularInline):
    model = VenueAvailability
    extra = 7

@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'city', 'capacity', 'hourly_rate', 'is_active', 'is_verified')
    list_filter = ('is_active', 'is_verified', 'categories', 'amenities')
    search_fields = ('name', 'description', 'owner__email', 'address', 'city')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [VenueImageInline, VenueAvailabilityInline]
    filter_horizontal = ('categories', 'amenities')

@admin.register(VenueBooking)
class VenueBookingAdmin(admin.ModelAdmin):
    list_display = ('venue', 'booker', 'booking_date', 'start_time', 'end_time', 'status', 'total_price')
    list_filter = ('status', 'booking_date')
    search_fields = ('venue__name', 'booker__email')
    date_hierarchy = 'booking_date'

@admin.register(VenueReview)
class VenueReviewAdmin(admin.ModelAdmin):
    list_display = ('venue', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('venue__name', 'user__email', 'comment')
    date_hierarchy = 'created_at'