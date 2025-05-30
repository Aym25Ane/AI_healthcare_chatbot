from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from chatbot.models import ChatSession, ChatMessage, MedicalCategory, TrainingQuestion
from users.models import UserProfile
from locations.models import MedicalFacility, SavedFacility

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        # Get counts
        user_count = User.objects.count()
        chat_session_count = ChatSession.objects.count()
        message_count = ChatMessage.objects.count()
        facility_count = MedicalFacility.objects.count()
        
        # Get recent activity
        recent_users = User.objects.order_by('-date_joined')[:5]
        recent_sessions = ChatSession.objects.order_by('-started_at')[:5]
        
        # Get stats for the last 7 days
        last_week = timezone.now() - timedelta(days=7)
        new_users_last_week = User.objects.filter(date_joined__gte=last_week).count()
        sessions_last_week = ChatSession.objects.filter(started_at__gte=last_week).count()
        
        # Get most active users
        most_active_users = User.objects.annotate(
            session_count=Count('chat_sessions')
        ).order_by('-session_count')[:5]
        
        # Get most common categories
        most_common_categories = MedicalCategory.objects.annotate(
            question_count=Count('questions')
        ).order_by('-question_count')[:5]
        
        # Prepare response data
        response_data = {
            'counts': {
                'users': user_count,
                'chat_sessions': chat_session_count,
                'messages': message_count,
                'facilities': facility_count
            },
            'recent_activity': {
                'users': [
                    {
                        'id': user.id,
                        'username': user.username,
                        'date_joined': user.date_joined
                    } for user in recent_users
                ],
                'sessions': [
                    {
                        'id': session.id,
                        'user': session.user.username,
                        'started_at': session.started_at
                    } for session in recent_sessions
                ]
            },
            'weekly_stats': {
                'new_users': new_users_last_week,
                'sessions': sessions_last_week
            },
            'most_active_users': [
                {
                    'id': user.id,
                    'username': user.username,
                    'session_count': user.session_count
                } for user in most_active_users
            ],
            'most_common_categories': [
                {
                    'id': category.id,
                    'name': category.name,
                    'question_count': category.question_count
                } for category in most_common_categories
            ]
        }
        
        return Response(response_data)

class TrainingDataView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        # Get all categories
        categories = MedicalCategory.objects.all()
        
        # Get training data by category
        training_data = {}
        for category in categories:
            questions = TrainingQuestion.objects.filter(category=category)
            training_data[category.name] = [
                {
                    'id': question.id,
                    'question': question.question,
                    'answer': question.answer
                } for question in questions
            ]
        
        return Response(training_data)

class UserStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        # Get user stats
        users = User.objects.all()
        
        user_stats = []
        for user in users:
            session_count = ChatSession.objects.filter(user=user).count()
            message_count = ChatMessage.objects.filter(session__user=user).count()
            saved_facilities = SavedFacility.objects.filter(user=user).count()
            
            user_stats.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'date_joined': user.date_joined,
                'session_count': session_count,
                'message_count': message_count,
                'saved_facilities': saved_facilities
            })
        
        return Response(user_stats)
