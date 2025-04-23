from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('phone_number', 'address', 'city', 'state', 'zip_code', 'interests')
        read_only_fields = ('interests',)

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    profile_picture_url = serializers.SerializerMethodField()
    cover_photo_url = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                  'bio', 'profile_picture', 'profile_picture_url', 
                  'cover_photo', 'cover_photo_url', 'is_event_organizer', 
                  'is_venue_owner', 'date_joined', 'profile', 
                  'followers_count', 'following_count', 'is_following')
        read_only_fields = ('id', 'date_joined', 'profile_picture_url', 'cover_photo_url', 
                           'followers_count', 'following_count', 'is_following')
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None
    
    def get_cover_photo_url(self, obj):
        if obj.cover_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_photo.url)
            return obj.cover_photo.url
        return None
    
    def get_followers_count(self, obj):
        return obj.followers.count()
    
    def get_following_count(self, obj):
        return obj.following.count()
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(id=request.user.id).exists()
        return False
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if profile_data:
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return instance

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 
                  'last_name', 'bio', 'profile_picture', 'cover_photo', 
                  'is_event_organizer', 'is_venue_owner', 'profile')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        profile_data = validated_data.pop('profile', None)
        
        user = User.objects.create_user(**validated_data)
        if profile_data:
            profile = user.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return user