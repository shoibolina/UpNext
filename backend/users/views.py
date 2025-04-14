from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import UserProfile
from .serializers import UserSerializer, UserCreateSerializer, UserProfileSerializer
from .permissions import IsOwnerOrReadOnly
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.views import PasswordResetView

from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

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
    
    # T2
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def follow(self, request, pk=None):
        """
        Follow a user.
        """
        target_user = self.get_object()
        if target_user == request.user:
            return Response({'error': 'You cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        
        request.user.following.add(target_user)
        return Response({'message': f'You followed {target_user.email}'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unfollow(self, request, pk=None):
        """
        Unfollow a user.
        """
        target_user = self.get_object()
        request.user.following.remove(target_user)
        return Response({'message': f'You unfollowed {target_user.email}'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def suggest_friends_by_city(self, request):
        try:
            current_user = request.user
            # Check if user profile exists
            if not hasattr(current_user, 'profile'):
                return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
                
            # Check if city is set
            current_city = current_user.profile.city
            if not current_city:
                return Response({'message': 'No city set in your profile.'}, status=status.HTTP_204_NO_CONTENT)
            
            # Get suggestions
            city_profiles = get_friend_suggestions(current_user)
            
            # Filter out users you already follow
            already_following = current_user.following.all()
            city_profiles = city_profiles.exclude(user__in=already_following)
            
            # Create response data
            suggestions = []
            for profile in city_profiles:
                user_serializer = UserSerializer(profile.user, context={'request': request})
                suggestions.append({
                    'user': user_serializer.data,
                    'city': profile.city,
                })
                
            if not suggestions:
                return Response({'message': 'No new suggestions available.'}, status=status.HTTP_200_OK)
                
            return Response({'suggestions': suggestions})
            
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

def get_friend_suggestions(current_user):
    """
    Get friend suggestions for the current user based on city.
    """
    current_city = current_user.profile.city
    if not current_city:
        # If the current user's city is not set, return an empty
        return UserProfile.objects.none()

    suggestions = UserProfile.objects.filter(city=current_city).exclude(user=current_user)
    
    return suggestions