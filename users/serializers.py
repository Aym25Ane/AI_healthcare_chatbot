from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['date_of_birth', 'phone_number', 'medical_history', 'location', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        read_only_fields = ['id']
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        # Update User fields
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()
        
        # Update UserProfile fields
        profile = instance.profile
        profile.date_of_birth = profile_data.get('date_of_birth', profile.date_of_birth)
        profile.phone_number = profile_data.get('phone_number', profile.phone_number)
        profile.medical_history = profile_data.get('medical_history', profile.medical_history)
        profile.location = profile_data.get('location', profile.location)
        profile.save()
        
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user
