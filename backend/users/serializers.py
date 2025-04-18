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
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                  'bio', 'profile_picture', 'profile_picture_url', 
                  'cover_photo', 'cover_photo_url', 'is_event_organizer', 
                  'is_venue_owner', 'date_joined', 'profile')
        read_only_fields = ('id', 'date_joined', 'profile_picture_url', 'cover_photo_url')
    
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
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        # Update User instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update Profile if provided
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
        # Check that password entries match
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        # Remove second password and profile data from creating the user
        validated_data.pop('password2')
        profile_data = validated_data.pop('profile', None)
        
        # Create the user
        user = User.objects.create_user(**validated_data)
        
        # Update Profile if provided
        if profile_data:
            profile = user.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return user