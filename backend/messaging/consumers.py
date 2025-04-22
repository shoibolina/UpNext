import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Conversation, Message, ReadReceipt, MessageReaction, TypingIndicator
from django.contrib.auth import get_user_model
from django.db.models import Count, Max, Q, OuterRef, Subquery

User = get_user_model()


class ChatListConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time updates to the chat list.
    """
    async def connect(self):
        self.user = self.scope["user"]
        # Set the group name early to avoid issues in disconnect
        self.user_group_name = f"user_{self.user.id}_updates"
        
        # Anonymous users cannot connect
        if self.user.is_anonymous:
            await self.close()
            return
        
        # Add the user to their personal update group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        # Accept the connection
        await self.accept()
        
        # Send the initial chat list
        conversations = await self.get_conversations()
        await self.send(text_data=json.dumps({
            "type": "chat_list",
            "conversations": conversations
        }))

    async def disconnect(self, close_code):
        # Check if the attribute exists before using it
        if hasattr(self, 'user_group_name'):
            # Remove the user from their personal update group
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
    
    async def update_chat_list(self, event):
        """
        Handler for chat list update notifications.
        """
        # Get the updated conversation list
        conversations = await self.get_conversations()
        
        # Send the updated list to the WebSocket
        await self.send(text_data=json.dumps({
            "type": "chat_list",
            "conversations": conversations
        }))
    
    @database_sync_to_async
    def get_conversations(self):
        """
        Get all conversations for the current user with additional metadata.
        """
        # Get all conversations the user is a participant in
        conversations = Conversation.objects.filter(participants=self.user)
        
        # Annotate each conversation with additional data
        result = []
        for conversation in conversations:
            # Get participants excluding the current user
            other_participants = conversation.participants.exclude(id=self.user.id)
            participants_data = []
            for participant in other_participants:
                participants_data.append({
                    "id": participant.id,
                    "username": participant.username,
                    "profile_picture": participant.profile_picture.url if participant.profile_picture else None
                })
            
            # Get the last message
            last_message = conversation.messages.last()
            last_message_data = None
            if last_message:
                last_message_data = {
                    "id": last_message.id,
                    "content": last_message.content,
                    "sender_id": last_message.sender.id,
                    "sender_username": last_message.sender.username,
                    "created_at": last_message.created_at.isoformat(),
                    "is_read": ReadReceipt.objects.filter(message=last_message, user=self.user).exists()
                }
            
            # Count unread messages
            unread_count = conversation.messages.exclude(
                read_by=self.user
            ).count()
            
            # Add conversation data
            result.append({
                "id": conversation.id,
                "participants": participants_data,
                "last_message": last_message_data,
                "unread_count": unread_count,
                "updated_at": conversation.updated_at.isoformat()
            })
        
        # Sort by most recent activity
        result.sort(key=lambda x: x["updated_at"], reverse=True)
        
        return result

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        # Get the conversation ID from the URL route
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        # Set the group name early to avoid issues in disconnect
        self.conversation_group_name = f"chat_{self.conversation_id}"
        
        # Anonymous users cannot connect
        if self.user.is_anonymous:
            await self.close()
            return
        
        # Check if the user is a participant in this conversation
        is_participant = await self.is_conversation_participant(self.conversation_id, self.user.id)
        
        if not is_participant:
            await self.close()
            return
        
        # Add the user to the conversation group
        await self.channel_layer.group_add(
            self.conversation_group_name,
            self.channel_name
        )
        
        # Accept the connection
        await self.accept()
        
        # Notify other users that this user is now online
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                "type": "user_online",
                "user_id": self.user.id,
                "username": self.user.username
            }
        )
        
        # Send all the unread messages as read
        await self.mark_messages_as_read()

    async def disconnect(self, close_code):
        # Check if the attribute exists before using it
        if hasattr(self, 'conversation_group_name'):
            # Remove the user from the conversation group
            await self.channel_layer.group_discard(
                self.conversation_group_name,
                self.channel_name
            )
            
            # Notify other users that this user is now offline
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    "type": "user_offline",
                    "user_id": self.user.id,
                    "username": self.user.username
                }
            )
        
        # Remove typing indicator if it exists
        await self.remove_typing_indicator()
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")
        
        handler_methods = {
            "message": self.handle_message,
            "typing": self.handle_typing,
            "read_receipt": self.handle_read_receipt,
            "edit_message": self.handle_edit_message,
            "reaction": self.handle_reaction,
            "remove_reaction": self.handle_remove_reaction
        }
        
        handler = handler_methods.get(message_type)
        if handler:
            await handler(data)
    
    async def handle_message(self, data):
        content = data.get("content")
        reply_to_id = data.get("reply_to")
        
        if not content:
            return
        
        # Save the message
        message_id = await self.save_message(content, reply_to_id)
        
        # Send message to the group
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                "type": "chat_message",
                "message_id": message_id,
                "user_id": self.user.id,
                "username": self.user.username,
                "content": content,
                "timestamp": str(timezone.now()),
                "reply_to": reply_to_id
            }
        )
    

    async def handle_typing(self, data):
        is_typing = data.get("is_typing", False)
        
        # Debug logging to track the typing state
        print(f"User {self.user.username} typing status: {is_typing}")
        
        if is_typing:
            await self.set_typing_indicator()
        else:
            await self.remove_typing_indicator()
        
        # Send typing status to the group
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                "type": "typing_indicator",
                "user_id": self.user.id,
                "username": self.user.username,
                "is_typing": is_typing
            }
        )
    
    async def handle_read_receipt(self, data):
        message_id = data.get("message_id")
        
        if not message_id:
            return
        
        # Save read receipt
        await self.mark_message_as_read(message_id)
        
        # Send read receipt to the group
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                "type": "read_receipt",
                "user_id": self.user.id,
                "username": self.user.username,
                "message_id": message_id,
                "timestamp": str(timezone.now())
            }
        )
    
    async def handle_edit_message(self, data):
        message_id = data.get("message_id")
        content = data.get("content")
        
        if not message_id or not content:
            return
        
        # Update the message
        success = await self.update_message(message_id, content)
        
        if success:
            # Send edited message to the group
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    "type": "message_edited",
                    "message_id": message_id,
                    "user_id": self.user.id,
                    "username": self.user.username,
                    "content": content,
                    "timestamp": str(timezone.now())
                }
            )
    
    async def handle_reaction(self, data):
        message_id = data.get("message_id")
        reaction = data.get("reaction")
        
        if not message_id or not reaction:
            return
        
        # Save reaction
        success = await self.save_reaction(message_id, reaction)
        
        if success:
            # Send reaction to the group
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    "type": "message_reaction",
                    "message_id": message_id,
                    "user_id": self.user.id,
                    "username": self.user.username,
                    "reaction": reaction
                }
            )
    
    async def handle_remove_reaction(self, data):
        message_id = data.get("message_id")
        
        if not message_id:
            return
        
        # Remove reaction
        success = await self.remove_reaction(message_id)
        
        if success:
            # Send reaction removal to the group
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    "type": "remove_reaction",
                    "message_id": message_id,
                    "user_id": self.user.id,
                    "username": self.user.username
                }
            )
    
    # Event handlers
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "message",
            "message_id": event["message_id"],
            "user_id": event["user_id"],
            "username": event["username"],
            "content": event["content"],
            "timestamp": event["timestamp"],
            "reply_to": event.get("reply_to")
        }))
    
    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            "type": "typing",
            "user_id": event["user_id"],
            "username": event["username"],
            "is_typing": event["is_typing"]
        }))
    
    async def read_receipt(self, event):
        await self.send(text_data=json.dumps({
            "type": "read_receipt",
            "user_id": event["user_id"],
            "username": event["username"],
            "message_id": event["message_id"],
            "timestamp": event["timestamp"]
        }))
    
    async def message_edited(self, event):
        await self.send(text_data=json.dumps({
            "type": "edit_message",
            "message_id": event["message_id"],
            "user_id": event["user_id"],
            "username": event["username"],
            "content": event["content"],
            "timestamp": event["timestamp"]
        }))
    
    async def message_reaction(self, event):
        await self.send(text_data=json.dumps({
            "type": "reaction",
            "message_id": event["message_id"],
            "user_id": event["user_id"],
            "username": event["username"],
            "reaction": event["reaction"]
        }))
    
    async def remove_reaction(self, event):
        await self.send(text_data=json.dumps({
            "type": "remove_reaction",
            "message_id": event["message_id"],
            "user_id": event["user_id"],
            "username": event["username"]
        }))
    
    async def user_online(self, event):
        await self.send(text_data=json.dumps({
            "type": "user_status",
            "user_id": event["user_id"],
            "username": event["username"],
            "status": "online"
        }))
    
    async def user_offline(self, event):
        await self.send(text_data=json.dumps({
            "type": "user_status",
            "user_id": event["user_id"],
            "username": event["username"],
            "status": "offline"
        }))
    
    # Database operations
    @database_sync_to_async
    def is_conversation_participant(self, conversation_id, user_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            return conversation.participants.filter(id=user_id).exists()
        except Conversation.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, content, reply_to_id=None):
        conversation = Conversation.objects.get(id=self.conversation_id)
        
        # Get reply_to message if provided
        reply_to = None
        if reply_to_id:
            try:
                reply_to = Message.objects.get(id=reply_to_id)
            except Message.DoesNotExist:
                pass
        
        # Create message
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
            reply_to=reply_to
        )
        
        conversation.save()
        
        return message.id
    
    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        try:
            message = Message.objects.get(id=message_id)
            ReadReceipt.objects.get_or_create(message=message, user=self.user)
            return True
        except Message.DoesNotExist:
            return False
    
    @database_sync_to_async
    def mark_messages_as_read(self):
        # Mark all unread messages in the conversation as read
        conversation = Conversation.objects.get(id=self.conversation_id)
        unread_messages = Message.objects.filter(
            conversation=conversation
        ).exclude(read_by=self.user)
        
        for message in unread_messages:
            ReadReceipt.objects.get_or_create(message=message, user=self.user)
            
            # Send read receipt to the group for each message
            self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    "type": "read_receipt",
                    "user_id": self.user.id,
                    "username": self.user.username,
                    "message_id": message.id,
                    "timestamp": str(timezone.now())
                }
            )
    
    @database_sync_to_async
    def update_message(self, message_id, content):
        try:
            message = Message.objects.get(id=message_id, sender=self.user)
            message.content = content
            message.edited_at = timezone.now()
            message.save()
            return True
        except Message.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_reaction(self, message_id, reaction):
        try:
            message = Message.objects.get(id=message_id)
            
            # Validate reaction
            valid_reactions = [r[0] for r in Message.REACTIONS]
            if reaction not in valid_reactions:
                return False
            
            # Add or update reaction
            MessageReaction.objects.update_or_create(
                message=message,
                user=self.user,
                defaults={'reaction': reaction}
            )
            return True
        except Message.DoesNotExist:
            return False
    
    @database_sync_to_async
    def remove_reaction(self, message_id):
        try:
            message = Message.objects.get(id=message_id)
            MessageReaction.objects.filter(message=message, user=self.user).delete()
            return True
        except Message.DoesNotExist:
            return False
    
    @database_sync_to_async
    def set_typing_indicator(self):
        conversation = Conversation.objects.get(id=self.conversation_id)
        TypingIndicator.objects.update_or_create(
            conversation=conversation,
            user=self.user,
            defaults={'timestamp': timezone.now()}
        )
    
    @database_sync_to_async
    def remove_typing_indicator(self):
        if not hasattr(self, 'user') or not self.user or not getattr(self.user, 'is_authenticated', False):
            return
        TypingIndicator.objects.filter(
            conversation_id=self.conversation_id,
            user=self.user
        ).delete()

