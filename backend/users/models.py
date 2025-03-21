from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Custom User model that extends Django's built-in AbstractUser model.
    """

    email = models.EmailField(_("email address"), unique=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to="profile_pictures/", blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    is_event_organizer = models.BooleanField(default=False)
    is_venue_owner = models.BooleanField(default=False)

    # Using email as the username field
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    """
    Additional user profile information.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    interests = models.ManyToManyField("events.EventCategory", blank=True)

    def __str__(self):
        return f"{self.user.email}'s profile"