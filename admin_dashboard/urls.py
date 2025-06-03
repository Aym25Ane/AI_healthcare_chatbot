from django.urls import path
from .views import DashboardStatsView, TrainingDataView, UserStatsView

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('training-data/', TrainingDataView.as_view(), name='training-data'),
    path('user-stats/', UserStatsView.as_view(), name='user-stats'),
]
