"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUtensils } from "@fortawesome/free-solid-svg-icons";
import MenuManagement from "@/app/_components/MenuManagement";

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
  location?: string;
}

export default function RestaurantMenuPage(): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [restaurateurData, setRestaurateurData] = useState<RestaurateurData | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");

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
        
        // If there's only one restaurant, auto-select it
        if (data.length === 1) {
          setSelectedRestaurantId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        setError("Failed to load restaurants. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, [restaurateurData, status]);

  // Handle restaurant selection change
  const handleRestaurantChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedRestaurantId(e.target.value);
  };

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
          <h1 className="text-2xl font-bold">Menu Management</h1>
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
            {restaurants.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FontAwesomeIcon icon={faUtensils} className="text-4xl text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No restaurants available</h3>
                <p className="text-gray-500 mb-6">You need to connect to a restaurant before managing menus.</p>
                <Link
                  href="/restaurant-dashboard"
                  className="px-6 py-3 bg-[#f2d36e] text-white rounded-full hover:bg-[#e6c860] transition-colors"
                >
                  Connect to Restaurants
                </Link>
              </div>
            ) : restaurants.length === 1 ? (
              // If there's only one restaurant, show its menu directly
              <div>
                <div className="bg-[#faf2e5] p-4 rounded-lg mb-6">
                  <h2 className="font-semibold text-lg">{restaurants[0]!.title}</h2>
                  {restaurants[0]!.location && (
                    <p className="text-gray-600 text-sm">{restaurants[0]!.location}</p>
                  )}
                </div>
                <MenuManagement restaurantId={restaurants[0]!.id} />
              </div>
            ) : (
              // If there are multiple restaurants, show a selector
              <div>
                <div className="mb-6">
                  <label htmlFor="restaurantSelector" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Restaurant to Manage Menu
                  </label>
                  <select
                    id="restaurantSelector"
                    value={selectedRestaurantId}
                    onChange={handleRestaurantChange}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                  >
                    <option value="" disabled>Select a restaurant</option>
                    {restaurants.map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedRestaurantId ? (
                  <MenuManagement restaurantId={selectedRestaurantId} />
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      Please select a restaurant to manage its menu.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}