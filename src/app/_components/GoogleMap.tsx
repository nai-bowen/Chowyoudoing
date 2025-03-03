/*eslint-disable*/
"use client";

import { useEffect, useRef, useState } from "react";
import { useGeolocation } from "../../lib/locationService";

// Define types for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  type: "restaurant" | "review";
}

interface GoogleMapProps {
  markers?: MapMarker[];
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  height?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  markers = [],
  defaultCenter = { lat: 51.6217, lng: -0.7478 }, // Default to High Wycombe
  defaultZoom = 13,
  height = "400px",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const location = useGeolocation();

  // Initialize the map
  useEffect(() => {
    if (typeof window !== "undefined" && mapRef.current && !map) {
      // Check if the Google Maps script is already loaded
      if (!window.google?.maps) {
        console.error("Google Maps API not loaded");
        return;
      }

      const mapOptions: any = {
        center: defaultCenter,
        zoom: defaultZoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      };

      setMap(new window.google.maps.Map(mapRef.current, mapOptions));
    }
  }, [defaultCenter, defaultZoom, map]);

  // Update map center when user location changes
  useEffect(() => {
    if (map && location.coordinates) {
      const userLocation = {
        lat: location.coordinates.latitude,
        lng: location.coordinates.longitude,
      };
      
      map.setCenter(userLocation);
      
      // Add a marker for the user's location
      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map,
        title: "Your Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      });
      
      // Add info window to user marker
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div><strong>Your Location</strong><br>${location.address || "Current location"}</div>`,
      });
      
      userMarker.addListener("click", () => {
        infoWindow.open(map, userMarker);
      });
      
      // Remove this marker when location changes
      return () => {
        userMarker.setMap(null);
      };
    }
  }, [location.coordinates, location.address, map]);

  // Add or update markers when the markers prop changes
  useEffect(() => {
    if (map) {
      // Clear existing markers
      mapMarkers.forEach((marker: any) => marker.setMap(null));
      
      // Create new markers
      const newMarkers = markers.map(marker => {
        // Different icon for reviews vs restaurants
        const icon = marker.type === "restaurant" 
          ? {
              url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
            }
          : {
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            };
          
        const mapMarker = new window.google.maps.Marker({
          position: { lat: marker.latitude, lng: marker.longitude },
          map,
          title: marker.title,
          icon,
        });
        
        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div><strong>${marker.title}</strong><br>${marker.type === "restaurant" ? "Restaurant" : "Review"}</div>`,
        });
        
        mapMarker.addListener("click", () => {
          infoWindow.open(map, mapMarker);
        });
        
        return mapMarker;
      });
      
      setMapMarkers(newMarkers);
      
      // Clean up markers on unmount
      return () => {
        newMarkers.forEach((marker: any) => marker.setMap(null));
      };
    }
  }, [markers, map]);

  return (
    <div style={{ width: "100%", height, position: "relative" }}>
      {location.loading && (
        <div style={{
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          zIndex: 1
        }}>
          <p>Loading your location...</p>
        </div>
      )}
      {location.error && (
        <div style={{
          position: "absolute", 
          top: 0,
          padding: "8px", 
          backgroundColor: "#f8d7da", 
          color: "#721c24",
          zIndex: 1,
          borderRadius: "4px"
        }}>
          {location.error}
        </div>
      )}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
};

export default GoogleMap;