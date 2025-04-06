"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Filter, ThumbsUp, Sparkles, Clock, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import ReviewModal from '@/app/_components/ReviewModal';
import RequestMenuModal from "../_components/RequestMenuModal";

// Define SearchResult interface
interface SearchResult {
  id: string;
  name: string;
  type: string;
  url?: string;
  restaurant?: string;
}

// Define our types
interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string | null;
  profileImage: string | null;
  bio: string | null;
  interests: string[];
  _count?: {
    reviews: number;
    followers: number;
    following: number;
    favorites: number;
  };
}

interface Restaurant {
  id: string;
  name: string;
  title?: string; // Some APIs return title instead of name
  address: string;
  location?: string; // Some APIs return location instead of address
  category?: string[];
  interests?: string[];
  rating?: string;
  num_reviews?: string;
  latitude?: number | null;
  longitude?: number | null;
  _count?: {
    reviews: number;
  };
}

interface Review {
  id: string;
  title: string;
  date: string | undefined;
  upvotes: number;
  content: string;
  text?: string;
  rating: number;
  restaurant: string;
  restaurantId: string;
  author: string;
  asExpected: number;
  wouldRecommend: number;
  valueForMoney: number;
  imageUrl: string | undefined;
  videoUrl: string | null;
  patronId: string; 
  isAnonymous: boolean;
  patron?: {
    id: string;
    firstName: string;
    lastName: string;
  } | undefined;
  userVote?: {
    isUpvote: boolean;
  } | undefined;
}

interface Photo {
  id: string;
  imageUrl: string;
  reviewId: string;
  restaurantId: string;
  restaurantName: string;
  upvotes: number;
}

type TabType = "restaurants" | "reviews" | "photos";
type FilterType = "relevance" | "newest";

// Card background colors for restaurant cards
const CARD_COLORS = {
  card1: "#fdf9f5",
  card2: "#fdedf6",
  card3: "#fbe9fc",
  card4: "#f1eafe",
  accent: "#faf2e5"
};

// SearchResults component
const SearchResults: React.FC<{
  results: SearchResult[];
  isLoading: boolean;
  onSelect: (result: SearchResult) => void;
}> = ({ results, isLoading, onSelect }) => {
  if (isLoading) {
    return (
      <div className="absolute left-0 right-0 mt-2 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 z-40 overflow-hidden">
        <div className="p-4 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-[#dab9f8] rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-[#dab9f8] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 bg-[#dab9f8] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 mt-2 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg z-40 overflow-hidden">
      <div className="max-h-72 overflow-y-auto">
        {results.map((result) => (
          <div
            key={result.id}
            onClick={() => onSelect(result)}
            className="flex items-center px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-0 cursor-pointer"
          >
            <div className="flex-1">
              <p className="text-gray-800 font-medium">{result.name}</p>
              <div className="flex items-center justify-between mt-1">
                {result.restaurant && (
                  <p className="text-gray-500 text-sm">{result.restaurant}</p>
                )}
                <span className="ml-auto text-xs px-2 py-1 bg-yellow-100/50 text-yellow-700 rounded-full">
                  {result.type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DiscoveryPage(): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("restaurants");
  const [filter, setFilter] = useState<FilterType>("relevance");
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  
  // Search related states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add state for the review modal
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  //State for Request Menu
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Handle click outside of search container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchQuery("");
        setSearchResults([]);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle search query changes - fetch results
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&restaurants=true&meals=false&categories=false&locations=false`);
          if (!response.ok) throw new Error("Search failed");
          
          const data = await response.json();

          const sanitizedReviews = (data.reviews || []).map((review: Review) => {
            if (review.isAnonymous) {
              return {
                ...review,
                author: "Anonymous",
                patron: undefined
              };
            }
            return review;
          });
          
          setReviews(sanitizedReviews);
                    
          const formattedResults: SearchResult[] = [
            ...(data.results || []).map((result: any) => ({
              id: result.id,
              name: result.name,
              type: result.type,
              url: `/patron-search?id=${encodeURIComponent(result.id)}`,
              restaurant: result.restaurant
            })),
            {
              id: 'request-menu',
              name: 'Request a Menu',
              type: 'Action',
              url: '#request-menu',
              restaurant: undefined
            }
          ];
          
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

  // Fetch user profile to get interests
  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      if (status !== "authenticated") return;
      
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data");
      }
    };

    fetchProfile();
  }, [status]);

  // Fetch data based on active tab and filter
  useEffect(() => {
    if (status !== "authenticated") return;
    
    const fetchData = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (activeTab === "restaurants") {
          await fetchRestaurants();
        } else if (activeTab === "reviews") {
          await fetchReviews();
        } else if (activeTab === "photos") {
          await fetchPhotos();
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        setError(`Failed to load ${activeTab}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, filter, profile, status]);

  const fetchRestaurants = async (): Promise<void> => {
    // For restaurant discovery, we can use a modified endpoint or parameters
    const queryParams = new URLSearchParams();
    
    // Use a higher limit to get enough results
    queryParams.append("limit", "20");
    
    if (filter === "relevance" && profile?.interests && profile.interests.length > 0) {
      // Add user interests to query
      profile.interests.forEach(interest => {
        queryParams.append("interests", interest);
      });
    } else if (filter === "newest") {
      queryParams.append("sort", "newest");
    }
    
    // Set strictInterests to false to always get enough results
    queryParams.append("strictInterests", "false");
    
    const response = await fetch(`/api/restaurants/discover?${queryParams.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch restaurants");
    
    const data = await response.json();
    
    // Map the data to our Restaurant interface
    const formattedRestaurants: Restaurant[] = data.restaurants.map((r: any) => ({
      id: r.id,
      name: r.title || r.name,
      address: r.location || r.address || "Location not available",
      category: Array.isArray(r.category) ? r.category : [],
      interests: Array.isArray(r.interests) ? r.interests : [],
      rating: r.rating || "0",
      num_reviews: r.num_reviews || "0",
      latitude: r.latitude || null,
      longitude: r.longitude || null,
      _count: r._count || { reviews: 0 } // Make sure this is included
    }));
    
    setRestaurants(formattedRestaurants);
  };

  const fetchReviews = async (): Promise<void> => {
    // Fetch reviews based on filter type
    const queryParams = new URLSearchParams();
    
    // Set a higher limit to get enough results
    queryParams.append("limit", "20");
    
    if (filter === "relevance" && profile?.interests && profile.interests.length > 0) {
      // Add user interests to query if using relevance filter
      profile.interests.forEach(interest => {
        queryParams.append("interests", interest);
      });
    } else if (filter === "newest") {
      queryParams.append("orderBy", "createdAt");
      queryParams.append("orderDir", "desc");
    }
    
    // Set strictInterests to false to always get enough results
    queryParams.append("strictInterests", "false");

    const response = await fetch(`/api/review?${queryParams.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch reviews");
    
    const data = await response.json();
    
    // Process reviews to force anonymous handling
    const processedReviews = (data.reviews || []).map((review: any) => {
      // Convert to our Review type
      const newReview: Review = {
        ...review,
        isAnonymous: Boolean(review.isAnonymous), // Force to boolean
      };
      
      // If anonymous, remove patron data and set author to Anonymous
      if (newReview.isAnonymous) {
        newReview.author = "Anonymous";
        newReview.patron = undefined;
      }
      
      return newReview;
    });
    
    console.log("Processed reviews:", processedReviews);
    setReviews(processedReviews);
  };

  const fetchPhotos = async (): Promise<void> => {
    // Fetch reviews that have photos
    const queryParams = new URLSearchParams();
    queryParams.append("hasImage", "true");
    
    // Set a higher limit to get enough results
    queryParams.append("limit", "24");
    
    if (filter === "relevance" && profile?.interests && profile.interests.length > 0) {
      profile.interests.forEach(interest => {
        queryParams.append("interests", interest);
      });
    } else if (filter === "newest") {
      queryParams.append("orderBy", "createdAt");
      queryParams.append("orderDir", "desc");
    }
    
    // Set strictInterests to false to always get enough results
    queryParams.append("strictInterests", "false");
    
    const response = await fetch(`/api/review?${queryParams.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch photos");
    
    const data = await response.json();
    
    // Extract photos from reviews
    const extractedPhotos: Photo[] = data.reviews
      .filter((review: Review) => review.imageUrl) 
      .map((review: Review) => ({
        id: review.id,
        imageUrl: review.imageUrl || "",
        reviewId: review.id,
        restaurantId: review.restaurantId,
        restaurantName: review.restaurant,
        upvotes: review.upvotes
      }));
    
    setPhotos(extractedPhotos);
  };

  // Handle tab switching
  const handleTabChange = (tab: TabType): void => {
    setActiveTab(tab);
  };

  // Handle filter change
  const handleFilterChange = (newFilter: FilterType): void => {
    setFilter(newFilter);
    setShowFilterDropdown(false);
  };

  // Get card color based on index
  const getCardColor = (index: number): string => {
    const colors = [CARD_COLORS.card1, CARD_COLORS.card2, CARD_COLORS.card3, CARD_COLORS.card4];
    return colors[index % colors.length]!;
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/patron-search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = (result: SearchResult): void => {
    if (result.id === "request-menu") {
      const event = new CustomEvent("open-request-menu-modal");
      window.dispatchEvent(event);
      return;
    }
  
    router.push(`/patron-search?id=${encodeURIComponent(result.id)}`);
    setSearchQuery("");
    setSearchResults([]);
  };
  

  useEffect(() => {
    const openRequestModal = () => setIsRequestModalOpen(true);
    window.addEventListener("open-request-menu-modal", openRequestModal);
    return () => window.removeEventListener("open-request-menu-modal", openRequestModal);
  }, []);
  

  // Add handler to view a review
  const handleViewFullReview = (review: Review): void => {
    setSelectedReview(review);
    setIsReviewModalOpen(true);
  };

  // Add handler to close the review modal
  const handleCloseReviewModal = (): void => {
    setIsReviewModalOpen(false);
    setSelectedReview(null);
  };

  // Add handler for vote updates
  const handleVoteUpdate = (reviewId: string, newUpvotes: number, isUpvoted: boolean | null): void => {
    // Update reviews array with new vote count
    setReviews(prevReviews => 
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

    // Also update photos array if the reviewed photo was updated
    setPhotos(prevPhotos => 
      prevPhotos.map(photo => 
        photo.id === reviewId 
          ? { ...photo, upvotes: newUpvotes } 
          : photo
      )
    );

    // Update the selected review if it's the one being displayed
    if (selectedReview && selectedReview.id === reviewId) {
      setSelectedReview({
        ...selectedReview,
        upvotes: newUpvotes,
        userVote: isUpvoted !== null ? { isUpvote: isUpvoted } : undefined
      });
    }
  };

  // If not authenticated, show login prompt
  if (status === "unauthenticated") {
    return (
      <div className="with-navbar">
        <div className="page-content flex flex-col items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold text-[#dab9f8] mb-4">Sign In to Discover</h2>
            <p className="mb-6 text-gray-600">Please sign in to see personalized recommendations based on your interests.</p>
            <Link
              href="/login"
              className="px-6 py-3 bg-[#FFC1B5] text-white rounded-[100px] shadow-md hover:bg-[#FFB4A3] transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="with-navbar">
      <div className="page-content min-h-screen py-6 px-4 md:px-8">
        {/* Hero Section with Centered Title/Subtitle */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#000000] mb-4">Discover Extraordinary Dining</h1>
          <p className="text-gray-600 mx-auto max-w-2xl">
            Explore the most popular restaurants and read what food enthusiasts are raving about
          </p>
          
          {/* Search Bar with Dropdown */}
          <div className="mt-8 max-w-2xl mx-auto" ref={searchContainerRef}>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search by restaurant, cuisine, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
                className="w-full py-3 px-12 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#dab9f8] shadow-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                <Search size={18} className="text-gray-400" />
              </div>
              <button type="submit" className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <div className="w-8 h-8 flex items-center justify-center bg-[#dab9f8] rounded-full hover:bg-[#c9a6e7] transition-colors">
                  <Search size={14} className="text-white" />
                </div>
              </button>
              
              {/* Search Results Dropdown */}
              {(searchResults.length > 0 || isSearching) && (
                <SearchResults 
                  results={searchResults}
                  isLoading={isSearching}
                  onSelect={handleSearchResultSelect}
                />
              )}
            </form>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex border-b border-gray-200">
              <button
                className={`px-4 py-2 font-medium text-sm md:text-base ${
                  activeTab === "restaurants"
                    ? "text-[#dab9f8] border-b-2 border-[#dab9f8]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => handleTabChange("restaurants")}
              >
                Restaurants
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm md:text-base ${
                  activeTab === "reviews"
                    ? "text-[#f2d36e] border-b-2 border-[#f2d36e]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => handleTabChange("reviews")}
              >
                Reviews
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm md:text-base ${
                  activeTab === "photos"
                    ? "text-[#f5b7ee] border-b-2 border-[#f5b7ee]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => handleTabChange("photos")}
              >
                Photos
              </button>
            </div>
            
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md bg-white hover:bg-gray-50 transition-colors"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <Filter size={16} />
                <span>
                  {filter === "relevance" ? "Relevance" : "Newest"}
                </span>
              </button>
              
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 overflow-hidden">
                  <div className="py-1">
                    <button
                      className={`flex items-center w-full px-4 py-2 text-sm ${
                        filter === "relevance"
                          ? "bg-[#FFF0E7] text-gray-800"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                      onClick={() => handleFilterChange("relevance")}
                    >
                      <Sparkles size={16} className="mr-2" />
                      Relevance
                    </button>
                    <button
                      className={`flex items-center w-full px-4 py-2 text-sm ${
                        filter === "newest"
                          ? "bg-[#FFF0E7] text-gray-800"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                      onClick={() => handleFilterChange("newest")}
                    >
                      <Clock size={16} className="mr-2" />
                      Newest
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f9c3c9]"></div>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <p>{error}</p>
            </div>
          )}
          
          {/* Content based on active tab */}
          {!isLoading && !error && (
            <>
              {/* Restaurants Tab */}
              {activeTab === "restaurants" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {restaurants.length > 0 ? (
                    restaurants.map((restaurant, index) => (
                      <Link
                        href={`/patron-search?id=${restaurant.id}`}
                        key={restaurant.id}
                        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                      >
                        <div className="h-48 rounded-t-xl" style={{ backgroundColor: getCardColor(index) }}>
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            {restaurant.name.charAt(0)}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg hover:text-[#dab9f8]">{restaurant.name}</h3>
                          
                          {/* Restaurant location displayed on a separate line */}
                          <div className="flex items-start gap-1.5 text-sm text-gray-500 mt-1 mb-2">
                            <MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
                            <span className="line-clamp-1">{restaurant.address}</span>
                          </div>
                          
                          {/* Has Reviews indicator (replaces star rating) */}
                          <div className="flex items-center mt-3">
                            <span 
                              className={`inline-block rounded-full w-2 h-2 ${
                                (restaurant._count?.reviews || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                              } mr-2`}
                            ></span>
                            <span className="text-sm text-gray-600">
                              {(restaurant._count?.reviews || 0) > 0 ? 'Has Reviews' : 'No Reviews'}
                            </span>
                          </div>
                          
                          {/* Show interests instead of categories */}
                          {restaurant.interests && restaurant.interests.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {restaurant.interests.slice(0, 3).map((interest, i) => (
                                <span key={i} className="text-xs bg-[#faf2e5] text-[#a58a62] px-2 py-1 rounded-full">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-500">No restaurants found. Try a different filter.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div 
                        key={review.id} 
                        className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => handleViewFullReview(review)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <Link
                            href={`/patron-search?id=${review.restaurantId}`}
                            className="text-lg font-medium text-[#dab9f8] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {review.restaurant}
                          </Link>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <div 
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? "text-[#FFB400] fill-[#FFB400]"
                                    : "text-gray-300"
                                }`}
                              >★</div>
                            ))}
                          </div>
                        </div>
                        
                        {review.imageUrl && (
                          <div className="mb-4 h-48 w-full relative rounded-lg overflow-hidden">
                            <Image
                              src={review.imageUrl}
                              alt="Review image"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        
                        <p className="mb-4 text-gray-700">{review.content}</p>
                        
                        <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            <span className="font-medium">
                              {review.isAnonymous === true ? "Anonymous" : review.author}
                            </span>
                            {review.date && (
                              <span>
                                •{" "}
                                {new Date(review.date).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit"
                                })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <ThumbsUp size={14} className="mr-1" />
                            <span>{review.upvotes}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-500">No reviews found. Try a different filter.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Photos Tab */}
              {activeTab === "photos" && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.length > 0 ? (
                    photos.map((photo) => (
                      <div 
                        key={photo.id} 
                        className="group relative aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => {
                          // Find the full review data for this photo
                          const review = reviews.find(r => r.id === photo.id);
                          if (review) {
                            handleViewFullReview(review);
                          } else {
                            // If we don't have the full review data, construct a minimal review object
                            handleViewFullReview({
                              id: photo.id,
                              title: photo.restaurantName,
                              date: undefined,
                              upvotes: photo.upvotes,
                              content: "",
                              rating: 0,
                              restaurant: photo.restaurantName,
                              restaurantId: photo.restaurantId,
                              author: "",
                              asExpected: 0,
                              wouldRecommend: 0,
                              valueForMoney: 0,
                              imageUrl: photo.imageUrl,
                              videoUrl: null,
                              patronId: "",
                              isAnonymous: false
                            });
                          }
                        }}
                      >
                        <Image
                          src={photo.imageUrl}
                          alt={`Photo from ${photo.restaurantName}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <Link
                            href={`/patron-search?id=${photo.restaurantId}`}
                            className="text-white text-sm font-medium truncate hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {photo.restaurantName}
                          </Link>
                          <div className="flex items-center text-white text-xs mt-1">
                            <ThumbsUp size={12} className="mr-1" />
                            <span>{photo.upvotes}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-500">No photos found. Try a different filter.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedReview && (
        <ReviewModal 
          review={{
            id: selectedReview.id,
            content: selectedReview.content || selectedReview.text || "", 
            rating: typeof selectedReview.rating === 'number' ? selectedReview.rating : 5,
            date: selectedReview.date,
            upvotes: selectedReview.upvotes ?? 0,
            asExpected: selectedReview.asExpected ?? 0,
            wouldRecommend: selectedReview.wouldRecommend ?? 0,
            valueForMoney: selectedReview.valueForMoney ?? 0,
            imageUrl: selectedReview.imageUrl,
            patron: selectedReview.patron
              ? {
                  id: selectedReview.patron.id,
                  firstName: selectedReview.patron.firstName,
                  lastName: selectedReview.patron.lastName
                }
              : undefined,
            patronId: selectedReview.patronId ?? selectedReview.patron?.id,
            isAnonymous: selectedReview.isAnonymous ?? false, // Add this line
            userVote: selectedReview.userVote
          }}
          isOpen={isReviewModalOpen} 
          onClose={handleCloseReviewModal} 
          onVoteUpdate={handleVoteUpdate} 
        />
      )}


    {/* Request Menu Modal */}

    <RequestMenuModal 
      isOpen={isRequestModalOpen} 
      onClose={() => setIsRequestModalOpen(false)} 
    />



    </div>
  );
}