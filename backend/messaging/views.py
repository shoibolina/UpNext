from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, OuterRef, Subquery, Count
from django.contrib.auth import get_user_model

from .models import Conversation, Message, ReadReceipt, MessageReaction, TypingIndicator
from .serializers import (
    ConversationSerializer, 
    ConversationCreateSerializer,
    MessageSerializer, 
    ReadReceiptSerializer, 
    MessageReactionSerializer,
    TypingIndicatorSerializer
)

User = get_user_model()

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(participants=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ConversationCreateSerializer
        return self.serializer_class
    
    @action(detail=False, methods=['post'])
    def get_or_create_direct_chat(self, request):
        """
        Get or create a direct conversation with another user.
        """
        other_user_id = request.data.get('user_id')
        if not other_user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)
        
        # Find existing direct conversation between the two users
        user = request.user
        conversations = Conversation.objects.filter(participants=user)
        for conversation in conversations:
            participants = conversation.participants.all()
            if participants.count() == 2 and other_user in participants:
                serializer = self.get_serializer(conversation)
                return Response(serializer.data)
        
        # Create new conversation if one doesn't exist
        conversation = Conversation.objects.create()
        conversation.participants.add(user, other_user)
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        conversation_id = self.kwargs.get('conversation_pk')
        
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, participants=user)
                return Message.objects.filter(conversation=conversation).order_by('-created_at')
            except Conversation.DoesNotExist:
                return Message.objects.none()
        
        return Message.objects.filter(conversation__participants=user).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        conversation_id = self.kwargs.get('conversation_pk')
        if not conversation_id:
            return Response(
                {"error": "conversation_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is a participant in the conversation
        user = request.user
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=user)
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation does not exist or you are not a participant"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Add conversation to request data
        request.data['conversation'] = conversation_id
        
        return super().create(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None, **kwargs):
        """
        Mark a message as read by the current user.
        """
        message = self.get_object()
        user = request.user
        
        # Create read receipt if it doesn't exist
        ReadReceipt.objects.get_or_create(message=message, user=user)
        
        # Mark all previous messages in the conversation as read
        earlier_messages = Message.objects.filter(
            conversation=message.conversation,
            created_at__lte=message.created_at
        ).exclude(read_by=user)
        
        for msg in earlier_messages:
            ReadReceipt.objects.get_or_create(message=msg, user=user)
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def edit(self, request, pk=None, **kwargs):
        """
        Edit a message.
        """
        message = self.get_object()
        
        # Only the sender can edit their message
        if message.sender != request.user:
            return Response(
                {"error": "You can only edit your own messages"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        content = request.data.get('content')
        if not content:
            return Response(
                {"error": "Content is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message.content = content
        message.edited_at = timezone.now()
        message.save()
        
        serializer = self.get_serializer(message)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def react(self, request, pk=None, **kwargs):
        """
        Add or update a reaction to a message.
        """
        message = self.get_object()
        user = request.user
        reaction = request.data.get('reaction')
        
        if not reaction:
            return Response(
                {"error": "Reaction is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate reaction type
        valid_reactions = [r[0] for r in Message.REACTIONS]
        if reaction not in valid_reactions:
            return Response(
                {"error": f"Invalid reaction. Must be one of: {', '.join(valid_reactions)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add or update reaction
        msg_reaction, created = MessageReaction.objects.update_or_create(
            message=message,
            user=user,
            defaults={'reaction': reaction}
        )
        
        serializer = MessageReactionSerializer(msg_reaction)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def remove_reaction(self, request, pk=None, **kwargs):
        """
        Remove a reaction from a message.
        """
        message = self.get_object()
        user = request.user
        
        try:
            reaction = MessageReaction.objects.get(message=message, user=user)
            reaction.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except MessageReaction.DoesNotExist:
            return Response(
                {"error": "You don't have a reaction on this message"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class TypingIndicatorViewSet(mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = TypingIndicatorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TypingIndicator.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        conversation_id = request.data.get('conversation')
        if not conversation_id:
            return Response(
                {"error": "Conversation ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is a participant in the conversation
        user = request.user
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=user)
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation does not exist or you are not a participant"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update or create typing indicator
        typing_indicator, created = TypingIndicator.objects.update_or_create(
            conversation=conversation,
            user=user,
            defaults={'timestamp': timezone.now()}
        )
        
        serializer = self.get_serializer(typing_indicator)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    def destroy(self, request, *args, **kwargs):
        conversation_id = request.data.get('conversation')
        if not conversation_id:
            return Response(
                {"error": "Conversation ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        TypingIndicator.objects.filter(conversation_id=conversation_id, user=user).delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)