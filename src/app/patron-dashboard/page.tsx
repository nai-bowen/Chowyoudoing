/*eslint-disable*/
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import EditReviewModal from "@/app/_components/EditReviewModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {  
  faTrash, 
  faSearch,
  faMapMarkerAlt,
  faPlus,
  faUtensils,
  faTrophy,
  faTimes,
  faAward
} from "@fortawesome/free-solid-svg-icons";
import {  faStar, 
  faEdit, faHeart} from  "@fortawesome/free-regular-svg-icons";
import WriteReviewModal from "@/app/_components/WriteReviewModal";
import ReviewModal from '@/app/_components/ReviewModal';


// Define interfaces for the types of data we'll be working with
interface Review {
  userVote: { isUpvote: boolean; } | undefined;
  imageUrl: string | undefined;
  valueForMoney: number;
  asExpected: number;
  wouldRecommend: number;
  id: string;
  title?: string;
  content?: string;
  date?: string;
  upvotes?: number;
  rating?: number;
  text?: string;
  restaurant?: string;
  restaurantId?: string; // Add this field
  author?: string;
  patron?: {
    firstName: string;
    lastName: string;
  };
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  url: string;
  restaurant?: string;
}

interface Restaurant {
  id: string;
  title: string;
  location: string;
  category?: string[] | string;
  detail?: string;
  rating?: string;
  num_reviews?: string;
}

interface UserData {
  name: string;
  email: string;
  id: string;
}

// Define a type for the color scheme
interface ColorScheme {
  card1: string;
  card2: string;
  card3: string;
  card4: string;
  accent: string;
}

interface Favorite {
  id: string;
  createdAt: string;
  restaurant?: {
    id: string;
    title: string;
    location: string;
    category: string[] | string;
  };
  review?: {
    id: string;
    content: string;
    rating: number;
    restaurant?: {
      title: string;
    }
  };
}



export default function PatronDashboard(): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [topReviews, setTopReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingUserReviews, setIsLoadingUserReviews] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("My Reviews");

  // New states for search functionality
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  //for Certified Foodie
  const [isCertifiedFoodie, setIsCertifiedFoodie] = useState<boolean>(false);
  const [showCertificationNotification, setShowCertificationNotification] = useState<boolean>(false);
  const [certificationDate, setCertificationDate] = useState<string | null>(null);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<{id: string, name: string} | null>(null);

  const [isEditReviewModalOpen, setIsEditReviewModalOpen] = useState<boolean>(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string>("");

  const [favourites, setfavourites] = useState<Favorite[]>([]);
  const [isLoadingfavourites, setIsLoadingfavourites] = useState<boolean>(true);
  const [favouritesError, setfavouritesError] = useState<string | null>(null);
  

  // Color scheme for UI elements
  const colorScheme: ColorScheme = {
    card1: "#fdf9f5",
    card2: "#fdedf6",
    card3: "#fbe9fc",
    card4: "#f1eafe",
    accent: "#faf2e5"
  };
  const fetchfavourites = async (): Promise<void> => {
    if (status !== "authenticated") return;
    
    setIsLoadingfavourites(true);
    setfavouritesError(null);
    
    try {
      const response = await fetch("/api/profile/favourites");
      
      if (!response.ok) {
        throw new Error("Failed to fetch favourites");
      }
      
      const data = await response.json();
      console.log("Favourites data:", data);
      
      // Check if data.favorites exists (note the spelling difference!)
      if (Array.isArray(data.favorites)) {
        setfavourites(data.favorites);
      } else {
        console.error("Invalid favourites format:", data);
        setfavourites([]);
        setfavouritesError("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching favourites:", error);
      setfavouritesError(error instanceof Error ? error.message : "Unknown error");
      setfavourites([]);
    } finally {
      setIsLoadingfavourites(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string): Promise<void> => {
    if (status !== "authenticated" || !favoriteId) return;
    
    if (!confirm("Are you sure you want to remove this favorite?")) return;
    
    try {
      const response = await fetch(`/api/profile/favourites?id=${favoriteId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to remove favorite");
      }
      
      setfavourites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error("Error removing favorite:", error);
      // Refresh favourites on error
      fetchfavourites();
    }
  };
  useEffect(() => {
    if (activeTab === 'favourites' && status === "authenticated") {
      fetchfavourites();
    }
  }, [activeTab, status]);
  // Handle click outside of search container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const handleEditReview = (reviewId: string): void => {
    // Instead of navigating, open the modal
    setSelectedReviewId(reviewId);
    setIsEditReviewModalOpen(true);
  };

  // Add this function to handle the edit modal closing
  const handleEditModalClose = (): void => {
    setIsEditReviewModalOpen(false);
    setSelectedReviewId("");
    
    // After closing the modal, refresh user reviews to show the updated ones
    if (status === "authenticated" && ((session?.user as any)?.id || userData?.id)) {
      const userId = (session?.user as any)?.id || userData?.id;
      
      if (userId) {
        fetch(`/api/review?userId=${userId}`)
          .then(response => response.json())
          .then(data => {
            if (Array.isArray(data.reviews)) {
              setUserReviews(data.reviews);
            }
          })
          .catch(error => console.error("Error refreshing reviews:", error));
      }
    }
  };

  // Add this function to handle successful edits
  const handleEditSuccess = (): void => {
    // This will be called after a successful edit
    console.log("Review edited successfully");
  };
  // Focus search input when search is opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Fetch user data when session is available
  useEffect(() => {
    const fetchUserData = async (): Promise<void> => {
      if (status === "authenticated" && session?.user) {
        try {
          // If user data is directly available in the session
          if (session.user.name && session.user.email) {
            setUserData({
              name: session.user.name,
              email: session.user.email,
              id: (session.user as any).id || ""
            });
          } else {
            // If we need to fetch additional user data from the server
            const response = await fetch("/api/user/profile");
            if (!response.ok) {
              throw new Error("Failed to fetch user data");
            }
            const data = await response.json();
            setUserData(data.user);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to session data if available
          if (session.user.name) {
            setUserData({
              name: session.user.name,
              email: session.user.email as string,
              id: (session.user as any).id || ""
            });
          }
        }
      }
    };

    fetchUserData();
  }, [session, status]);

  // Fetch global top reviews
  useEffect(() => {
    const fetchTopReviews = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/review?limit=3");
        
        if (!response.ok) {
          throw new Error("Failed to fetch top reviews");
        }
        
        const data = await response.json();
        
        if (Array.isArray(data.reviews)) {
          setTopReviews(data.reviews);
        } else {
          setTopReviews([]);
        }
      } catch (error) {
        console.error("Error fetching top reviews:", error);
        setTopReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopReviews();
  }, []);

  // Fetch user reviews when user data is available
  useEffect(() => {
    const fetchUserReviews = async (): Promise<void> => {
      setIsLoadingUserReviews(true);
      setFetchError(null);
      
      // Only proceed if authenticated
      if (status !== "authenticated") {
        setIsLoadingUserReviews(false);
        return;
      }
      
      try {
        // Get user ID from session or state
        const userId = (session?.user as any)?.id || userData?.id;
        
        if (!userId) {
          setFetchError("No user ID available");
          setIsLoadingUserReviews(false);
          return;
        }
        
        // Fetch user's reviews
        const response = await fetch(`/api/review?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user reviews: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data.reviews)) {
          setUserReviews(data.reviews);
        } else {
          setUserReviews([]);
          setFetchError("Invalid review data format");
        }
      } catch (error) {
        console.error("Error fetching user reviews:", error);
        setFetchError(error instanceof Error ? error.message : "Unknown error");
        setUserReviews([]);
      } finally {
        setIsLoadingUserReviews(false);
      }
    };

    // Fetch user reviews when session and user data are available
    if (status === "authenticated" && ((session?.user as any)?.id || userData?.id)) {
      fetchUserReviews();
    }
  }, [session, userData, status]);

  // Handle search query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true);
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&restaurants=true&meals=false&categories=false&locations=false`);
          if (!response.ok) throw new Error("Search failed");
          
          const data = await response.json();
          
          // Transform the data to match the SearchResult interface
          const formattedResults: SearchResult[] = (data.results || []).map((result: any) => ({
            id: result.id,
            name: result.name,
            type: result.type,
            url: `/patron-search?q=${encodeURIComponent(result.name)}`,
            restaurant: result.restaurant
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
  }, [searchTerm]);

  // Handle opening the review modal
  const handleOpenReviewModal = (): void => {
    // Default to a blank restaurant initially
    setSelectedRestaurant({
      id: "",
      name: ""
    });
    setIsReviewModalOpen(true);
  };

  const handleViewFullReview = (review: Review): void => {
    setSelectedReview(review);
    setIsReviewModalOpen(true);
  };

  const handleVoteUpdate = (reviewId: string, newUpvotes: number, isUpvoted: boolean | null): void => {
    // Update the reviews list with the new upvote count
    setUserReviews(prevReviews => 
      prevReviews.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              upvotes: newUpvotes, 
              userVote: isUpvoted !== null ? { isUpvote: isUpvoted } : undefined 
            } 
          : review
      )
    );

    setTopReviews(prevReviews => 
      prevReviews.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              upvotes: newUpvotes, 
              userVote: isUpvoted !== null ? { isUpvote: isUpvoted } : undefined 
            } 
          : review
      )
    );
  };
  // Handle review delete
  const handleDeleteReview = async (reviewId: string): Promise<void> => {
    // Confirmation dialog
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/review/${reviewId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json() as { error: string };
        throw new Error(errorData.error || "Failed to delete review");
      }
      
      // Remove the deleted review from state
      setUserReviews(prevReviews => prevReviews.filter(review => review.id !== reviewId));
      
      // Show success message (optional)
      alert("Review deleted successfully");
    } catch (error) {
      console.error("Error deleting review:", error);
      alert(error instanceof Error ? error.message : "Failed to delete review");
    }
  };
  // Handle review modal close
  const handleReviewModalClose = (): void => {
    setIsReviewModalOpen(false);
    // After closing the modal, refresh user reviews to show any new ones
    if (status === "authenticated" && ((session?.user as any)?.id || userData?.id)) {
      const userId = (session?.user as any)?.id || userData?.id;
      
      if (userId) {
        fetch(`/api/review?userId=${userId}`)
          .then(response => response.json())
          .then(data => {
            if (Array.isArray(data.reviews)) {
              setUserReviews(data.reviews);
            }
          })
          .catch(error => console.error("Error refreshing reviews:", error));
      }
    }
  };

 
  // Filter reviews based on search query
  const filteredReviews = userReviews.filter(review => {
    const searchText = searchQuery.toLowerCase();
    return (
      (review.title?.toLowerCase().includes(searchText) || false) ||
      (review.content?.toLowerCase().includes(searchText) || false) ||
      (review.restaurant?.toLowerCase().includes(searchText) || false)
    );
  });

  //Dismiss Cert Foodie notification
  const dismissCertificationNotification = useCallback((): void => {
    setShowCertificationNotification(false);
    // Store in localStorage that this notification has been seen
    localStorage.setItem("certificationNotificationDismissed", "true");
  }, []);
  useEffect(() => {
    const checkCertificationStatus = async (): Promise<void> => {
      if (status !== "authenticated" || !userData?.id) return;
      
      try {
        const response = await fetch("/api/certification-requests");
        
        if (!response.ok) {
          throw new Error("Failed to fetch certification status");
        }
        
        const data = await response.json();
        
        if (data.isCertified) {
          setIsCertifiedFoodie(true);
          setCertificationDate(data.certificationDate);
          
          // Check if notification was previously dismissed
          const isDismissed = localStorage.getItem("certificationNotificationDismissed");
          if (!isDismissed) {
            setShowCertificationNotification(true);
          }
        }
      } catch (error) {
        console.error("Error fetching certification status:", error);
      }
    };
    
    checkCertificationStatus();
  }, [userData, status]);


  // Render star ratings
  const renderStars = (rating: number = 0): JSX.Element => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className={`${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Function to get tab background color based on active state and tab name
  const getTabColor = (tabName: string): string => {
    if (activeTab !== tabName) return "";
    
    switch(tabName) {
      case 'My Reviews':
        return colorScheme.card1;
      case 'favourites':
        return colorScheme.card2;
      case 'Recommendations':
        return colorScheme.card3;
      default:
        return colorScheme.accent;
    }
  };

  const getReviewCardColor = (index: number): string => {
    const colors: string[] = [
      "bg-[#fdf9f5]", 
      "bg-[#fdedf6]", 
      "bg-[#fbe9fc]", 
      "bg-[#f1eafe]"
    ];
    return colors[index % colors.length] || "bg-[#faf2e8]";
  };

  return (
    <div>
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
      {/* User Profile Section */}
      <div className="flex items-center mb-8">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <div className="h-16 w-16 bg-[#f2d36e] rounded-full flex items-center justify-center">
              <p className="text-white font-bold text-2xl">
                {userData?.name?.charAt(0) || "J"}
              </p>
            </div>
            {isCertifiedFoodie && (
              <div className="absolute -bottom-1 -right-1 bg-[#f2d36e] rounded-full p-1.5 border-2 border-white">
                <FontAwesomeIcon icon={faAward} className="text-white text-xs" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Good morning, {userData?.name?.split(' ')[0] || "John"}!</h1>
            {isCertifiedFoodie ? (
              <p className="text-[#f2d36e] font-medium flex items-center">
                <FontAwesomeIcon icon={faAward} className="mr-1" />
                Certified Foodie
              </p>
            ) : (
              <p className="text-gray-600 flex items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-gray-500" />
                New York, NY
              </p>
            )}
          </div>
        </div>
        
        <Link 
          href="/profile" 
          className="ml-auto px-4 py-2 border border-gray-300 rounded-full text-gray-700 bg-white hover:shadow-md transition-all"
        >
          Edit Profile
        </Link>
      </div>
        {/* Stats Cards - Made thinner and longer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#faf2e5] rounded-xl shadow-sm p-4 h-24 flex items-center">
            <div className="flex items-center gap-4">
              <div className="bg-[#f2d36e] rounded-full w-14 h-14 flex items-center justify-center">
                <FontAwesomeIcon icon={faStar} className="text-xl text-[#faf2e5]" />
              </div>
              <div>
                <h3 className="text-gray-600 text-sm">Reviews</h3>
                <p className="text-2xl font-bold">{userReviews.length || 24}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#fdedf6] rounded-xl shadow-sm p-4 h-24 flex items-center">
            <div className="flex items-center gap-4">
              <div className="bg-[#f9c3c9] rounded-full w-14 h-14 flex items-center justify-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xl text-[#fdedf6]" />
              </div>
              <div>
                <h3 className="text-gray-600 text-sm">Restaurants Visited</h3>
                <p className="text-2xl font-bold">42</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#fbe9fc] rounded-xl shadow-sm p-4 h-24 flex items-center">
            <div className="flex items-center gap-4">
              <div className="bg-[#f5b7ee] rounded-full w-14 h-14 flex items-center justify-center">
                <FontAwesomeIcon icon={faUtensils} className="text-xl text-[#fbe9fc]" />
              </div>
              <div>
                <h3 className="text-gray-600 text-sm">Trending</h3>
                <p className="text-2xl font-bold">Italian</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#f1eafe] rounded-xl shadow-sm p-4 h-24 flex items-center">
            <div className="flex items-center gap-4">
              <div className="bg-[#dab9f8] rounded-full w-14 h-14 flex items-center justify-center">
                <FontAwesomeIcon icon={faTrophy} className="text-xl text-[#f1eafe]" />
              </div>
              <div>
                <h3 className="text-gray-600 text-sm">Achievements</h3>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Moved to left, smaller and different colors */}
        <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-sm p-1 mb-8 max-w-md">
          <div className="flex">
            <button 
              className={`py-3 px-4 font-medium rounded-lg transition-all ${
                activeTab === 'My Reviews' 
                ? 'bg-[#faf2e8] text-black' 
                : 'text-gray-600 hover:bg-white/50'
              }`}
              onClick={() => setActiveTab('My Reviews')}
            >
              My Reviews
            </button>
            <button 
              className={`py-3 px-4 font-medium rounded-lg transition-all ${
                activeTab === 'favourites' 
                ? 'bg-[#fad9ea] text-black' 
                : 'text-gray-600 hover:bg-white/50'
              }`}
              onClick={() => setActiveTab('favourites')}
            >
              Favourites
            </button>
            <button 
              className={`py-3 px-4 font-medium rounded-lg transition-all ${
                activeTab === 'Recommendations' 
                ? 'bg-[#f7d1f9] text-black' 
                : 'text-gray-600 hover:bg-white/50'
              }`}
              onClick={() => setActiveTab('Recommendations')}
            >
              Recommendations
            </button>
          </div>
        </div>
  
        {/* Search Bar - Only visible in My Reviews tab */}
        {activeTab === 'My Reviews' && (
          <div className="mb-6 max-w-md relative">
            <input
              type="text"
              placeholder="Search your reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f2d36e]"
            />
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        )}
  
        {/* Content Area - Different based on active tab */}
        <div className="relative z-10">
          {/* My Reviews Tab Content */}
          {activeTab === 'My Reviews' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Your Reviews</h2>
                <button 
                  onClick={handleOpenReviewModal}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f2d36e] text-white rounded-full hover:bg-[#e6c860] transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-sm" />
                  New Review
                </button>
              </div>
    
              {isLoadingUserReviews ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
                </div>
              ) : fetchError ? (
                <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
                  <p>There was an error loading your reviews: {fetchError}</p>
                  <p className="mt-2">Please try refreshing the page.</p>
                </div>
              ) : filteredReviews.length > 0 ? (
                <div className="max-h-[800px] overflow-y-auto flex flex-col gap-4 pr-4">
                  {filteredReviews.map((review, index) => (
                    <div 
                      key={review.id} 
                      className={`rounded-xl shadow-sm p-5 transition-all hover:shadow-md ${getReviewCardColor(index)}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Link 
                            href={`/patron-search?id=${review.restaurantId || ""}`}
                            className="font-semibold hover:text-[#f3b4eb]"
                          >
                            {review.restaurant || "Restaurant Name"}
                          </Link>
                          <p className="text-sm text-gray-600">
                            {new Date(review.date || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditReview(review.id)}
                            className="p-2 text-gray-600 hover:text-[#f3b4eb]"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button 
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-2 text-gray-600 hover:text-red-500"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        {renderStars(review.rating || 0)}
                      </div>
                      
                      <p className="text-gray-700 mb-3 line-clamp-3">
                        {review.content || review.text || "No review content"}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 text-sm">
                          <span className="bg-white px-2 py-1 rounded-full text-gray-600">
                            {review.upvotes || 0} upvotes
                          </span>
                        </div>
                        <button 
                      onClick={() => handleViewFullReview(review)}
                      className="text-sm text-[#d7b6f6] hover:underline"
                    >
                      View Full Review
                    </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/50 rounded-xl">
                  <FontAwesomeIcon icon={faEdit} className="text-4xl text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No reviews yet</h3>
                  <p className="text-gray-500 mb-6">Start sharing your dining experiences!</p>
                  <Link 
                    href="/review" 
                    className="px-6 py-3 bg-[#f2d36e] text-white rounded-full hover:bg-[#e6c860] transition-colors"
                  >
                    Write Your First Review
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* favourites Tab Content */}
          {activeTab === 'favourites' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Your Favorite Restaurants</h2>
            
            {isLoadingfavourites ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
              </div>
            ) : favouritesError ? (
              <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
                <p>There was an error loading your favourites: {favouritesError}</p>
                <p className="mt-2">Please try refreshing the page.</p>
              </div>
            ) : favourites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favourites.map((favorite, index) => (
                  <div 
                    key={favorite.id} 
                    className={`rounded-xl shadow-sm p-5 transition-all hover:shadow-md ${getReviewCardColor(index)}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon in place of an image */}
                      <div className="w-16 h-16 bg-[#f9ebc3] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <FontAwesomeIcon icon={faHeart} className="text-[#f9c3c9] text-2xl" />
                      </div>
                      
                      <div className="flex-1">
                        {favorite.restaurant ? (
                          <>
                            <h3 className="font-semibold">
                              {favorite.restaurant.title || "Unknown Restaurant"}
                            </h3>

                            <div className="flex items-center mt-2 text-sm">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 mr-1" />
                              <span className="text-gray-600 truncate">
                                {favorite.restaurant.location || "Unknown location"}
                              </span>
                            </div>
                          </>
                        ) : favorite.review ? (
                          <>
                            <h3 className="font-semibold">
                              {favorite.review.restaurant?.title || "Review"}
                            </h3>
                            <div className="mt-1">
                              {renderStars(favorite.review.rating || 0)}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {favorite.review.content || "No content available"}
                            </p>
                          </>
                        ) : (
                          <h3 className="font-semibold">Unknown Favorite</h3>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
                      <Link 
                        href={favorite.restaurant 
                          ? `/patron-search?id=${favorite.restaurant.id}` 
                          : favorite.review 
                            ? `/review/${favorite.review.id}` 
                            : "#"
                        }
                        className="text-sm text-[#d7b6f6] hover:underline"
                      >
                        View Details
                      </Link>
                      <button 
                        onClick={() => handleRemoveFavorite(favorite.id)}
                        className="text-sm text-gray-500 hover:text-red-500 px-2 py-1 rounded-full hover:bg-red-50"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty state
              <div className="text-center py-12 bg-white/50 rounded-xl">
                <FontAwesomeIcon icon={faStar} className="text-4xl text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No favourites yet</h3>
                <p className="text-gray-500 mb-6">Save your favorite restaurants to find them quickly!</p>
                <Link 
                  href="/patron-search" 
                  className="px-6 py-3 bg-[#f2d36e] text-white rounded-full hover:bg-[#e6c860] transition-colors"
                >
                  Discover Restaurants
                </Link>
              </div>
            )}
          </div>
        )}

          {/* Recommendations Tab Content */}
          {activeTab === 'Recommendations' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Recommended For You</h2>
              
              {/* Empty state for recommendations */}
              <div className="text-center py-12 bg-white/50 rounded-xl">
                <FontAwesomeIcon icon={faUtensils} className="text-4xl text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No recommendations yet</h3>
                <p className="text-gray-500 mb-6">
                  Write reviews and browse restaurants to get personalized recommendations!
                </p>
                <Link 
                  href="/patron-search" 
                  className="px-6 py-3 bg-[#f2d36e] text-white rounded-full hover:bg-[#e6c860] transition-colors"
                >
                  Explore Restaurants
                </Link>
              </div>
            </div>
          )}

          {/* favourites Tab Content (has content) */}
          {activeTab === 'favourites' && false && (
            <div>
              <h2 className="text-xl font-bold mb-6">Your Favorite Restaurants</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder favourites since we don't have real data */}
                {[1, 2, 3].map((_, index) => (
                  <div 
                    key={index} 
                    className={`rounded-xl shadow-sm p-5 transition-all hover:shadow-md ${getReviewCardColor(index)}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={`/restaurant${index + 1}.jpg`} 
                          alt="Restaurant" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://via.placeholder.com/80";
                          }} 
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {["The Urban Bistro", "Coastal Kitchen", "Green Garden Cafe"][index]}
                        </h3>
                        <div className="flex text-yellow-400 text-sm mt-1">
                          {"★★★★★".slice(0, 4 + (index % 2))}
                          <span className="text-gray-300">{"★".repeat(5 - (4 + (index % 2)))}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {["American, Brunch", "Seafood, Bar", "Vegetarian, Healthy"][index]}
                        </p>
                        <div className="flex items-center mt-2 text-sm">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 mr-1" />
                          <span className="text-gray-600">
                            {["New York, NY", "Los Angeles, CA", "Portland, OR"][index]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
  
          {/* Recommendations Tab Content (has content) */}
          {activeTab === 'Recommendations' && false && (
            <div>
              <h2 className="text-xl font-bold mb-6">Recommended For You</h2>
              
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Based on your taste preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Sample recommended restaurants */}
                  {[1, 2, 3].map((_, index) => (
                    <div 
                      key={index} 
                      className={`rounded-xl shadow-sm p-5 transition-all hover:shadow-md ${getReviewCardColor(index + 3)}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={`/restaurant${index + 4}.jpg`} 
                            alt="Restaurant" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://via.placeholder.com/80";
                            }} 
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {["Little Italy", "Sushi Harmony", "Burger Junction"][index]}
                          </h3>
                          <div className="flex text-yellow-400 text-sm mt-1">
                            {"★★★★★".slice(0, 4 + (index % 2))}
                            <span className="text-gray-300">{"★".repeat(5 - (4 + (index % 2)))}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {["Italian, Pasta", "Japanese, Sushi", "American, Burgers"][index]}
                          </p>
                          <div className="flex items-center mt-2 text-xs">
                            <span className="bg-[#f2d36e]/30 text-[#D29501] px-2 py-0.5 rounded-full">
                              {["97% match", "94% match", "91% match"][index]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Popular in your area</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topReviews.length > 0 ? (
                    topReviews.map((review, index) => (
                      <div 
                        key={review.id} 
                        className={`rounded-xl shadow-sm p-5 transition-all hover:shadow-md ${getReviewCardColor(index)}`}
                      >
                        <h3 className="font-semibold">{review.restaurant || "Restaurant Name"}</h3>
                        <div className="flex text-yellow-400 text-sm mt-1 mb-2">
                          {renderStars(review.rating || 0)}
                        </div>
                        <p className="text-gray-700 text-sm mb-3 line-clamp-3 italic">
                          "{review.content || review.text || "No review content"}"
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            - {review.patron?.firstName || review.author || "Anonymous"}
                          </span>
                          <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                            {review.upvotes || 0} upvotes
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Placeholder top reviews
                    [1, 2, 3].map((_, index) => (
                      <div 
                        key={index} 
                        className={`rounded-xl shadow-sm p-5 transition-all hover:shadow-md ${getReviewCardColor(index)}`}
                      >
                        <h3 className="font-semibold">
                          {["Delicious Bistro", "Ocean Flavors", "Veggie Delight"][index]}
                        </h3>
                        <div className="flex text-yellow-400 text-sm mt-1 mb-2">
                          {"★★★★★".slice(0, 4 + (index % 2))}
                        </div>
                        <p className="text-gray-700 text-sm mb-3 line-clamp-3 italic">
                          "{[
                            "The food was absolutely incredible! The flavors were perfect and service was top-notch.",
                            "Best seafood I've had in years. Fresh and perfectly cooked.",
                            "Amazing vegetarian options with creative dishes that don't feel like an afterthought."
                          ][index]}"
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            - {["Sarah J.", "Michael T.", "Jessica K."][index]}
                          </span>
                          <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                            {[42, 38, 29][index]} upvotes
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Review Modal */}
        {isEditReviewModalOpen && (
          <EditReviewModal
            isOpen={isEditReviewModalOpen}
            onClose={handleEditModalClose}
            reviewId={selectedReviewId}
            onSuccess={handleEditSuccess}
          />
        )}
        {/* Review Modal */}
        {selectedRestaurant && (
          <WriteReviewModal
            isOpen={isReviewModalOpen}
            onClose={handleReviewModalClose}
            restaurantId={selectedRestaurant.id}
            restaurantName={selectedRestaurant.name}
          />
        )}

      {selectedReview && (
        <ReviewModal 
          review={{
            id: selectedReview.id,
            // Ensure required properties are always defined with non-null values
            content: selectedReview.content || selectedReview.text || "", 
            rating: typeof selectedReview.rating === 'number' ? selectedReview.rating : 5,
            
            // Include all optional properties with their original values or safe defaults
            date: selectedReview.date,
            upvotes: selectedReview.upvotes ?? 0,
            asExpected: selectedReview.asExpected ?? 0,
            wouldRecommend: selectedReview.wouldRecommend ?? 0,
            valueForMoney: selectedReview.valueForMoney ?? 0,
            imageUrl: selectedReview.imageUrl,
            patron: selectedReview.patron,
            userVote: selectedReview.userVote
          }}
          isOpen={isReviewModalOpen} 
          onClose={handleReviewModalClose} 
          onVoteUpdate={handleVoteUpdate} 
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
              <p className="ml-2 text-sm">© 2025 Chow You Doing? All rights reserved.</p>
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
