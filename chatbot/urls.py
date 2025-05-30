from django.urls import path
from .views import (
    ChatSessionListCreateView, ChatSessionDetailView, EndChatSessionView,
    ChatMessageCreateView, MedicalCategoryListView, TrainingQuestionListView
)

urlpatterns = [
    path('sessions/', ChatSessionListCreateView.as_view(), name='chat-sessions'),
    path('sessions/<int:pk>/', ChatSessionDetailView.as_view(), name='chat-session-detail'),
    path('sessions/<int:pk>/end/', EndChatSessionView.as_view(), name='end-chat-session'),
    path('message/', ChatMessageCreateView.as_view(), name='chat-message'),
    path('categories/', MedicalCategoryListView.as_view(), name='medical-categories'),
    path('questions/', TrainingQuestionListView.as_view(), name='training-questions'),
]
