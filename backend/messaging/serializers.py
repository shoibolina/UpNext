from rest_framework import serializers
from .models import Conversation, Message, ReadReceipt, MessageReaction, TypingIndicator
from users.serializers import UserSerializer

class MessageReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = MessageReaction
        fields = ['id', 'user', 'reaction', 'created_at']
        read_only_fields = ['id', 'created_at']

class ReadReceiptSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ReadReceipt
        fields = ['id', 'user', 'timestamp']
        read_only_fields = ['id', 'timestamp']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    reply_to = serializers.PrimaryKeyRelatedField(queryset=Message.objects.all(), required=False, allow_null=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)
    read_by = ReadReceiptSerializer(many=True, read_only=True, source='readreceipt_set')
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'created_at', 'edited_at', 
                  'reply_to', 'reactions', 'read_by']
        read_only_fields = ['id', 'sender', 'created_at', 'edited_at']
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['sender'] = user
        return super().create(validated_data)

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'created_at', 'updated_at', 'last_message', 'unread_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return MessageSerializer(last_message).data
        return None
    
    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.exclude(read_by=user).count()

class ConversationCreateSerializer(serializers.ModelSerializer):
    participants_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )
    initial_message = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = Conversation
        fields = ['id', 'participants_ids', 'initial_message']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        participants_ids = validated_data.pop('participants_ids')
        initial_message = validated_data.pop('initial_message', None)
        
        # Add the current user to the participants
        user = self.context['request'].user
        if user.id not in participants_ids:
            participants_ids.append(user.id)
        
        conversation = Conversation.objects.create(**validated_data)
        
        # Add participants
        from django.contrib.auth import get_user_model
        User = get_user_model()
        participants = User.objects.filter(id__in=participants_ids)
        conversation.participants.add(*participants)
        
        # Create initial message if provided
        if initial_message:
            Message.objects.create(
                conversation=conversation,
                sender=user,
                content=initial_message
            )
        
        return conversation

class TypingIndicatorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TypingIndicator
        fields = ['id', 'conversation', 'user', 'timestamp']
        read_only_fields = ['id', 'user', 'timestamp']