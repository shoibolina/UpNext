from django.contrib import admin
from .models import Conversation, Message, ReadReceipt, MessageReaction, TypingIndicator

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'updated_at', 'get_participants')
    search_fields = ('participants__username', 'participants__email')
    
    def get_participants(self, obj):
        return ", ".join([user.username for user in obj.participants.all()])
    get_participants.short_description = 'Participants'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'conversation', 'content', 'created_at', 'edited_at')
    list_filter = ('conversation', 'sender', 'created_at')
    search_fields = ('content', 'sender__username')

@admin.register(ReadReceipt)
class ReadReceiptAdmin(admin.ModelAdmin):
    list_display = ('id', 'message', 'user', 'timestamp')
    list_filter = ('user', 'timestamp')

@admin.register(MessageReaction)
class MessageReactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'message', 'user', 'reaction', 'created_at')
    list_filter = ('reaction', 'user', 'created_at')

@admin.register(TypingIndicator)
class TypingIndicatorAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'user', 'timestamp')
    list_filter = ('user', 'timestamp')