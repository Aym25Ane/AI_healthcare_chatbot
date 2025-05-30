from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import MedicalCategory, TrainingQuestion, ChatSession, ChatMessage
from .serializers import (
    MedicalCategorySerializer, TrainingQuestionSerializer,
    ChatSessionSerializer, ChatMessageSerializer, ChatMessageCreateSerializer
)
from .ai_engine import get_ai_response

class ChatSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user).order_by('-started_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ChatSessionDetailView(generics.RetrieveAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)

class EndChatSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            session = ChatSession.objects.get(pk=pk, user=request.user)
            session.ended_at = timezone.now()
            session.save()
            return Response({"message": "Chat session ended"}, status=status.HTTP_200_OK)
        except ChatSession.DoesNotExist:
            return Response({"error": "Chat session not found"}, status=status.HTTP_404_NOT_FOUND)

class ChatMessageCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChatMessageCreateSerializer(data=request.data)
        if serializer.is_valid():
            user_message = serializer.validated_data['message']
            session_id = serializer.validated_data.get('session_id')
            
            # Get or create chat session
            if session_id:
                try:
                    session = ChatSession.objects.get(pk=session_id, user=request.user)
                except ChatSession.DoesNotExist:
                    return Response({"error": "Chat session not found"}, status=status.HTTP_404_NOT_FOUND)
            else:
                session = ChatSession.objects.create(user=request.user)
            
            # Save user message
            user_chat_message = ChatMessage.objects.create(
                session=session,
                sender='USER',
                content=user_message
            )
            
            # Get AI response
            ai_response = get_ai_response(user_message)
            
            # Save bot response
            bot_chat_message = ChatMessage.objects.create(
                session=session,
                sender='BOT',
                content=ai_response
            )
            
            # Return both messages
            return Response({
                "session_id": session.id,
                "user_message": ChatMessageSerializer(user_chat_message).data,
                "bot_message": ChatMessageSerializer(bot_chat_message).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MedicalCategoryListView(generics.ListAPIView):
    queryset = MedicalCategory.objects.all()
    serializer_class = MedicalCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class TrainingQuestionListView(generics.ListAPIView):
    serializer_class = TrainingQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = TrainingQuestion.objects.all()
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset
