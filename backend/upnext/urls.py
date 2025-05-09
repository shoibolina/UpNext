from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from django.contrib.auth import views as auth_views
from users.views import init_csrf
from users.views import PasswordResetRequestView, PasswordResetConfirmView
from messaging.views import ConversationViewSet

# App views
from users.views import UserViewSet, RegisterView, UserProfileViewSet
from events.views import (
    EventViewSet,
    EventCategoryViewSet,
    EventAttendeeViewSet,
    EventCommentViewSet,
    EventImageViewSet,
)
from venues.views import (
    VenueViewSet,
    VenueCategoryViewSet,
    VenueAmenityViewSet,
    VenueImageViewSet,
    VenueAvailabilityViewSet,
    VenueBookingViewSet,
    VenueReviewViewSet,
)

# New ticket views
from tickets.views import TicketViewSet, TicketVerificationViewSet

# Create API schema
schema_view = get_schema_view(
    openapi.Info(
        title="UpNext API",
        default_version="v1",
        description="API for the UpNext event management platform",
        terms_of_service="https://www.upnext.com/terms/",
        contact=openapi.Contact(email="contact@upnext.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

# Create router
router = routers.DefaultRouter()

# Register user routes
router.register(r"users", UserViewSet)
router.register(r"profiles", UserProfileViewSet)

# Register event routes
router.register(r"events", EventViewSet)
router.register(r"event-categories", EventCategoryViewSet)

# Register venue routes
router.register(r"venues", VenueViewSet)
router.register(r"venue-categories", VenueCategoryViewSet)
router.register(r"venue-amenities", VenueAmenityViewSet)
router.register(r"venue-bookings", VenueBookingViewSet, basename="venuebooking")
router.register(r"conversations", ConversationViewSet, basename="conversation")

# Register ticket routes
router.register(r"tickets", TicketViewSet, basename="ticket")
router.register(
    r"ticket-verifications", TicketVerificationViewSet, basename="ticket-verification"
)

# URL patterns
urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # API documentation
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    # Authentication
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/register/", RegisterView.as_view(), name="register"),
    # API v1
    path("api/v1/", include(router.urls)),
    # Nested routes
    path(
        "api/v1/events/<int:event_pk>/attendees/",
        EventAttendeeViewSet.as_view({"get": "list"}),
        name="event-attendees",
    ),
    path(
        "api/v1/events/<int:event_pk>/comments/",
        EventCommentViewSet.as_view({"get": "list", "post": "create"}),
        name="event-comments",
    ),
    # Event Images routes
    path(
        "api/v1/events/<int:event_pk>/images/",
        EventImageViewSet.as_view({"get": "list", "post": "create"}),
        name="event-images",
    ),
    path(
        "api/v1/events/<int:event_pk>/images/<int:pk>/",
        EventImageViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}),
        name="event-image-detail",
    ),
    path(
        "api/v1/events/<int:event_pk>/images/<int:pk>/set-primary/",
        EventImageViewSet.as_view({"patch": "set_primary"}),
        name="event-image-set-primary",
    ),
    path(
        "api/v1/events/<int:event_pk>/images/<int:pk>/delete-image/",
        EventImageViewSet.as_view({"delete": "delete_image"}),
        name="event-image-delete-image",
    ),
    # Venue routes
    path(
        "api/v1/venues/<int:venue_pk>/images/",
        VenueImageViewSet.as_view({"get": "list", "post": "create"}),
        name="venue-images",
    ),
    path(
        "api/v1/venues/<int:venue_pk>/availability/",
        VenueAvailabilityViewSet.as_view({"get": "list", "post": "create"}),
        name="venue-availability",
    ),
    path(
        "api/v1/venues/<int:venue_pk>/bookings/",
        VenueBookingViewSet.as_view({"get": "list", "post": "create"}),
        name="venue-bookings",
    ),
    path(
        "api/v1/venues/<int:venue_pk>/reviews/",
        VenueReviewViewSet.as_view({"get": "list", "post": "create"}),
        name="venue-reviews",
    ),
    path(
        "api/v1/venues/<int:pk>/all-bookings/",
        VenueViewSet.as_view({"get": "all_bookings"}),
        name="venue-all-bookings",
    ),
    # Ticket-specific routes
    path(
        "api/v1/events/<int:event_pk>/tickets/",
        TicketViewSet.as_view({"get": "list"}),
        name="event-tickets",
    ),
    # Auth
    path("api-auth/", include("rest_framework.urls")),
    # password reset

    path("api/password-reset-request/", PasswordResetRequestView.as_view()),
    # path("password-reset/", CustomPasswordResetView.as_view(), name="password_reset"),
    path(
        "api/password-reset/",
        auth_views.PasswordResetView.as_view(),
        name="password_reset",
    ),
    path(
        "api/password-reset/done/",
        auth_views.PasswordResetDoneView.as_view(),
        name="password_reset_done",
    ),
    path("api/password-reset-confirm/<uidb64>/<token>/", PasswordResetConfirmView.as_view()),
    # CSRF endpoint
    path("api/", include("users.urls")),
    path("api/v1/", include("messaging.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)