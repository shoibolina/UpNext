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
import logging

logger = logging.getLogger(__name__)

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
    
    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """
        API endpoint to search users by username, first_name, or last_name.
        """
        search_term = request.query_params.get('q', request.query_params.get('query', '')).strip()
        if not search_term:
            return Response([], status=status.HTTP_200_OK)

        # Search users by username, first_name, or last_name (case-insensitive)
        users = User.objects.filter(
            username__icontains=search_term
        ) | User.objects.filter(
            first_name__icontains=search_term
        ) | User.objects.filter(
            last_name__icontains=search_term
        )

        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
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
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def follow(self, request, pk=None):
        """
        API endpoint to follow a user.
        """
        user_to_follow = self.get_object()
        if request.user.pk == user_to_follow.pk:
            error_msg = 'You cannot follow yourself'
            logger.error(f"Follow failed: {error_msg} (user_id={request.user.pk}, target_id={pk})")
            return Response({
                'status': 'error', 
                'message': error_msg
            }, status=status.HTTP_400_BAD_REQUEST)
            
        success = request.user.follow(user_to_follow)
        if success:
            logger.info(f"Follow successful: user_id={request.user.pk} followed target_id={pk}")
            # Serialize the updated target user
            serializer = self.get_serializer(user_to_follow, context={'request': request})
            return Response({
                'status': 'success', 
                'message': f'You are now following {user_to_follow.username}',
                'user': serializer.data
            })
        else:
            error_msg = 'Unable to follow user (possibly already following)'
            logger.error(f"Follow failed: {error_msg} (user_id={request.user.pk}, target_id={pk})")
            return Response({
                'status': 'error', 
                'message': error_msg
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unfollow(self, request, pk=None):
        """
        API endpoint to unfollow a user.
        """
        user_to_unfollow = self.get_object()
        request.user.unfollow(user_to_unfollow)
        logger.info(f"Unfollow successful: user_id={request.user.pk} unfollowed target_id={pk}")
        # Serialize the updated target user
        serializer = self.get_serializer(user_to_unfollow, context={'request': request})
        return Response({
            'status': 'success', 
            'message': f'You have unfollowed {user_to_unfollow.username}',
            'user': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def followers(self, request):
        """
        API endpoint to get the current user's followers.
        """
        followers = request.user.followers.all()
        serializer = self.get_serializer(followers, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def following(self, request):
        """
        API endpoint to get the users the current user is following.
        """
        following = request.user.following.all()
        serializer = self.get_serializer(following, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def user_followers(self, request, pk=None):
        """
        API endpoint to get a specific user's followers.
        """
        user = self.get_object()
        followers = user.followers.all()
        serializer = self.get_serializer(followers, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def user_following(self, request, pk=None):
        """
        API endpoint to get users a specific user is following.
        """
        user = self.get_object()
        following = user.following.all()
        serializer = self.get_serializer(following, many=True, context={'request': request})
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
        serializer = self.get_serializer(user, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['POST'], url_path='upload_cover_photo', parser_classes=[MultiPartParser, FormParser])
    def upload_cover_photo(self, request):
        """
        API endpoint to upload and update the user's cover photo.
        """
        user = request.user
        
        if 'cover_photo' not in request.FILES:
            return Response(
                {'detail': 'No image file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.cover_photo = request.FILES['cover_photo']
        user.save()
        
        serializer = self.get_serializer(user, context={'request': request})
        return Response(serializer.data)

class UserProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user profiles.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserProfile.objects.none()
            
        if self.request.user.is_staff:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=self.request.user)