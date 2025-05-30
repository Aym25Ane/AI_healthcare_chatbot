import requests
from django.conf import settings
from .models import MedicalFacility

def search_nearby_places(latitude, longitude, radius=5000, facility_type=None):
    """
    Search for nearby medical facilities using Google Places API
    
    Args:
        latitude (float): User's latitude
        longitude (float): User's longitude
        radius (int): Search radius in meters (default: 5000)
        facility_type (str): Type of facility to search for (optional)
    
    Returns:
        list: List of facilities found
    """
    api_key = settings.GOOGLE_PLACES_API_KEY
    
    # Map facility types to Google Places types
    type_mapping = {
        'HOSPITAL': 'hospital',
        'CLINIC': 'doctor',
        'PHARMACY': 'pharmacy',
        'DOCTOR': 'doctor'
    }
    
    # Set the type parameter if a valid facility type is provided
    type_param = None
    if facility_type and facility_type.upper() in type_mapping:
        type_param = type_mapping[facility_type.upper()]
    
    # Base URL for Google Places API
    base_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    
    # Parameters for the API request
    params = {
        'location': f"{latitude},{longitude}",
        'radius': radius,
        'key': api_key
    }
    
    # Add type parameter if specified
    if type_param:
        params['type'] = type_param
    else:
        params['keyword'] = 'medical'
    
    try:
        # Make the API request
        response = requests.get(base_url, params=params)
        data = response.json()
        
        if data['status'] != 'OK':
            print(f"Google Places API error: {data['status']}")
            return []
        
        # Process the results
        results = []
        for place in data['results']:
            # Determine facility type based on types returned by Google
            facility_type = 'DOCTOR'  # Default
            if 'hospital' in place['types']:
                facility_type = 'HOSPITAL'
            elif 'pharmacy' in place['types']:
                facility_type = 'PHARMACY'
            
            # Create or update facility in database
            facility, created = MedicalFacility.objects.update_or_create(
                place_id=place['place_id'],
                defaults={
                    'name': place['name'],
                    'facility_type': facility_type,
                    'address': place.get('vicinity', ''),
                    'latitude': place['geometry']['location']['lat'],
                    'longitude': place['geometry']['location']['lng'],
                    'phone': place.get('formatted_phone_number', ''),
                    'website': place.get('website', '')
                }
            )
            
            # Calculate distance (simple approximation)
            # For more accurate distance, use the Haversine formula
            lat_diff = abs(facility.latitude - latitude)
            lng_diff = abs(facility.longitude - longitude)
            approx_distance = ((lat_diff ** 2 + lng_diff ** 2) ** 0.5) * 111  # Rough km conversion
            
            # Add to results
            results.append({
                'id': facility.id,
                'place_id': facility.place_id,
                'name': facility.name,
                'type': facility.get_facility_type_display(),
                'address': facility.address,
                'phone': facility.phone,
                'website': facility.website,
                'latitude': facility.latitude,
                'longitude': facility.longitude,
                'distance': f"{approx_distance:.1f} km"
            })
        
        # Sort by approximate distance
        results.sort(key=lambda x: float(x['distance'].split()[0]))
        
        return results
    
    except Exception as e:
        print(f"Error searching for nearby places: {e}")
        return []
