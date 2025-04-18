from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import UserProfile
from .serializers import UserSerializer, UserCreateSerializer, UserProfileSerializer
from .permissions import IsOwnerOrReadOnly
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.views import PasswordResetView


@ensure_csrf_cookie
def init_csrf(request):
    return JsonResponse({'detail': 'CSRF cookie set'})


User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    """
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user, context=self.get_serializer_context()).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for users.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return User.objects.none()
            
        queryset = User.objects.all()
        
        # Allow searching by username or email
        username = self.request.query_params.get('username', None)
        email = self.request.query_params.get('email', None)
        
        if username:
            queryset = queryset.filter(username__icontains=username)
        if email:
            queryset = queryset.filter(email__icontains=email)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        API endpoint to get the current user.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """
        API endpoint to update the current user.
        """
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['POST'], url_path='upload_profile_image', parser_classes=[MultiPartParser, FormParser])
    def upload_profile_image(self, request):
        """
        API endpoint to upload and update the user's profile image.
        """
        user = request.user
        
        # Check if profile_image is in the request data
        if 'profile_image' not in request.FILES:
            return Response(
                {'detail': 'No image file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the user's profile_picture field
        user.profile_picture = request.FILES['profile_image']
        user.save()
        
        # Return the updated user data
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['POST'], url_path='upload_cover_photo', parser_classes=[MultiPartParser, FormParser])
    def upload_cover_photo(self, request):
        """
        API endpoint to upload and update the user's cover photo.
        """
        user = request.user
        
        # Check if cover_photo is in the request data
        if 'cover_photo' not in request.FILES:
            return Response(
                {'detail': 'No image file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the user's cover_photo field
        user.cover_photo = request.FILES['cover_photo']
        user.save()
        
        # Return the updated user data
        serializer = self.get_serializer(user)
        return Response(serializer.data)

class UserProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user profiles.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return UserProfile.objects.none()
            
        if self.request.user.is_staff:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=self.request.user)