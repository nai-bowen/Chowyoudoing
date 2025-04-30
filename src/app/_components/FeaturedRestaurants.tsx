/*eslint-disable*/
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Star, MapPin, ArrowRight, Crown, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Type definitions
interface Restaurant {
  id: string;
  title: string;
  location: string;
  rating: string;
  num_reviews: string;
  category: string[];
  isPremium?: boolean;
  isFeatured?: boolean;
}

interface FeaturedRestaurantsProps {
  onRestaurantClick?: (e: React.MouseEvent, restaurantId: string, restaurantName: string) => void;
}

// Login Modal Component
const LoginModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onLogin: () => void; 
  isRestaurant?: boolean;
  restaurantName?: string;
}> = ({ isOpen, onClose, onLogin, isRestaurant = false, restaurantName = "" }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold mb-3">
          Discover More About {isRestaurant ? restaurantName : "Restaurants"}!
        </h3>
        <p className="text-gray-600 mb-6">
          {isRestaurant
            ? "Login to see reviews, photos, and more details about this restaurant."
            : "Log in to discover more amazing restaurants tailored to your taste preferences."}
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Stay on Homepage
          </button>
          <button 
            onClick={onLogin}
            className="px-4 py-2 bg-[#F1C84B] text-white rounded-lg hover:bg-[#d9a82e]"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FeaturedRestaurants({ 
  onRestaurantClick 
}: FeaturedRestaurantsProps): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [modalContext, setModalContext] = useState<{
    isRestaurant: boolean;
    restaurantName: string;
  }>({
    isRestaurant: false,
    restaurantName: ""
  });

  const isAuthenticated = status === "authenticated";

  // Fetch featured restaurants
  useEffect(() => {
    const fetchFeaturedRestaurants = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/restaurants/featured');
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured restaurants');
        }
        
        const data = await response.json();
        setRestaurants(data.restaurants || []);
      } catch (err) {
        console.error('Error fetching featured restaurants:', err);
        setError('Could not load featured restaurants');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeaturedRestaurants();
  }, []);

  // Handle login button click in modal
  const handleLogin = (): void => {
    router.push('/login');
  };

  // Handle restaurant card click
  // This function will directly route to the appropriate page based on auth status
  // without showing a modal for restaurant clicks
  const handleDirectRestaurantRoute = (e: React.MouseEvent, restaurantId: string, restaurantName: string): void => {
    e.preventDefault();
    
    // Always route directly to the appropriate page based on authentication status
    if (isAuthenticated) {
      router.push(`/patron-search?id=${restaurantId}`);
    } else {
      router.push(`/restaurants/${restaurantId}`);
    }
  };

  // Handle View All button click
  const handleViewAllClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    
    if (isAuthenticated) {
      // If authenticated, redirect to discover page
      router.push('/discover');
    } else {
      // If not authenticated, show login modal
      setModalContext({
        isRestaurant: false,
        restaurantName: ""
      });
      setShowLoginModal(true);
    }
  };

  // Handle restaurant card click - completely replace custom behavior
  const handleRestaurantClick = (e: React.MouseEvent, restaurantId: string, restaurantName: string): void => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any parent handlers from running
    
    // Route directly without calling the custom handler
    // This ensures no modal appears before routing
    if (isAuthenticated) {
      router.push(`/patron-search?id=${restaurantId}`);
    } else {
      router.push(`/restaurants/${restaurantId}`);
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-[#F1C84B]">Featured Restaurants</h2>
            <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-4">
                  <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-[#F1C84B]">Featured Restaurants</h2>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-[#F1C84B]">Featured Restaurants</h2>
          <a 
            href="#"
            onClick={handleViewAllClick}
            className="text-[#FFB400] hover:text-[#D29501] font-medium flex items-center gap-1"
          >
            View all
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Restaurant Cards */}
          {restaurants.map((restaurant, index) => {
            const gradientColors = [
              '#f2d577',
              '#dabbfa',
              '#f5baf2',
              '#f9c8d7',
              '#f9ecd0',
            ];
            const baseColor = gradientColors[index % gradientColors.length];
            const fallbackGradient = `linear-gradient(135deg, ${baseColor}, ${baseColor}80)`;

            return (
              <a
                key={restaurant.id}
                href="#"
                onClick={(e) => handleRestaurantClick(e, restaurant.id, restaurant.title)}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer block"
              >
                <div className="h-48 overflow-hidden">
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url(/restaurant${index + 1}.jpg), ${fallbackGradient}`
                    }}
                  ></div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg text-[#4B2B10]">{restaurant.title}</h3>
                    {restaurant.isPremium && (
                      <div className="flex items-center text-[#F1C84B]">
                        <Crown size={16} className="mr-1" />
                        <span className="text-xs font-medium">Premium</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const rating = parseFloat(restaurant.rating);
                        return (
                          <Star 
                            key={star} 
                            size={16} 
                            className={star <= Math.floor(rating) 
                              ? "text-[#FFB400] fill-[#FFB400]" 
                              : star <= rating 
                                ? "text-[#FFB400] fill-[#FFB400]/50" 
                                : "text-gray-300"
                            } 
                          />
                        );
                      })}
                    </div>
                    <span className="text-sm text-gray-700 ml-1">({restaurant.num_reviews})</span>
                  </div>

                  <div className="mt-3 flex items-center text-sm text-gray-700">
                    <span className="mr-2">
                      {restaurant.category && restaurant.category.length > 0 
                        ? restaurant.category.slice(0, 2).join(', ') 
                        : "Cuisine"}
                    </span>
                    {restaurant.category && restaurant.category.length > 2 && (
                      <span className="text-gray-500 text-xs">+{restaurant.category.length - 2} more</span>
                    )}
                  </div>

                  <div className="mt-3 flex items-start gap-1.5 text-sm text-gray-700">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-500" />
                    <span className="line-clamp-1">{restaurant.location || "No location available"}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Login Modal - Only shown for View All, never for restaurant clicks */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        isRestaurant={modalContext.isRestaurant}
        restaurantName={modalContext.restaurantName}
      />
    </section>
  );
}