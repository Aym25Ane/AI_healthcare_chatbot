from rest_framework import serializers
from .models import MedicalCategory, TrainingQuestion, ChatSession, ChatMessage

class MedicalCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalCategory
        fields = ['id', 'name', 'description']

class TrainingQuestionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    
    class Meta:
        model = TrainingQuestion
        fields = ['id', 'question', 'answer', 'category', 'category_name', 'created_at', 'updated_at']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'content', 'timestamp']

class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = ChatSession
        fields = ['id', 'user', 'username', 'started_at', 'ended_at', 'messages']
        read_only_fields = ['user', 'started_at']

class ChatMessageCreateSerializer(serializers.Serializer):
    message = serializers.CharField(required=True)
    session_id = serializers.IntegerField(required=False)
