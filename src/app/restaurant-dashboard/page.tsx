// src/app/restaurant-dashboard/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUtensils,
  faSearch,
  faStore,
  faFileAlt,
  faLink,
  faPlus,
  faMapMarkerAlt,
  faExclamationTriangle,
  faCheckCircle,
  faStar,
  faMessage,
  faBell
} from "@fortawesome/free-solid-svg-icons";
import RestaurantConnectionModal from "../_components/RestaurantConnectionModal";
import MenuManagement from "@/app/_components/MenuManagement";
import StatCard from '@/app/_components/StatCard';

// Define interfaces for the types of data we'll be working with
interface RestaurateurData {
  id: string;
  email: string;
  restaurantName: string;
  businessRegNumber: string | null;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  approvedAt: string | null;
  contactPersonName: string;
  contactPersonEmail: string;
}

interface Restaurant {
  id: string;
  title: string;
  location: string;
  category: string[] | string;
  detail?: string;
  rating?: string;
  num_reviews?: string;
  _count?: {
    reviews: number;
  };
}

interface ConnectionRequest {
  id: string;
  restaurantId: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  restaurant: Restaurant;
}

interface Review {
  id: string;
  content: string;
  rating: number;
  upvotes: number;
  createdAt: string;
  isAnonymous: boolean;
  restaurantResponse: string | null;
  patron: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface ReviewFlag {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  status: string;
  reviewId: string;
  review: Review;
}

interface SearchResult {
  id: string;
  title: string;
  location: string;
  category: string[] | string;
}

// Define a type for the color scheme
interface ColorScheme {
  card1: string;
  card2: string;
  card3: string;
  card4: string;
  accent: string;
}

export default function RestaurantDashboard(): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [restaurateurData, setRestaurateurData] = useState<RestaurateurData | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("My Restaurants");

  // Connection modal state
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [reviewFlags, setReviewFlags] = useState<ReviewFlag[]>([]);
  const [isLoadingFlags, setIsLoadingFlags] = useState<boolean>(true);

  // Search container refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [restaurateurId, setRestaurateurId] = useState<string>("");

  // Color scheme for UI elements
  const colorScheme: ColorScheme = {
    card1: "#fdf9f5",
    card2: "#fdedf6",
    card3: "#fbe9fc",
    card4: "#f1eafe",
    accent: "#faf2e5"
  };
  useEffect(() => {
    const getRestaurateurId = async (): Promise<void> => {
      if (status !== "authenticated" || !session?.user?.email) return;
      
      try {
        // Either fetch from session or API depending on where you store the ID
        // Option 1: If ID is in the session
        const id = (session.user as any).id;
        
        if (id) {
          console.log("Found restaurateur ID in session:", id);
          setRestaurateurId(id);
          return;
        }
        
        // Option 2: Fetch minimal data just to get the ID
        const response = await fetch("/api/auth/get-user-id");
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched restaurateur ID from API:", data.id);
          setRestaurateurId(data.id);
        }
      } catch (error) {
        console.error("Error getting restaurateur ID:", error);
      }
    };
    
    getRestaurateurId();
  }, [session, status]);
  // Handle click outside of search container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        setFetchError(error instanceof Error ? error.message : "Unknown error");
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
        setIsLoadingRestaurants(true);
        const response = await fetch(`/api/restaurateur/restaurants?restaurateurId=${restaurateurData.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch restaurants");
        }
        
        const data = await response.json();
        setRestaurants(data);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setIsLoadingRestaurants(false);
      }
    };

    fetchRestaurants();
  }, [restaurateurData, status]);

  // Fetch connection requests
  useEffect(() => {
    const fetchConnectionRequests = async (): Promise<void> => {
      if (status !== "authenticated" || !restaurateurData?.id) return;
      
      try {
        const response = await fetch(`/api/restaurateur/connection-requests?restaurateurId=${restaurateurData.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch connection requests");
        }
        
        const data = await response.json();
        setConnectionRequests(data);
      } catch (error) {
        console.error("Error fetching connection requests:", error);
      }
    };

    if (activeTab === "Connection Requests") {
      fetchConnectionRequests();
    }
  }, [restaurateurData, status, activeTab]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async (): Promise<void> => {
      if (status !== "authenticated" || !restaurants.length) return;
      
      try {
        setIsLoadingReviews(true);
        
        // Get restaurant IDs
        const restaurantIds = restaurants.map(restaurant => restaurant.id);
        
        // Create query parameters for all restaurant IDs
        const queryParams = new URLSearchParams();
        restaurantIds.forEach(id => queryParams.append("restaurantId", id));
        
        const response = await fetch(`/api/restaurateur/reviews?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }
        
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    if (activeTab === "Reviews") {
      fetchReviews();
    }
  }, [restaurants, status, activeTab]);

  // Fetch review flags
  useEffect(() => {
    const fetchReviewFlags = async (): Promise<void> => {
      if (status !== "authenticated" || !restaurateurData?.id) return;
      
      try {
        setIsLoadingFlags(true);
        const response = await fetch(`/api/restaurateur/review-flags?restaurateurId=${restaurateurData.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch review flags");
        }
        
        const data = await response.json();
        setReviewFlags(data);
      } catch (error) {
        console.error("Error fetching review flags:", error);
      } finally {
        setIsLoadingFlags(false);
      }
    };

    if (activeTab === "Flagged Reviews") {
      fetchReviewFlags();
    }
  }, [restaurateurData, status, activeTab]);

  // Handle search for restaurants
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&restaurants=true&meals=false&categories=false&locations=false`);
          if (!response.ok) throw new Error("Search failed");
          
          const data = await response.json();
          
          // Transform the data to match the SearchResult interface
          const formattedResults: SearchResult[] = (data.results || [])
            .filter((result: any) => result.type === "Restaurant")
            .map((result: any) => ({
              id: result.id,
              title: result.name,
              location: result.location || "Location not available",
              category: result.category || []
            }));
          
          setSearchResults(formattedResults);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Open connection modal for a restaurant
  const handleOpenConnectionModal = (restaurant: SearchResult): void => {
    setSelectedRestaurant({
      id: restaurant.id,
      title: restaurant.title,
      location: restaurant.location,
      category: restaurant.category
    });
    setIsConnectionModalOpen(true);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Handle connection modal close
  const handleConnectionModalClose = (): void => {
    setIsConnectionModalOpen(false);
    setSelectedRestaurant(null);
  };

  // Handle successful connection request
  const handleConnectionSuccess = async (): Promise<void> => {
    // Refresh connection requests after successful submission
    if (restaurateurData?.id) {
      try {
        const response = await fetch(`/api/restaurateur/connection-requests?restaurateurId=${restaurateurData.id}`);
        if (response.ok) {
          const data = await response.json();
          setConnectionRequests(data);
        }
      } catch (error) {
        console.error("Error refreshing connection requests:", error);
      }
    }
  };

  // Get the time-based greeting
  const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 18) return "Good Afternoon,";
    return "Good Evening,";
  };

  // Get card color based on index
  const getCardColor = (index: number): string => {
    const colors = [colorScheme.card1, colorScheme.card2, colorScheme.card3, colorScheme.card4];
    return colors[index % colors.length] ?? "#ffffff"; // fallback color
  };
  

  // Calculate stats
  const getPendingReviewsCount = (): number => {
    return reviews.filter(review => !review.restaurantResponse).length;
  };

  const getTotalReviewsCount = (): number => {
    return reviews.length;
  };

  const getAverageRating = (): number => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  };

  const getPendingRequestsCount = (): number => {
    return connectionRequests.filter(request => request.status === "pending").length;
  };

  // Render the dashboard header
  const renderHeader = (): JSX.Element => {
    return (
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            {getTimeBasedGreeting()} {restaurateurData?.contactPersonName?.split(' ')[0] || "Restaurant Manager"}!
          </h1>
          <p className="text-gray-600 flex items-center">
            <FontAwesomeIcon icon={faStore} className="mr-1 text-gray-500" />
            {restaurateurData?.restaurantName || "Restaurant Manager"}
          </p>
        </div>
        
        <div className="flex gap-4">
          <Link
            href="/profile/restaurateur"
            className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 bg-white hover:shadow-md transition-all"
          >
            Edit Profile
          </Link>
          
          {/* Notifications bell - would implement notifications feature in future */}
          <button className="relative p-2 rounded-full bg-white border border-gray-300 hover:shadow-md transition-all">
            <FontAwesomeIcon icon={faBell} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              2
            </span>
          </button>
        </div>
      </div>
    );
  };

  // Render stats section
  const renderStats = (): JSX.Element => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard 
          bgColor="bg-[#faf2e5]"
          iconBgColor="bg-[#f2d36e]"
          icon={faUtensils}
          title="Total Restaurants"
          value={restaurants.length}
          isLoading={isLoadingRestaurants}
        />
        
        <StatCard 
          bgColor="bg-[#fdedf6]"
          iconBgColor="bg-[#f9c3c9]"
          icon={faStar}
          title="Average Rating"
          value={getAverageRating()}
          isLoading={isLoadingReviews}
        />
        
        <StatCard 
          bgColor="bg-[#fbe9fc]"
          iconBgColor="bg-[#f5b7ee]"
          icon={faMessage}
          title="Pending Reviews"
          value={getPendingReviewsCount()}
          isLoading={isLoadingReviews}
        />
        
        <StatCard 
          bgColor="bg-[#f1eafe]"
          iconBgColor="bg-[#dab9f8]"
          icon={faLink}
          title="Pending Requests"
          value={getPendingRequestsCount()}
          isLoading={isLoading}
        />
      </div>
    );
  };

  // Update the renderTabs function to include the Menu Management tab
  const renderTabs = (): JSX.Element => {
    return (
      <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-sm p-1 mb-8 max-w-md">
        <div className="flex flex-wrap">
          <button 
            className={`py-3 px-4 font-medium rounded-lg transition-all ${
              activeTab === 'My Restaurants' 
              ? 'bg-[#faf2e8] text-black' 
              : 'text-gray-600 hover:bg-white/50'
            }`}
            onClick={() => setActiveTab('My Restaurants')}
          >
            My Restaurants
          </button>
          <button 
            className={`py-3 px-4 font-medium rounded-lg transition-all ${
              activeTab === 'Menu Management' 
              ? 'bg-[#fbe9fc] text-black' 
              : 'text-gray-600 hover:bg-white/50'
            }`}
            onClick={() => setActiveTab('Menu Management')}
          >
            Menu Management
          </button>
          <button 
            className={`py-3 px-4 font-medium rounded-lg transition-all ${
              activeTab === 'Connection Requests' 
              ? 'bg-[#fad9ea] text-black' 
              : 'text-gray-600 hover:bg-white/50'
            }`}
            onClick={() => setActiveTab('Connection Requests')}
          >
            Connection Requests
          </button>
          <button 
            className={`py-3 px-4 font-medium rounded-lg transition-all ${
              activeTab === 'Reviews' 
              ? 'bg-[#d7b6f6] text-black' 
              : 'text-gray-600 hover:bg-white/50'
            }`}
            onClick={() => setActiveTab('Reviews')}
          >
            Reviews
          </button>
        </div>
      </div>
    );
  };

  // Render search bar for restaurants
  const renderRestaurantSearch = (): JSX.Element => {
    return (
      <div className="mb-6 relative" ref={searchContainerRef}>
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-bold flex-1">Connect to Restaurants</h2>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600">
            Search for restaurants to request a connection. Once connected, you can manage the restaurant's menu, respond to reviews, and more.
          </p>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search for restaurants by name, location, or cuisine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            ref={searchInputRef}
            className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f2d36e]"
          />
          <FontAwesomeIcon 
            icon={faSearch} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 z-10 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
            {searchResults.map((restaurant) => (
              <div 
                key={restaurant.id} 
                className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleOpenConnectionModal(restaurant)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{restaurant.title}</h3>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-gray-400" />
                      {restaurant.location}
                    </p>
                  </div>
                  <button className="text-[#dab9f8] hover:text-[#c9a2f2] text-sm">
                    Request Connection
                  </button>
                </div>
                {Array.isArray(restaurant.category) && restaurant.category.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {restaurant.category.slice(0, 3).map((cat, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render tabs content
  const renderTabContent = (): JSX.Element => {
    // My Restaurants tab content
    if (activeTab === "My Restaurants") {
      return (
        <div>
          {renderRestaurantSearch()}
          
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Connected Restaurants</h2>
            </div>
            
            {isLoadingRestaurants ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
              </div>
            ) : restaurants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant, index) => (
                  <div
                    key={restaurant.id}
                    className={`rounded-xl shadow-sm p-5 transition-all hover:shadow-md ${getCardColor(index)}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg">{restaurant.title}</h3>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                      <span>{restaurant.location}</span>
                    </div>
                    
                    {Array.isArray(restaurant.category) && restaurant.category.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {restaurant.category.slice(0, 3).map((cat, i) => (
                          <span key={i} className="text-xs bg-white px-2 py-1 rounded-full">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
                      <Link
                        href={`/restaurant-dashboard/${restaurant.id}`}
                        className="text-sm text-[#dab9f8] hover:underline"
                      >
                        Manage Restaurant
                      </Link>
                      
                      <span className="text-sm text-gray-500">
                      {(restaurant._count?.reviews ?? 0)} Reviews
                    </span>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/50 rounded-xl">
                <FontAwesomeIcon icon={faStore} className="text-4xl text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No connected restaurants yet</h3>
                <p className="text-gray-500 mb-6">Search for restaurants above to request connections.</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Menu Management tab content
    if (activeTab === "Menu Management") {
      return (
        <div>
          {restaurants.length === 0 ? (
            <div className="text-center py-12 bg-white/50 rounded-xl">
              <FontAwesomeIcon icon={faUtensils} className="text-4xl text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No restaurants available</h3>
              <p className="text-gray-500 mb-6">You need to connect to a restaurant before managing menus.</p>
              <button
                onClick={() => setActiveTab("My Restaurants")}
                className="px-6 py-3 bg-[#f2d36e] text-white rounded-full hover:bg-[#e6c860] transition-colors"
              >
                Connect to Restaurants
              </button>
            </div>
          ) : restaurants.length === 1 ? (
            // If there's only one restaurant, show its menu directly
          <MenuManagement restaurantId={restaurants[0]?.id ?? ""} />
          ) : (
            // If there are multiple restaurants, show a selector
            <div>
              <div className="mb-6">
                <label htmlFor="restaurantSelector" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Restaurant to Manage Menu
                </label>
                <select
                  id="restaurantSelector"
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                  onChange={(e) => {
                    // Force a re-render when the selection changes
                    if (e.target.value) {
                      setActiveTab("Menu Management");
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Select a restaurant</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.title}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Show the menu management for the selected restaurant */}
              {document.getElementById("restaurantSelector") && 
               (document.getElementById("restaurantSelector") as HTMLSelectElement).value ? (
                <MenuManagement 
                  restaurantId={(document.getElementById("restaurantSelector") as HTMLSelectElement).value} 
                />
              ) : (
                <div className="text-center py-12 bg-white/50 rounded-xl">
                  <p className="text-gray-500">
                    Please select a restaurant to manage its menu.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    // Connection Requests tab content
    if (activeTab === "Connection Requests") {
      return (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Your Connection Requests</h2>
          </div>
          
          {connectionRequests.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto flex flex-col gap-4 pr-4">
              {connectionRequests.map((request, index) => (
                <div
                  key={request.id}
                  className={`rounded-xl shadow-sm p-5 transition-all hover:shadow-md ${getCardColor(index)}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{request.restaurant.title}</h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-gray-400" />
                        {request.restaurant.location}
                      </p>
                    </div>
                    
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      request.status === "approved" 
                        ? "bg-green-100 text-green-800" 
                        : request.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </div>
                  </div>
                  
                  {request.message && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                      <strong>Your message:</strong> {request.message}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    <p>Submitted: {new Date(request.submittedAt).toLocaleDateString()}</p>
                    {request.reviewedAt && (
                      <p>Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                  
                  {request.status === "pending" && (
                    <div className="mt-3 flex justify-end">
                      <button 
                        onClick={() => {
                          // This would be implemented to cancel a pending request
                          alert("Cancel request functionality would be implemented here");
                        }}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/50 rounded-xl">
              <FontAwesomeIcon icon={faLink} className="text-4xl text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No connection requests yet</h3>
              <p className="text-gray-500 mb-6">Go to the My Restaurants tab to search for restaurants and request connections.</p>
            </div>
          )}
        </div>
      );
    }
    
    // Reviews tab content
    if (activeTab === "Reviews") {
      return (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Reviews</h2>
            <div className="flex gap-3">
              <select 
                className="px-3 py-2 border border-gray-200 rounded-md text-sm"
                onChange={(e) => {
                  // This would filter reviews by restaurant
                  alert("Filter functionality would be implemented here");
                }}
              >
                <option value="">All Restaurants</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.title}
                  </option>
                ))}
              </select>
              
              <select 
                className="px-3 py-2 border border-gray-200 rounded-md text-sm"
                onChange={(e) => {
                  // This would filter reviews by status (responded/not responded)
                  alert("Filter functionality would be implemented here");
                }}
              >
                <option value="">All Reviews</option>
                <option value="responded">Responded</option>
                <option value="not-responded">Not Responded</option>
              </select>
            </div>
          </div>
          
          {isLoadingReviews ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
            </div>
          ) : reviews.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto flex flex-col gap-4 pr-4">
              {reviews.map((review, index) => (
                <div
                  key={review.id}
                  className={`rounded-xl shadow-sm p-5 transition-all hover:shadow-md ${getCardColor(index)}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span 
                            key={star} 
                            className={`${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-gray-600 text-sm">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="mt-2 text-sm font-medium">
                        By: {review.isAnonymous ? "Anonymous User" : `${review.patron?.firstName} ${review.patron?.lastName}`}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        className="p-2 text-gray-600 hover:text-red-500"
                        title="Flag review"
                        onClick={() => {
                          // This would open a modal to flag a review
                          alert("Flag review functionality would be implemented here");
                        }}
                      >
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">
                    {review.content}
                  </p>
                  
                  {/* Restaurant response section */}
                  {review.restaurantResponse ? (
                    <div className="bg-blue-50 p-3 rounded-md mb-3">
                      <p className="text-sm font-medium text-blue-800 mb-1">Your Response:</p>
                      <p className="text-sm text-gray-700">{review.restaurantResponse}</p>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <button
                        className="text-[#dab9f8] hover:text-[#c9a2f2] text-sm font-medium"
                        onClick={() => {
                          // This would open a modal to respond to the review
                          alert("Respond to review functionality would be implemented here");
                        }}
                      >
                        Respond to Review
                      </button>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div>
                      {review.upvotes} upvotes
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/50 rounded-xl">
              <FontAwesomeIcon icon={faFileAlt} className="text-4xl text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No reviews yet</h3>
              <p className="text-gray-500 mb-6">Once your restaurants receive reviews, they will appear here.</p>
            </div>
          )}
        </div>
      );
    }
    
    // Default fallback
    return <div>Select a tab to view content</div>;
  };

  // If not authenticated or loading initial data
  if (status === "unauthenticated") {
    router.push("/login");
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Please log in to access the restaurant dashboard.</p>
      </div>
    );
  }

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
      </div>
    );
  }

  // If restaurateur verification status is not approved
  if (restaurateurData && restaurateurData.verificationStatus !== "APPROVED") {
    return (
      <div className="with-navbar container mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <FontAwesomeIcon 
              icon={restaurateurData.verificationStatus === "PENDING" ? faExclamationTriangle : faExclamationTriangle} 
              className={`text-5xl ${restaurateurData.verificationStatus === "PENDING" ? "text-yellow-500" : "text-red-500"} mb-4`}
            />
            <h1 className="text-2xl font-bold">
              {restaurateurData.verificationStatus === "PENDING" 
                ? "Your Account is Pending Verification" 
                : "Your Account Verification was Rejected"}
            </h1>
          </div>
          
          <div className="mb-6">
            {restaurateurData.verificationStatus === "PENDING" ? (
              <p className="text-gray-600">
                Your restaurant account is currently being reviewed by our team. Once verified, you'll be able to access the dashboard and connect with your restaurants.
                This process typically takes 1-2 business days.
              </p>
            ) : (
              <p className="text-gray-600">
                Unfortunately, your account verification was rejected. This could be due to incomplete or incorrect information.
                Please update your profile with accurate business details and submit for verification again.
              </p>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-2">Your Information</h3>
            <p><strong>Business Name:</strong> {restaurateurData.restaurantName}</p>
            <p><strong>Contact Name:</strong> {restaurateurData.contactPersonName}</p>
            <p><strong>Email:</strong> {restaurateurData.email}</p>
            <p><strong>Submitted On:</strong> {new Date(restaurateurData.submittedAt).toLocaleDateString()}</p>
          </div>
          
          <div className="flex justify-center">
            <Link 
              href="/profile/restaurateur"
              className="px-6 py-3 bg-[#dab9f8] text-white rounded-full hover:bg-[#c9a2f2] transition-colors"
            >
              {restaurateurData.verificationStatus === "PENDING" 
                ? "View Profile" 
                : "Update Profile & Resubmit"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard display
  return (
    <div>
      <main className="container mx-auto px-6 py-6">
        {/* User Profile Section */}
        {renderHeader()}
        
        {/* Stats Cards */}
        {renderStats()}
        
        {/* Tabs */}
        {renderTabs()}
        
        {/* Content based on active tab */}
        {renderTabContent()}
        
        {/* Connection Modal */}
        {isConnectionModalOpen && selectedRestaurant && (
          <RestaurantConnectionModal
            isOpen={isConnectionModalOpen}
            onClose={handleConnectionModalClose}
            restaurant={selectedRestaurant}
            onSuccess={handleConnectionSuccess}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-white/20 backdrop-blur-md border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="bg-[#f2d36e] rounded-full h-8 w-8 flex items-center justify-center">
                <FontAwesomeIcon icon={faUtensils} className="text-sm text-white" />
              </div>
              <p className="ml-2 text-sm">© 2025 Chow You Doing? Restaurant Dashboard</p>
            </div>
            
            <div className="flex gap-6">
              <Link href="/terms" className="text-sm text-gray-600 hover:text-[#f3b4eb]">Terms of Service</Link>
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-[#f3b4eb]">Privacy Policy</Link>
              <Link href="/contact" className="text-sm text-gray-600 hover:text-[#f3b4eb]">Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}