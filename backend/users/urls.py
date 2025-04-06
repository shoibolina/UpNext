from django.urls import path
from django.contrib.auth import views as auth_views

urlpatterns = [
    path("api/password-reset/", auth_views.PasswordResetView.as_view(), name="password_reset"),
]