// src/app/restaurant-dashboard/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  faBell,
  faComment,
  faChartLine,
  faGlobe,
  faReceipt
} from "@fortawesome/free-solid-svg-icons";
import RestaurantConnectionModal from "../_components/RestaurantConnectionModal";
import MenuManagement from "@/app/_components/MenuManagement";
import StatCard from '@/app/_components/StatCard';
import ReviewManagement from "@/app/_components/ReviewManagement"; 
import { faEdit } from "@fortawesome/free-regular-svg-icons";
import ReceiptVerificationManagement from "@/app/_components/ReceiptVerificationManagement";

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
  widerAreas?: any;
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
  const [isLoadingConnectionRequests, setIsLoadingConnectionRequests] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("Overview");

  // Connection modal state
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Reviews state
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [reviewFlags, setReviewFlags] = useState<ReviewFlag[]>([]);
  const [isLoadingFlags, setIsLoadingFlags] = useState<boolean>(true);

  // Search container refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [restaurateurId, setRestaurateurId] = useState<string>("");

  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    pendingResponses: 0, 
    averageRating: 0
  });

  const [receiptStats, setReceiptStats] = useState({
    total: 0,
    pending: 0
  });
  
  // Color scheme for UI elements
  const colorScheme: ColorScheme = {
    card1: "#fdf9f5",
    card2: "#fdedf6",
    card3: "#fbe9fc",
    card4: "#f1eafe",
    accent: "#faf2e5"
  };
  
  const fetchReceiptStats = async (): Promise<void> => {
    if (!restaurateurId) return;
    
    try {
      // Fetch pending stats
      const response = await fetch(`/api/restaurateur/receipt-verifications/stats?restaurateurId=${restaurateurId}`);
      
      if (response.ok) {
        const data = await response.json();
        setReceiptStats({
          total: data.total || 0,
          pending: data.pending || 0
        });
      }
    } catch (error) {
      console.error("Error fetching receipt stats:", error);
    }
  };

  useEffect(() => {
    if (restaurateurId) {
      fetchReceiptStats();
    }
  }, [restaurateurId]);


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

  // Fetch connection requests - now always runs when restaurateurData changes
  useEffect(() => {
    const fetchConnectionRequests = async (): Promise<void> => {
      if (status !== "authenticated" || !restaurateurData?.id) return;
      
      try {
        setIsLoadingConnectionRequests(true);
        const response = await fetch(`/api/restaurateur/connection-requests?restaurateurId=${restaurateurData.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch connection requests");
        }
        
        const data = await response.json();
        setConnectionRequests(data);
      } catch (error) {
        console.error("Error fetching connection requests:", error);
      } finally {
        setIsLoadingConnectionRequests(false);
      }
    };

    // Always fetch connection requests when restaurateurData is available
    if (restaurateurData?.id) {
      fetchConnectionRequests();
    }
  }, [restaurateurData, status]);

  // Callback to receive stats from ReviewManagement
  const handleReviewStatsUpdate = (stats: { 
    totalReviews: number; 
    pendingResponses: number; 
    averageRating: number 
  }): void => {
    setReviewStats(stats);
  };

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
  
  // Safe stats getters that use reviewStats
  const getAverageRating = (): number => {
    return reviewStats.averageRating;
  };

  const getPendingReviewsCount = (): number => {
    return reviewStats.pendingResponses;
  };

  const getTotalReviewsCount = (): number => {
    return reviewStats.totalReviews;
  };

  const getPendingRequestsCount = (): number => {
    if (!Array.isArray(connectionRequests)) return 0;
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
  const renderRestaurantDetails = (): JSX.Element => {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Restaurant Details */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Restaurant Details</h2>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Categories</h3>
              {restaurants && restaurants.length > 0 && 
                restaurants[0]?.category && 
                Array.isArray(restaurants[0].category) && 
                restaurants[0].category.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {restaurants[0].category.map((cat: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-[#faf2e5] text-gray-700 rounded-full text-sm">
                      {cat}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No categories</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Food Interests</h3>
              <p className="text-gray-500">No interests</p>
            </div>
          </div>
          
          {/* Right column - Performance */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Performance</h2>
            
            <div className="space-y-4">
              {/* Average Rating Card */}
              <div className="bg-[#faf2e5] p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm text-gray-500 mb-2">Average Rating</h3>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold mr-2">{getAverageRating()}</span>
                      <div className="flex text-gray-300">
                        {[1, 2, 3, 4, 5].map(star => (
                          <FontAwesomeIcon 
                            key={star} 
                            icon={faStar} 
                            className={star <= getAverageRating() ? 'text-yellow-400' : 'text-gray-300'} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#f2d36e] p-2 rounded-full">
                    <FontAwesomeIcon icon={faStar} className="text-white" />
                  </div>
                </div>
              </div>
              
              {/* Total Reviews Card */}
              <div className="bg-[#fdedf6] p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm text-gray-500 mb-2">Total Reviews</h3>
                    <p className="text-2xl font-bold">{getTotalReviewsCount()}</p>
                  </div>
                  <div className="bg-[#f9c3c9] p-2 rounded-full">
                    <FontAwesomeIcon icon={faComment} className="text-white" />
                  </div>
                </div>
              </div>
              
              {/* Pending Responses Card */}
              <div className="bg-[#fbe9fc] p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm text-gray-500 mb-2">Pending Responses</h3>
                    <p className="text-2xl font-bold">{getPendingReviewsCount()}</p>
                  </div>
                  <div className="bg-[#f5b7ee] p-2 rounded-full">
                    <FontAwesomeIcon icon={faMessage} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  

// Updated renderTabs function with Overview as first tab
const renderTabs = (): JSX.Element => {
  return (
    <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-sm p-1 mb-8 max-w-md">
      <div className="flex flex-wrap">
        <button 
          className={`py-3 px-4 font-medium rounded-lg transition-all ${
            activeTab === 'Overview' 
            ? 'bg-[#faf2e8] text-black' 
            : 'text-gray-600 hover:bg-white/50'
          }`}
          onClick={() => setActiveTab('Overview')}
        >
          Overview
        </button>
        <button 
          className={`py-3 px-4 font-medium rounded-lg transition-all ${
            activeTab === 'My Restaurants' 
            ? 'bg-[#fad9ea] text-black' 
            : 'text-gray-600 hover:bg-white/50'
          }`}
          onClick={() => setActiveTab('My Restaurants')}
        >
          My Restaurants
        </button>
        <button 
          className={`py-3 px-4 font-medium rounded-lg transition-all ${
            activeTab === 'Reviews' 
            ? 'bg-[#fbe9fc] text-black' 
            : 'text-gray-600 hover:bg-white/50'
          }`}
          onClick={() => setActiveTab('Reviews')}
        >
          Reviews
        </button>
        <button 
          className={`py-3 px-4 font-medium rounded-lg transition-all ${
            activeTab === 'Menu Management' 
            ? 'bg-[#f1eafe] text-black' 
            : 'text-gray-600 hover:bg-white/50'
          }`}
          onClick={() => setActiveTab('Menu Management')}
        >
          Menu Management
        </button>
        <button 
          className={`py-3 px-4 font-medium rounded-lg transition-all ${
            activeTab === 'Receipt Verifications' 
            ? 'bg-[#dcf1e5] text-black' 
            : 'text-gray-600 hover:bg-white/50'
          }`}
          onClick={() => setActiveTab('Receipt Verifications')}
        >
          Receipt Verifications
          {receiptStats.pending > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {receiptStats.pending}
            </span>
          )}
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

  const renderConnectionRequests = (): JSX.Element => {
    return (
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Connection Requests</h2>
        </div>
        
        {isLoadingConnectionRequests ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f2d36e]"></div>
          </div>
        ) : connectionRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connectionRequests.map((request, index) => (
              <div
                key={request.id}
                className={`rounded-xl shadow-sm p-5 transition-all hover:shadow-md ${getCardColor(index + restaurants.length)}`}
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
          <div className="text-center py-8 bg-white/50 rounded-xl">
            <p className="text-gray-500">
              You haven't made any connection requests yet. Search for restaurants above to get started.
            </p>
          </div>
        )}
      </div>
    );
  };

        // Use useMemo to prevent recreating the restaurants array on every render
        const memoizedRestaurants = useMemo(() => {
          return restaurants.map(r => ({ id: r.id, title: r.title }));
        }, [restaurants]);

// Restaurant Dashboard Overview Section with Quick Actions
const renderOverviewSection = (): JSX.Element => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Restaurant Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Rating Stat */}
        <div className="bg-[#faf2e5] p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm text-gray-500">Rating</h3>
              <p className="text-2xl font-bold">{getAverageRating()}</p>
            </div>
            <div className="bg-[#f2d36e] p-2 rounded-full">
              <FontAwesomeIcon icon={faStar} className="text-white" />
            </div>
          </div>
        </div>
        
        {/* Reviews Stat */}
        <div className="bg-[#fdedf6] p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm text-gray-500">Reviews</h3>
              <p className="text-2xl font-bold">{getTotalReviewsCount()}</p>
            </div>
            <div className="bg-[#f9c3c9] p-2 rounded-full">
              <FontAwesomeIcon icon={faComment} className="text-white" />
            </div>
          </div>
        </div>
        
        {/* Menu Items Stat */}
        <div className="bg-[#fbe9fc] p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm text-gray-500">Menu Items</h3>
              <p className="text-2xl font-bold">
                {Array.isArray(restaurants) && restaurants.length > 0 ? restaurants.length : 0}
              </p>
            </div>
            <div className="bg-[#f5b7ee] p-2 rounded-full">
              <FontAwesomeIcon icon={faUtensils} className="text-white" />
            </div>
          </div>
        </div>
        
        {/* Receipt Verification Card - NEW */}
        <div className="bg-[#dcf1e5] p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm text-gray-500">Receipt Verifications</h3>
              <p className="text-2xl font-bold">{receiptStats.total}</p>
              {receiptStats.pending > 0 && (
                <p className="text-sm text-red-500">{receiptStats.pending} pending</p>
              )}
            </div>
            <div className="bg-[#4ade80] p-2 rounded-full">
              <FontAwesomeIcon icon={faReceipt} className="text-white" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/profile/restaurateur"
            className="p-4 bg-[#faf2e5] rounded-lg flex items-center gap-3 hover:shadow-md transition-all"
          >
            <div className="bg-[#f2d36e] p-2 rounded-full">
              <FontAwesomeIcon icon={faEdit} className="text-white" />
            </div>
            <div>
              <h4 className="font-medium">Edit Profile</h4>
              <p className="text-sm text-gray-600">Update restaurant details</p>
            </div>
          </Link>
          
          <button
            onClick={() => setActiveTab('Menu Management')}
            className="p-4 bg-[#fdedf6] rounded-lg flex items-center gap-3 hover:shadow-md transition-all"
          >
            <div className="bg-[#f9c3c9] p-2 rounded-full">
              <FontAwesomeIcon icon={faUtensils} className="text-white" />
            </div>
            <div>
              <h4 className="font-medium">Manage Menu</h4>
              <p className="text-sm text-gray-600">Update food & drink items</p>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('Reviews')}
            className="p-4 bg-[#fbe9fc] rounded-lg flex items-center gap-3 hover:shadow-md transition-all"
          >
            <div className="bg-[#f5b7ee] p-2 rounded-full">
              <FontAwesomeIcon icon={faComment} className="text-white" />
            </div>
            <div>
              <h4 className="font-medium">Respond to Reviews</h4>
              <p className="text-sm text-gray-600">{getPendingReviewsCount()} pending</p>
            </div>
          </button>
          
          {/* Add Receipt Verification Quick Action Button - NEW */}
          <button
            onClick={() => setActiveTab('Receipt Verifications')}
            className="p-4 bg-[#dcf1e5] rounded-lg flex items-center gap-3 hover:shadow-md transition-all"
          >
            <div className="bg-[#4ade80] p-2 rounded-full">
              <FontAwesomeIcon icon={faReceipt} className="text-white" />
            </div>
            <div>
              <h4 className="font-medium">Receipt Verifications</h4>
              <p className="text-sm text-gray-600">
                {receiptStats.pending > 0 ? `${receiptStats.pending} pending` : "Verify receipts"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};


// Update renderTabContent to handle the new Overview tab
const renderTabContent = (): JSX.Element => {
  // Overview tab content
  if (activeTab === "Overview") {
    return (
      <div>
        
        {/* Overview Section */}
        {renderOverviewSection()}
      </div>
    );
  }
  
  // My Restaurants tab content (combining restaurants and connection requests)
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
                    <div>
                      <h3 className="font-semibold text-lg">{restaurant.title}</h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-gray-400" />
                        <span>{restaurant.location}</span>
                      </p>
                    </div>
                    {/* Edit Button for Restaurant */}
                    <Link
                      href={`/restaurant-dashboard/${restaurant.id}/edit`}
                      className="p-2 text-[#dab9f8] hover:text-[#c9a2f2] transition-colors"
                      title="Edit Restaurant"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Link>
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
        
        {/* Connection Requests Section */}
        {renderConnectionRequests()}
      </div>
    );
  }
  
  // Reviews tab content - ONLY ONE VERSION
  if (activeTab === "Reviews") {
    return (
      <div>
        {restaurateurData && restaurants.length > 0 ? (
          <ReviewManagement 
            restaurateurId={restaurateurData.id} 
            restaurants={memoizedRestaurants}
            onStatsUpdate={handleReviewStatsUpdate}
          />
        ) : (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
          </div>
        )}
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
  
   // Receipt Verifications Tab
   if (activeTab === "Receipt Verifications") {
    return (
      <div>
        {restaurateurData ? (
          <ReceiptVerificationManagement 
            restaurateurId={restaurateurData.id} 
            restaurants={memoizedRestaurants}
          />
        ) : (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
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
      {renderHeader()}

        {/* User Profile Section */}
        {renderRestaurantDetails()}
        
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