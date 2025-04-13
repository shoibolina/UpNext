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
    followers = serializers.SerializerMethodField()
    following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'bio', 'profile_picture', 'is_event_organizer',
            'is_venue_owner', 'date_joined', 'profile',
            'followers', 'following',
        )
        read_only_fields = ('id', 'date_joined')

    def get_followers(self, obj):
        return [{'id': u.id, 'username': u.username} for u in obj.followers.all()]

    def get_following(self, obj):
        return [{'id': u.id, 'username': u.username} for u in obj.following.all()]

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
        fields = (
            'username', 'email', 'password', 'password2', 'first_name',
            'last_name', 'bio', 'profile_picture', 'is_event_organizer',
            'is_venue_owner', 'profile'
        )

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
