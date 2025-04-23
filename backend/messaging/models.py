from django.db import models
from django.conf import settings

class Conversation(models.Model):
    """
    A conversation between users.
    """
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        participants = self.participants.all()
        if participants.count() == 2:
            return f"Conversation between {participants[0].username} and {participants[1].username}"
        return f"Group conversation with {participants.count()} participants"

class Message(models.Model):
    """
    A message in a conversation.
    """
    REACTIONS = [
        ('like', '👍'),
        ('love', '❤️'),
        ('laugh', '😂'),
        ('wow', '😮'),
        ('sad', '😢'),
        ('angry', '😡')
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    
    # For replying to messages
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    
    # For read receipts
    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='read_messages', through='ReadReceipt')
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message from {self.sender.username} in {self.conversation}"

class ReadReceipt(models.Model):
    """
    Tracks when a message was read by a user.
    """
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('message', 'user')
        
    def __str__(self):
        return f"{self.user.username} read message {self.message.id} at {self.timestamp}"

class MessageReaction(models.Model):
    """
    Reactions to messages.
    """
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reaction = models.CharField(max_length=10, choices=Message.REACTIONS)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('message', 'user')
        
    def __str__(self):
        return f"{self.user.username} reacted with {self.get_reaction_display()} to message {self.message.id}"

class TypingIndicator(models.Model):
    """
    Tracks when a user is typing in a conversation.
    """
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='typing_indicators')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('conversation', 'user')
        
    def __str__(self):
        return f"{self.user.username} is typing in conversation {self.conversation.id}"