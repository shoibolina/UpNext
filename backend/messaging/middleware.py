from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import jwt
from urllib.parse import parse_qs

@database_sync_to_async
def get_user(user_id):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    """
    JWT authentication middleware for Django Channels.
    Extracts the JWT token from either:
    1. The request header (Authorization: Bearer <token>)
    2. Query parameters in the WebSocket URL (?token=<token>)
    """
    
    async def __call__(self, scope, receive, send):
        token = None
        
        # Try to get token from headers first
        headers = dict(scope['headers'])
        auth_header = headers.get(b'authorization', b'').decode('utf-8')
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        # If no token in headers, try query params
        if not token and scope['type'] == 'websocket':
            # Parse query string
            query_params = parse_qs(scope.get('query_string', b'').decode('utf-8'))
            token = query_params.get('token', [None])[0]
        
        # Validate token and get user
        if token:
            try:
                # Decode token
                payload = jwt.decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=[settings.SIMPLE_JWT.get('ALGORITHM', 'HS256')]
                )
                
                # Get user ID from payload
                user_id = payload.get(settings.SIMPLE_JWT.get('USER_ID_CLAIM', 'user_id'))
                
                if user_id:
                    # Get user from database
                    scope['user'] = await get_user(user_id)
                else:
                    scope['user'] = AnonymousUser()
            
            except (InvalidToken, TokenError, jwt.PyJWTError) as e:
                print(f"Token validation error: {str(e)}")
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)