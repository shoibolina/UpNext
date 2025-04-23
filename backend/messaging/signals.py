from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

from .models import Message, ReadReceipt, MessageReaction


@receiver(post_save, sender=Message)
def update_conversation_on_message(sender, instance, created, **kwargs):
    """
    Update the conversation's updated_at timestamp when a new message is created.
    Also notify all users in the conversation to update their chat list.
    """
    if created:
        conversation = instance.conversation
        conversation.save()  # This will update the updated_at field
        
        # Get all participants
        participants = conversation.participants.all()
        
        # Get channel layer
        channel_layer = get_channel_layer()
        
        # Notify each participant to update their chat list
        for user in participants:
            # The user-specific channel group name, used to update their chat list
            user_group_name = f"user_{user.id}_updates"
            
            # Send update notification
            async_to_sync(channel_layer.group_send)(
                user_group_name,
                {
                    "type": "update_chat_list",
                    "conversation_id": conversation.id
                }
            )


@receiver(post_save, sender=ReadReceipt)
def update_conversation_on_read_receipt(sender, instance, created, **kwargs):
    """
    Notify users to update their chat list when a message is read.
    """
    if created:
        message = instance.message
        conversation = message.conversation
        
        # Get the message sender
        sender = message.sender
        
        # Get channel layer
        channel_layer = get_channel_layer()
        
        # Notify the message sender to update their chat list (for unread count)
        user_group_name = f"user_{sender.id}_updates"
        
        # Send update notification
        async_to_sync(channel_layer.group_send)(
            user_group_name,
            {
                "type": "update_chat_list",
                "conversation_id": conversation.id
            }
        )


@receiver(post_save, sender=MessageReaction)
def update_conversation_on_reaction(sender, instance, created, **kwargs):
    """
    Notify users to update their message when a reaction is added.
    """
    message = instance.message
    conversation = message.conversation
    
    # Get channel layer
    channel_layer = get_channel_layer()
    
    # The conversation-specific channel group name
    conversation_group_name = f"chat_{conversation.id}"
    
    # Send update notification
    async_to_sync(channel_layer.group_send)(
        conversation_group_name,
        {
            "type": "message_reaction",
            "message_id": message.id,
            "user_id": instance.user.id,
            "username": instance.user.username,
            "reaction": instance.reaction
        }
    )