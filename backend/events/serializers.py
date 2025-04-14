from rest_framework import serializers
from .models import Event, EventCategory, EventAttendee, EventComment, EventImage
from users.serializers import UserSerializer

class EventCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EventCategory
        fields = ('id', 'name', 'description')

class EventCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = EventComment
        fields = ('id', 'event', 'user', 'content', 'created_at')
        read_only_fields = ('id', 'event', 'user', 'created_at')

class EventAttendeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = EventAttendee
        fields = ('id', 'event', 'user', 'status', 'registration_date')
        read_only_fields = ('id', 'event', 'user', 'registration_date')

class EventSerializer(serializers.ModelSerializer):
    organizer = UserSerializer(read_only=True)
    categories = EventCategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True,
        queryset=EventCategory.objects.all(),
        source='categories',
        required=False
    )
    attendees_count = serializers.SerializerMethodField()
    is_attending = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = (
            'id', 'title', 'slug', 'description', 'organizer', 'categories', 'category_ids',
            'start_date', 'start_time', 'end_date', 'end_time', 'venue', 'address',
            'recurrence', 'visibility', 'status', 'capacity', 'is_free', 'price',
            'image', 'created_at', 'updated_at', 'attendees_count', 'is_attending'
        )
        read_only_fields = ('id', 'slug', 'organizer', 'created_at', 'updated_at')
    
    def get_attendees_count(self, obj):
        return obj.attendees.filter(status='registered').count()
    
    def get_is_attending(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.attendees.filter(user=request.user, status='registered').exists()
        return False
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['organizer'] = request.user
        return super().create(validated_data)

class EventImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventImage
        fields = ('id', 'event', 'image', 'caption', 'is_primary')
        read_only_fields = ('id', 'event')

class EventDetailSerializer(EventSerializer):
    comments = EventCommentSerializer(many=True, read_only=True)
    attendees = EventAttendeeSerializer(many=True, read_only=True)
    images = EventImageSerializer(many=True, read_only=True)

    class Meta(EventSerializer.Meta):
        fields = EventSerializer.Meta.fields + ('comments', 'attendees', 'images')


