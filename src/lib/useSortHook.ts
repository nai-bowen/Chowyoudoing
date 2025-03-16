/*eslint-disable*/

import { useState, useEffect, useMemo } from 'react';
import { SortType } from '@/app/_components/SortDropdown';
import { useSession } from 'next-auth/react';
import { useGeolocation } from '@/lib/locationService';

// Define the required properties for sortable reviews
export interface SortableReview {
  id: string;
  createdAt?: string | Date;
  upvotes: number;
  [key: string]: any;
}

// Define the required properties for sortable restaurants
export interface SortableRestaurant {
  id: string;
  num_reviews?: string;
  category?: string[] | string;
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: any;
}

type UseReviewSortResult<T> = {
  sortedItems: T[];
  currentSort: SortType;
  setSortType: (type: SortType) => void;
  isLoading: boolean;
};

export function useReviewSort<T extends SortableReview>(
  items: T[],
  initialSortType: SortType = 'mostRecent'
): UseReviewSortResult<T> {
  const [currentSort, setSortType] = useState<SortType>(initialSortType);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { data: session } = useSession();
  const userInterests = ((session?.user as any)?.interests || []) as string[];


  const sortedItems = useMemo(() => {
    setIsLoading(true);
    
    // Create a copy to avoid mutating the original array
    const itemsCopy = [...items];
    
    switch (currentSort) {
      case 'mostRecent':
        // Sort by date (newest first)
        return itemsCopy.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        
      case 'mostHelpful':
        // Sort by upvotes (highest first)
        return itemsCopy.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        
      case 'relevance':
        // Sort by relevance to user interests
        return itemsCopy.sort((a, b) => {
          // Calculate relevance score based on matching interests
          // This is a simple implementation - you might want to enhance this logic
          const scoreA = calculateRelevanceScore(a, userInterests);
          const scoreB = calculateRelevanceScore(b, userInterests);
          
          // If scores are equal, sort by upvotes
          if (scoreB === scoreA) {
            return (b.upvotes || 0) - (a.upvotes || 0);
          }
          
          return scoreB - scoreA;
        });
        
      default:
        return itemsCopy;
    }
  }, [items, currentSort, userInterests]);

  useEffect(() => {
    // Simulate loading state when sorting changes
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [currentSort]);

  return { sortedItems, currentSort, setSortType, isLoading };
}

export function useRestaurantSort<T extends SortableRestaurant>(
  items: T[],
  initialSortType: SortType = 'mostPopular'
): UseReviewSortResult<T> {
  const [currentSort, setSortType] = useState<SortType>(initialSortType);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { data: session } = useSession();
  const userInterests = ((session?.user as any)?.interests || []) as string[];
  const location = useGeolocation();

  const sortedItems = useMemo(() => {
    setIsLoading(true);
    
    // Create a copy to avoid mutating the original array
    const itemsCopy = [...items];
    
    switch (currentSort) {
      case 'mostPopular':
        // Sort by number of reviews (highest first)
        return itemsCopy.sort((a, b) => {
          const reviewsA = parseInt(a.num_reviews || '0', 10);
          const reviewsB = parseInt(b.num_reviews || '0', 10);
          return reviewsB - reviewsA;
        });
        
      case 'mostRelevant':
        // Sort by relevance to user interests
        return itemsCopy.sort((a, b) => {
          // Calculate relevance score based on matching categories to interests
          const scoreA = calculateRestaurantRelevanceScore(a, userInterests);
          const scoreB = calculateRestaurantRelevanceScore(b, userInterests);
          
          // If scores are equal, sort by popularity
          if (scoreB === scoreA) {
            const reviewsA = parseInt(a.num_reviews || '0', 10);
            const reviewsB = parseInt(b.num_reviews || '0', 10);
            return reviewsB - reviewsA;
          }
          
          return scoreB - scoreA;
        });
        
      case 'local':
        // Sort by distance to user
        if (location.coordinates) {
          const { latitude: userLat, longitude: userLng } = location.coordinates;
          
          return itemsCopy.sort((a, b) => {
            const distanceA = calculateDistance(
              userLat, 
              userLng, 
              a.latitude || null, 
              a.longitude || null
            );
            const distanceB = calculateDistance(
              userLat, 
              userLng, 
              b.latitude || null, 
              b.longitude || null
            );
            
            // If one restaurant has no coordinates, put it last
            if (distanceA === null) return 1;
            if (distanceB === null) return -1;
            
            // Sort by closest first
            return distanceA - distanceB;
          });
        }
        return itemsCopy;
        
      default:
        return itemsCopy;
    }
  }, [items, currentSort, userInterests, location.coordinates]);

  useEffect(() => {
    // Simulate loading state when sorting changes
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [currentSort]);

  return { sortedItems, currentSort, setSortType, isLoading };
}

// Helper function to calculate review relevance score based on user interests
function calculateRelevanceScore(item: any, userInterests: string[]): number {
  if (!userInterests.length || !item) return 0;
  
  // Check if review has menu item with interest
  let score = 0;
  
  // Check restaurant category matches
  const restaurantCategories = item.restaurant?.category || [];
  if (Array.isArray(restaurantCategories)) {
    score += restaurantCategories.filter(cat => 
      userInterests.includes(cat.toLowerCase())
    ).length * 2;
  }
  
  // Check menu item interest matches
  const menuItemCategory = item.menuItem?.interest?.name;
  if (menuItemCategory && userInterests.includes(menuItemCategory.toLowerCase())) {
    score += 3; // Higher weight for direct menu item match
  }
  
  // Give some weight to reviews with higher ratings
  score += (item.rating || 0) / 2;
  
  return score;
}

// Helper function to calculate restaurant relevance score based on user interests
function calculateRestaurantRelevanceScore(restaurant: any, userInterests: string[]): number {
  if (!userInterests.length || !restaurant) return 0;
  
  let score = 0;
  
  // Check category matches
  const categories = restaurant.category || [];
  if (Array.isArray(categories)) {
    score += categories.filter(cat => 
      userInterests.includes(String(cat).toLowerCase())
    ).length * 3;
  } else if (typeof categories === 'string') {
    score += userInterests.includes(categories.toLowerCase()) ? 3 : 0;
  }
  
  return score;
}

// Helper function to calculate distance between coordinates using the Haversine formula
function calculateDistance(
  lat1: number | null,
  lon1: number | null,
  lat2: number | null,
  lon2: number | null
): number | null {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
    return null;
  }
  
  // Haversine formula
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}