from django.urls import path
#from django.contrib.auth import views as auth_views
from .views import PasswordResetRequestView, PasswordResetConfirmView

urlpatterns = [
    #path("api/password-reset/", auth_views.PasswordResetView.as_view(), name="password_reset"),
    path("password-reset-request/", PasswordResetRequestView.as_view()),
    path("password-reset-confirm/<uidb64>/<token>/", PasswordResetConfirmView.as_view()),
]