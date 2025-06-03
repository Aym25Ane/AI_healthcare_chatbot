from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class MedicalCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Medical Categories"

class TrainingQuestion(models.Model):
    question = models.TextField()
    answer = models.TextField()
    category = models.ForeignKey(MedicalCategory, on_delete=models.CASCADE, related_name='questions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.question[:50]

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    def end_session(self):
        self.ended_at = timezone.now()
        self.save()
    
    def __str__(self):
        return f"Chat with {self.user.username} on {self.started_at.strftime('%Y-%m-%d %H:%M')}"

class ChatMessage(models.Model):
    SENDER_CHOICES = [
        ('USER', 'User'),
        ('BOT', 'Bot'),
    ]
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=4, choices=SENDER_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.sender}: {self.content[:30]}"
    
    class Meta:
        ordering = ['timestamp']
