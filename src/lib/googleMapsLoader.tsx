/*eslint-disable*/
"use client";

import { useEffect, useState } from "react";

interface GoogleMapsLoaderProps {
  children: React.ReactNode;
}

const GoogleMapsLoader: React.FC<GoogleMapsLoaderProps> = ({ children }) => {
  const [mapsLoaded, setMapsLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Check if the Google Maps script is already loaded
    if (window.google?.maps) {
      setMapsLoaded(true);
      return;
    }

    // Create the script element
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    // Set up the callback
    script.onload = () => {
      setMapsLoaded(true);
    };

    script.onerror = () => {
      console.error("Failed to load Google Maps API");
    };

    // Add the script to the DOM
    document.head.appendChild(script);

    // Clean up
    return () => {
      // Only remove the script if we added it
      const scriptElement = document.getElementById("google-maps-script");
      if (scriptElement) {
        document.head.removeChild(scriptElement);
      }
    };
  }, []);

  if (!mapsLoaded) {
    return <div>Loading maps...</div>;
  }

  return <>{children}</>;
};

export default GoogleMapsLoader;