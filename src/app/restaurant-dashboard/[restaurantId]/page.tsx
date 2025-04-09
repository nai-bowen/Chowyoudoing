// src/app/restaurant-dashboard/[restaurantId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUtensils, 
  faStore, 
  faMapMarkerAlt, 
  faChartLine, 
  faStar, 
  faEdit,
  faMessage,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";
import StatCard from '@/app/_components/StatCard';
import MenuManagement from "@/app/_components/MenuManagement";

interface Restaurant {
  id: string;
  title: string;
  location: string;
  category: string[] | string;
  rating?: string;
  num_reviews?: string;
  _count?: {
    reviews: number;
  };
}

interface Review {
  id: string;
  content: string;
  rating: number;
  upvotes: number;
  createdAt: string;
  restaurantResponse: string | null;
}

export default function SingleRestaurantDashboard({
  params
}: {
  params: { restaurantId: string }
}): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get restaurant's average rating
  const getAverageRating = (): number => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  };

  // Get pending responses count
  const getPendingResponsesCount = (): number => {
    return reviews.filter(review => !review.restaurantResponse).length;
  };

  // Fetch restaurant data
  const fetchRestaurantData = useCallback(async (): Promise<void> => {
    if (status !== "authenticated" || !params.restaurantId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/restaurants/${params.restaurantId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch restaurant details");
      }
      
      const data = await response.json();
      setRestaurant(data);
    } catch (err) {
      console.error("Error fetching restaurant details:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [params.restaurantId, status]);

  // Fetch reviews
  const fetchReviews = useCallback(async (): Promise<void> => {
    if (status !== "authenticated" || !params.restaurantId) return;
    
    try {
      setIsLoadingReviews(true);
      const response = await fetch(`/api/restaurateur/reviews?restaurantId=${params.restaurantId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      
      const data = await response.json();
      setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [params.restaurantId, status]);

  // Load data on component mount
  useEffect(() => {
    fetchRestaurantData();
    fetchReviews();
  }, [fetchRestaurantData, fetchReviews]);

  // If not authenticated, redirect to login
  if (status === "unauthenticated") {
    router.push("/login");
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Please log in to access the restaurant dashboard.</p>
      </div>
    );
  }

  // Loading state
  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
      </div>
    );
  }

  // Handle tab rendering
  const renderTabContent = (): JSX.Element => {
    if (activeTab === "Overview") {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard 
              bgColor="bg-[#faf2e5]"
              iconBgColor="bg-[#f2d36e]"
              icon={faStar}
              title="Average Rating"
              value={getAverageRating()}
              isLoading={isLoadingReviews}
            />
            
            <StatCard 
              bgColor="bg-[#fdedf6]"
              iconBgColor="bg-[#f9c3c9]"
              icon={faMessage}
              title="Total Reviews"
              value={reviews.length}
              isLoading={isLoadingReviews}
            />
            
            <StatCard 
              bgColor="bg-[#fbe9fc]"
              iconBgColor="bg-[#f5b7ee]"
              icon={faEdit}
              title="Pending Responses"
              value={getPendingResponsesCount()}
              isLoading={isLoadingReviews}
            />
            
            <StatCard 
              bgColor="bg-[#f1eafe]"
              iconBgColor="bg-[#dab9f8]"
              icon={faUtensils}
              title="Menu Items"
              value="Coming Soon"
              isLoading={false}
            />
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Restaurant Details</h3>
            {restaurant ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-800">{restaurant.title}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-gray-800 flex items-center gap-1">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
                    {restaurant.location}
                  </p>
                </div>
                
                {Array.isArray(restaurant.category) && restaurant.category.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Categories</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {restaurant.category.map((cat, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Restaurant details not available.</p>
            )}
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Recent Reviews</h3>
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("Reviews");
                }}
                className="text-[#dab9f8] hover:underline text-sm"
              >
                View All Reviews
              </Link>
            </div>
            
            {isLoadingReviews ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#dab9f8]"></div>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="p-4 border border-gray-100 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span 
                            key={star} 
                            className={`${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2 line-clamp-2">{review.content}</p>
                    {!review.restaurantResponse && (
                      <div className="mt-2">
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Response Needed
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4">No reviews yet.</p>
            )}
          </div>
        </div>
      );
    }
    
    if (activeTab === "Menu Management") {
      return <MenuManagement restaurantId={params.restaurantId} />;
    }
    
    if (activeTab === "Reviews") {
      return (
        <div>
          <h3 className="text-lg font-medium mb-4">Restaurant Reviews</h3>
          
          {isLoadingReviews ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#dab9f8]"></div>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 bg-white rounded-xl shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star} 
                          className={`${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{review.content}</p>
                  
                  {review.restaurantResponse ? (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-blue-800 mb-1">Your Response:</p>
                      <p className="text-sm text-gray-700">{review.restaurantResponse}</p>
                    </div>
                  ) : (
                    <button
                      className="text-[#dab9f8] hover:text-[#c9a2f2] text-sm font-medium"
                      onClick={() => {
                        // Here you would implement the response functionality
                        alert("Respond to review functionality would be implemented here");
                      }}
                    >
                      Respond to Review
                    </button>
                  )}
                  
                  <div className="mt-3 text-sm text-gray-500">
                    {review.upvotes} upvotes
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/50 rounded-xl">
              <p className="text-gray-500">No reviews yet for this restaurant.</p>
            </div>
          )}
        </div>
      );
    }
    
    if (activeTab === "Analytics") {
      return (
        <div className="text-center py-12 bg-white/50 rounded-xl">
          <FontAwesomeIcon icon={faChartLine} className="text-4xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Analytics Coming Soon</h3>
          <p className="text-gray-500">
            Restaurant analytics and reporting are coming in a future update.
          </p>
        </div>
      );
    }
    
    return <div>Select a tab to view content</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button and header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/restaurant-dashboard"
              className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600" />
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faStore} className="text-[#f2d36e]" />
                {restaurant ? restaurant.title : "Restaurant Dashboard"}
              </h1>
              {restaurant && (
                <p className="text-gray-600 flex items-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-gray-500" />
                  {restaurant.location}
                </p>
              )}
            </div>
          </div>
          
          <Link
            href="/restaurant-dashboard"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            All Restaurants
          </Link>
        </div>
        
        {/* Error state */}
        {error && (
          <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
            <p>There was an error: {error}</p>
            <p className="mt-2">Please try refreshing the page or go back to the dashboard.</p>
          </div>
        )}
        
        {/* Tabs */}
        <div className="bg-white shadow-sm rounded-xl mb-6">
          <div className="flex flex-wrap">
            <button 
              className={`py-4 px-6 font-medium transition-all ${
                activeTab === 'Overview' 
                ? 'text-[#dab9f8] border-b-2 border-[#dab9f8]' 
                : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('Overview')}
            >
              Overview
            </button>
            <button 
              className={`py-4 px-6 font-medium transition-all ${
                activeTab === 'Menu Management' 
                ? 'text-[#dab9f8] border-b-2 border-[#dab9f8]' 
                : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('Menu Management')}
            >
              Menu Management
            </button>
            <button 
              className={`py-4 px-6 font-medium transition-all ${
                activeTab === 'Reviews' 
                ? 'text-[#dab9f8] border-b-2 border-[#dab9f8]' 
                : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('Reviews')}
            >
              Reviews
            </button>
            <button 
              className={`py-4 px-6 font-medium transition-all ${
                activeTab === 'Analytics' 
                ? 'text-[#dab9f8] border-b-2 border-[#dab9f8]' 
                : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('Analytics')}
            >
              Analytics
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}