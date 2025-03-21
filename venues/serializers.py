from rest_framework import serializers
from .models import (
    Venue, VenueCategory, VenueAmenity, VenueImage, 
    VenueAvailability, VenueBooking, VenueReview
)
from users.serializers import UserSerializer

class VenueCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueCategory
        fields = ('id', 'name', 'description')

class VenueAmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueAmenity
        fields = ('id', 'name', 'description', 'icon')

class VenueImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueImage
        fields = ('id', 'venue', 'image', 'caption', 'is_primary')
        read_only_fields = ('id', 'venue')

class VenueAvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = VenueAvailability
        fields = ('id', 'venue', 'day_of_week', 'day_name', 'opening_time', 'closing_time', 'is_available')
        read_only_fields = ('id', 'venue')

class VenueBookingSerializer(serializers.ModelSerializer):
    booker = UserSerializer(read_only=True)
    
    class Meta:
        model = VenueBooking
        fields = (
            'id', 'venue', 'event', 'booker', 'booking_date', 'start_time', 
            'end_time', 'total_price', 'status', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'venue', 'booker', 'total_price', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['booker'] = request.user
        return super().create(validated_data)

class VenueReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = VenueReview
        fields = ('id', 'venue', 'user', 'rating', 'comment', 'created_at')
        read_only_fields = ('id', 'venue', 'user', 'created_at')
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)

class VenueSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    categories = VenueCategorySerializer(many=True, read_only=True)
    amenities = VenueAmenitySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True,
        queryset=VenueCategory.objects.all(),
        source='categories',
        required=False
    )
    amenity_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True,
        queryset=VenueAmenity.objects.all(),
        source='amenities',
        required=False
    )
    primary_image = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Venue
        fields = (
            'id', 'name', 'slug', 'description', 'owner', 'address', 'city', 
            'state', 'zip_code', 'country', 'latitude', 'longitude', 
            'categories', 'category_ids', 'amenities', 'amenity_ids', 
            'capacity', 'hourly_rate', 'min_booking_hours', 'is_active', 
            'is_verified', 'created_at', 'updated_at', 'primary_image', 'rating'
        )
        read_only_fields = ('id', 'slug', 'owner', 'is_verified', 'created_at', 'updated_at')
    
    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return VenueImageSerializer(primary_image).data
        return None
    
    def get_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return None
        return sum(review.rating for review in reviews) / reviews.count()
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['owner'] = request.user
        return super().create(validated_data)

class VenueDetailSerializer(VenueSerializer):
    images = VenueImageSerializer(many=True, read_only=True)
    availability = VenueAvailabilitySerializer(many=True, read_only=True)
    reviews = VenueReviewSerializer(many=True, read_only=True)
    
    class Meta(VenueSerializer.Meta):
        fields = VenueSerializer.Meta.fields + ('images', 'availability', 'reviews')