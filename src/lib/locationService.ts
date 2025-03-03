/*eslint-disable*/
import { useState, useEffect } from 'react';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationState {
  coordinates: Coordinates | null;
  address: string | null;
  loading: boolean;
  error: string | null;
}

// NEW FUNCTION: Convert address to coordinates
export const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to geocode address');
    }

    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

export const useGeolocation = (): LocationState => {
  const [location, setLocation] = useState<LocationState>({
    coordinates: null,
    address: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const getGeolocation = (): void => {
      if (!navigator.geolocation) {
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: "Geolocation is not supported by your browser"
        }));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          try {
            // Reverse geocoding to get address from coordinates
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );

            if (!response.ok) {
              throw new Error('Failed to fetch address');
            }

            const data = await response.json();
            
            // Extract city/town name from address components
            let cityName = null;
            if (data.results && data.results.length > 0) {
              const addressComponents = data.results[0].address_components;
              const locality = addressComponents.find(
                (component: { types: string[] }) => 
                  component.types.includes('locality')
              );
              
              if (locality) {
                cityName = locality.long_name;
              } else {
                // Fallback to postal town or administrative area
                const postalTown = addressComponents.find(
                  (component: { types: string[] }) => 
                    component.types.includes('postal_town')
                );
                
                if (postalTown) {
                  cityName = postalTown.long_name;
                }
              }
            }

            setLocation({
              coordinates,
              address: cityName,
              loading: false,
              error: null
            });
          } catch (error) {
            setLocation({
              coordinates,
              address: null,
              loading: false,
              error: error instanceof Error ? error.message : 'An error occurred while getting location address'
            });
          }
        },
        (error) => {
          setLocation({
            coordinates: null,
            address: null,
            loading: false,
            error: error.message
          });
        }
      );
    };

    getGeolocation();
  }, []);

  return location;
};

// Function to calculate distance between two coordinates (haversine formula)
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
};

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}