/*eslint-disable*/
import { db } from "../../db";
import { NextRequest, NextResponse } from "next/server";

export interface RestaurantWithCoordinates {
  id: string;
  title: string;
  location: string;
  category: string[];
  latitude?: number | null;
  longitude?: number | null;
  detail?: string | null;
  rating?: string;
  num_reviews?: string;
  reviews?: Array<{
    id: string;
    content: string;
    rating: number;
    upvotes: number;
    latitude?: number | null;
    longitude?: number | null;
  }>;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get("location");
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");
    const range = Number(searchParams.get("range")) || 10; // Default to 10km radius

    let restaurantsRaw;

    // Define the selection criteria
    const selectCriteria = {
      id: true,
      title: true,
      location: true,
      category: true,
      detail: true,
      rating: true,
      num_reviews: true,
      reviews: {
        select: {
          id: true,
          content: true,
          rating: true,
          upvotes: true,
          latitude: true,
          longitude: true,
        }
      }
    };

    if (location) {
      // Filter by location name
      restaurantsRaw = await db.restaurant.findMany({
        where: {
          location: {
            contains: location,
            mode: "insensitive" // Case-insensitive search
          }
        },
        select: selectCriteria
      });
    } else if (latitude && longitude) {
      // Get all restaurants
      restaurantsRaw = await db.restaurant.findMany({
        select: selectCriteria
      });
      
      // Parse coordinates
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      
      // Transform to our expected type and filter by distance
      const restaurants: RestaurantWithCoordinates[] = restaurantsRaw.map(transformToRestaurantWithCoordinates);
      
      // Filter restaurants by distance
      const filteredRestaurants = restaurants.filter(restaurant => {
        // First, check if restaurant has coordinates directly
        if (restaurant.latitude && restaurant.longitude) {
          // Calculate distance using the Haversine formula
          const R = 6371; // Earth's radius in km
          const dLat = deg2rad(restaurant.latitude - lat);
          const dLon = deg2rad(restaurant.longitude - lon);
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat)) * Math.cos(deg2rad(restaurant.latitude)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
          const distance = R * c; // Distance in km
          
          return distance <= range;
        }
        
        // If restaurant doesn't have coordinates, check reviews
        if (restaurant.reviews && restaurant.reviews.length > 0) {
          // Find any review within range
          return restaurant.reviews.some(review => {
            if (!review.latitude || !review.longitude) return false;
            
            // Calculate distance using the Haversine formula
            const R = 6371; // Earth's radius in km
            const dLat = deg2rad(review.latitude - lat);
            const dLon = deg2rad(review.longitude - lon);
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(deg2rad(lat)) * Math.cos(deg2rad(restaurant.latitude || 0)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            const distance = R * c; // Distance in km
            
            return distance <= range;
          });
        }
        
        return false;
      });
      
      return NextResponse.json({ restaurants: filteredRestaurants });
    } else {
      // No location or coordinates provided, return all restaurants
      restaurantsRaw = await db.restaurant.findMany({
        select: selectCriteria
      });
    }

    // Transform to our expected type
    const restaurants: RestaurantWithCoordinates[] = restaurantsRaw.map(transformToRestaurantWithCoordinates);

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("Error fetching restaurants by location:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}

// Helper function to transform database result to our expected type
function transformToRestaurantWithCoordinates(restaurant: any): RestaurantWithCoordinates {
  // Extract latitude and longitude from reviews if available
  let latitude = null;
  let longitude = null;
  
  if (restaurant.reviews && restaurant.reviews.length > 0) {
    // Try to find a review with coordinates
    const reviewWithCoords = restaurant.reviews.find(
      (review: any) => review.latitude != null && review.longitude != null
    );
    
    if (reviewWithCoords) {
      latitude = reviewWithCoords.latitude;
      longitude = reviewWithCoords.longitude;
    }
  }
  
  // Create a new object with our expected shape
  return {
    id: restaurant.id,
    title: restaurant.title,
    location: restaurant.location || "",
    category: restaurant.category || [],
    detail: restaurant.detail,
    rating: restaurant.rating,
    num_reviews: restaurant.num_reviews,
    // Use coordinates from reviews if the restaurant doesn't have them directly
    latitude: restaurant.latitude || latitude,
    longitude: restaurant.longitude || longitude,
    reviews: restaurant.reviews
  };
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}