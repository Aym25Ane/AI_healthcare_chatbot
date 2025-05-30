from rest_framework import serializers
from .models import MedicalFacility, SavedFacility

class MedicalFacilitySerializer(serializers.ModelSerializer):
    facility_type_display = serializers.ReadOnlyField(source='get_facility_type_display')
    
    class Meta:
        model = MedicalFacility
        fields = [
            'id', 'name', 'facility_type', 'facility_type_display', 
            'address', 'latitude', 'longitude', 'phone', 
            'website', 'place_id', 'created_at', 'updated_at'
        ]

class SavedFacilitySerializer(serializers.ModelSerializer):
    facility = MedicalFacilitySerializer(read_only=True)
    facility_id = serializers.PrimaryKeyRelatedField(
        queryset=MedicalFacility.objects.all(),
        source='facility',
        write_only=True
    )
    
    class Meta:
        model = SavedFacility
        fields = ['id', 'user', 'facility', 'facility_id', 'notes', 'saved_at']
        read_only_fields = ['user', 'saved_at']
