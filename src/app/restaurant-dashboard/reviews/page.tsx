/*eslint-disable*/

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import ReviewManagement from "@/app/_components/ReviewManagement";

interface RestaurateurData {
  id: string;
  email: string;
  restaurantName: string;
  contactPersonName: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
}

interface Restaurant {
  id: string;
  title: string;
}

export default function RestaurantReviewsPage(): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [restaurateurData, setRestaurateurData] = useState<RestaurateurData | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    pendingResponses: 0, 
    averageRating: 0
  });

  // Fetch restaurateur data
  useEffect(() => {
    const fetchRestaurateurData = async (): Promise<void> => {
      if (status !== "authenticated") return;
      
      try {
        setIsLoading(true);
        const response = await fetch("/api/restaurateur/profile");
        
        if (!response.ok) {
          throw new Error("Failed to fetch restaurateur profile");
        }
        
        const data = await response.json();
        setRestaurateurData(data);
      } catch (error) {
        console.error("Error fetching restaurateur profile:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurateurData();
  }, [status]);

  // Fetch connected restaurants
  useEffect(() => {
    const fetchRestaurants = async (): Promise<void> => {
      if (status !== "authenticated" || !restaurateurData?.id) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/restaurateur/restaurants?restaurateurId=${restaurateurData.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch restaurants");
        }
        
        const data = await response.json();
        setRestaurants(data);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        setError("Failed to load restaurants. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, [restaurateurData, status]);

  // Handle stats updates from ReviewManagement component
  const handleReviewStatsUpdate = (stats: { 
    totalReviews: number; 
    pendingResponses: number; 
    averageRating: number 
  }): void => {
    setReviewStats(stats);
  };

  // Memoized restaurant list for reviews component
  const memoizedRestaurants = useMemo(() => {
    return restaurants.map(r => ({ id: r.id, title: r.title }));
  }, [restaurants]);

  // If not authenticated, redirect to login
  if (status === "unauthenticated") {
    router.push("/login/restaurateur");
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Please log in to access the restaurant dashboard.</p>
      </div>
    );
  }

  // If restaurateur verification status is not approved
  if (restaurateurData && restaurateurData.verificationStatus !== "APPROVED") {
    router.push("/restaurant-dashboard");
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Your account needs to be verified before you can access this page.</p>
      </div>
    );
  }

  return (
    <div>
      <main className="container mx-auto px-6 py-6 mt-16">
        {/* Header with back button */}
        <div className="mb-8 flex items-center">
          <Link 
            href="/restaurant-dashboard" 
            className="mr-4 text-gray-600 hover:text-gray-900 flex items-center"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Review Management</h1>
        </div>

       
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-6">
            <p>{error}</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Manage Reviews</h2>
            
            {restaurateurData && restaurants.length > 0 ? (
              <ReviewManagement 
                restaurateurId={restaurateurData.id} 
                restaurants={memoizedRestaurants}
                onStatsUpdate={handleReviewStatsUpdate}
              />
            ) : restaurants.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Restaurants Found</h3>
                <p className="text-gray-500 mb-4">
                  You need to connect to restaurants before you can manage reviews.
                </p>
                <Link 
                  href="/restaurant-dashboard"
                  className="px-4 py-2 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2]"
                >
                  Connect to Restaurants
                </Link>
              </div>
            ) : (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#dab9f8]"></div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}