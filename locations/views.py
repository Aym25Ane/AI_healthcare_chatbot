from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import MedicalFacility, SavedFacility
from .serializers import MedicalFacilitySerializer, SavedFacilitySerializer
from .places_api import search_nearby_places

class NearbyFacilitiesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        facility_type = request.query_params.get('type')
        radius = request.query_params.get('radius', 5000)  # Default 5km radius
        
        if not all([latitude, longitude]):
            return Response(
                {"error": "Latitude and longitude are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(latitude)
            lng = float(longitude)
            radius = int(radius)
        except ValueError:
            return Response(
                {"error": "Invalid coordinates or radius"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Search for nearby places using Google Places API
        facilities = search_nearby_places(lat, lng, radius, facility_type)
        
        return Response(facilities)

class SavedFacilityListCreateView(generics.ListCreateAPIView):
    serializer_class = SavedFacilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SavedFacility.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SavedFacilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SavedFacilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SavedFacility.objects.filter(user=self.request.user)
