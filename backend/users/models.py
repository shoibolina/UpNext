from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
import os
import time
import hashlib
from django.dispatch import receiver
from django.db.models.signals import pre_save


def profile_picture_upload_to(instance, filename):
    ext = os.path.splitext(filename)[1]
    timestamp = str(int(time.time()))
    base = f"{instance.id}{timestamp}"

    hashed = hashlib.sha256(base.encode()).hexdigest()[:16]

    return f"profile_pictures/{hashed}{ext}"


class User(AbstractUser):
    """
    Custom User model that extends Django's built-in AbstractUser model.
    """

    email = models.EmailField(_("email address"), unique=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to=profile_picture_upload_to,
        blank=True,
        null=True
    )
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


@receiver(pre_save, sender=User)
def auto_delete_old_profile_picture(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        old_instance = User.objects.get(pk=instance.pk)
    except User.DoesNotExist:
        return

    old_file = old_instance.profile_picture
    new_file = instance.profile_picture

    if old_file and new_file and old_file != new_file:
        if os.path.isfile(old_file.path):
            os.remove(old_file.path)
