from django.contrib import admin
from .models import MedicalFacility, SavedFacility

@admin.register(MedicalFacility)
class MedicalFacilityAdmin(admin.ModelAdmin):
    list_display = ('name', 'facility_type', 'address', 'phone')
    list_filter = ('facility_type',)
    search_fields = ('name', 'address')

@admin.register(SavedFacility)
class SavedFacilityAdmin(admin.ModelAdmin):
    list_display = ('user', 'facility', 'saved_at')
    list_filter = ('saved_at',)
    search_fields = ('user__username', 'facility__name')
