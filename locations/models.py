from django.db import models
from django.contrib.auth.models import User

class MedicalFacility(models.Model):
    FACILITY_TYPES = [
        ('HOSPITAL', 'Hospital'),
        ('CLINIC', 'Clinic'),
        ('PHARMACY', 'Pharmacy'),
        ('DOCTOR', 'Doctor\'s Office'),
    ]
    
    name = models.CharField(max_length=255)
    facility_type = models.CharField(max_length=10, choices=FACILITY_TYPES)
    address = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    phone = models.CharField(max_length=15, blank=True)
    website = models.URLField(blank=True)
    place_id = models.CharField(max_length=255, unique=True)  # Google Places ID
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_facility_type_display()})"
    
    class Meta:
        verbose_name_plural = "Medical Facilities"

class SavedFacility(models.Model):
    """Facilities saved by users for quick access"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_facilities')
    facility = models.ForeignKey(MedicalFacility, on_delete=models.CASCADE, related_name='saved_by')
    notes = models.TextField(blank=True)
    saved_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} saved {self.facility.name}"
    
    class Meta:
        verbose_name_plural = "Saved Facilities"
        unique_together = ('user', 'facility')
