from django.urls import path
from .views import NearbyFacilitiesView, SavedFacilityListCreateView, SavedFacilityDetailView

urlpatterns = [
    path('nearby/', NearbyFacilitiesView.as_view(), name='nearby-facilities'),
    path('saved/', SavedFacilityListCreateView.as_view(), name='saved-facilities'),
    path('saved/<int:pk>/', SavedFacilityDetailView.as_view(), name='saved-facility-detail'),
]
