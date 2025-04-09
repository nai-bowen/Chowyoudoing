// src/app/restaurant-dashboard/[restaurantId]/menu/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faUtensils, 
  faStore,
  faSpinner 
} from "@fortawesome/free-solid-svg-icons";
import MenuManagement from "@/app/_components/MenuManagement";

interface Restaurant {
  id: string;
  title: string;
  location: string;
  category: string[] | string;
}

export default function RestaurantMenuPage({ 
  params 
}: { 
  params: { restaurantId: string } 
}): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurantDetails = async (): Promise<void> => {
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
    };

    fetchRestaurantDetails();
  }, [params.restaurantId, status]);

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
                <FontAwesomeIcon icon={faUtensils} className="text-[#f2d36e]" />
                Menu Management
              </h1>
              {restaurant && (
                <p className="text-gray-600 flex items-center">
                  <FontAwesomeIcon icon={faStore} className="mr-1 text-gray-500" />
                  {restaurant.title}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link
              href={`/restaurant-dashboard/${params.restaurantId}`}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              Restaurant Dashboard
            </Link>
            
            <Link
              href="/restaurant-dashboard"
              className="px-4 py-2 bg-[#dab9f8] text-white rounded-lg hover:bg-[#c9a2f2] shadow-sm"
            >
              All Restaurants
            </Link>
          </div>
        </div>
        
        {/* Error state */}
        {error && (
          <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
            <p>There was an error: {error}</p>
            <p className="mt-2">Please try refreshing the page or go back to the dashboard.</p>
          </div>
        )}
        
        {/* Menu management component */}
        {!error && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <MenuManagement restaurantId={params.restaurantId} />
          </div>
        )}
      </div>
    </div>
  );
}