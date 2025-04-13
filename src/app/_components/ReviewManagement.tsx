/*eslint-disable*/
"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFileAlt,
  faExclamationTriangle,
  faCheckCircle,
  faClock,
  faFilter,
  faStar,
  faComment,
  faSpinner,
  faFlag
} from "@fortawesome/free-solid-svg-icons";
import ReviewResponseModal from "./ReviewResponseModal";
import FlagReviewModal from "./FlagReviewModal";

interface Restaurant {
  id: string;
  title: string;
}

interface Patron {
  id: string;
  firstName: string;
  lastName: string;
}

interface Review {
  id: string;
  content: string;
  rating: number;
  upvotes: number;
  createdAt: string;
  restaurantId: string;
  restaurantTitle: string;
  restaurantResponse: string | null;
  patron: Patron | null;
  isAnonymous: boolean;
}

interface ReviewFilter {
  restaurantId: string;
  responseStatus: string;
  sortBy: string;
}

interface ReviewManagementProps {
  restaurateurId: string;
  restaurants: Restaurant[];
  onStatsUpdate?: (stats: { totalReviews: number; pendingResponses: number; averageRating: number }) => void;
}

export default function ReviewManagement({ 
  restaurateurId, 
  restaurants,
  onStatsUpdate
}: ReviewManagementProps): JSX.Element {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<ReviewFilter>({
    restaurantId: "",
    responseStatus: "all",
    sortBy: "newest"
  });
  
  // Review response modal state
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState<boolean>(false);
  const [responseSubmitting, setResponseSubmitting] = useState<boolean>(false);

  // Flag review modal state
  const [selectedFlagReview, setSelectedFlagReview] = useState<Review | null>(null);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState<boolean>(false);

  // Statistics
  const [stats, setStats] = useState({
    totalReviews: 0,
    pendingResponses: 0,
    averageRating: 0
  });

  // Apply filters whenever reviews or filters change
  useEffect(() => {
    applyFilters();
  }, [reviews, filters]);

  // Calculate statistics when reviews change
  useEffect(() => {
    calculateStats();
  }, [reviews]);

// In ReviewManagement.tsx, modify the fetchReviews useEffect
const fetchReviews = useCallback(async (): Promise<void> => {
  if (!restaurants || restaurants.length === 0) {
    console.warn("No restaurants provided to ReviewManagement component");
    setReviews([]);
    setIsLoading(false);
    return;
  }
  
  console.log("Fetching reviews for restaurants:", restaurants.map(r => r.id).join(', '));
  setIsLoading(true);
  setError(null);
  
  try {
    // Create URL with multiple restaurantId parameters
    const params = new URLSearchParams();
    restaurants.forEach(restaurant => {
      params.append("restaurantId", restaurant.id);
    });
    
    const response = await fetch(`/api/restaurateur/reviews?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch reviews: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Reviews data:", data);
    
    if (data && data.reviews && Array.isArray(data.reviews)) {
      setReviews(data.reviews);
    } else {
      setReviews([]);
    }
  } catch (err) {
    console.error("Error fetching reviews:", err);
    setError(err instanceof Error ? err.message : "An unknown error occurred");
    setReviews([]);
  } finally {
    setIsLoading(false);
  }
}, [restaurants]); // Include restaurants in dependencies

// Replace the existing useEffect with this one
useEffect(() => {
  // Only fetch when the component mounts or restaurantIds change
  if (restaurants && restaurants.length > 0) {
    fetchReviews();
  }
}, [fetchReviews]); // Only depend on the memoized fetchReviews function


  const calculateStats = (): void => {
    // Check reviews is an array before using array methods
    if (!Array.isArray(reviews)) {
      setStats({
        totalReviews: 0,
        pendingResponses: 0,
        averageRating: 0
      });
      
      if (onStatsUpdate) {
        onStatsUpdate({
          totalReviews: 0,
          pendingResponses: 0,
          averageRating: 0
        });
      }
      return;
    }
    
    const totalReviews = reviews.length;
    const pendingResponses = reviews.filter(review => !review.restaurantResponse).length;
    
    // Calculate average rating
    let averageRating = 0;
    if (totalReviews > 0) {
      const sum = reviews.reduce((total, review) => {
        // Make sure rating is a number
        const rating = typeof review.rating === 'number' ? review.rating : 0;
        return total + rating;
      }, 0);
      averageRating = Math.round((sum / totalReviews) * 10) / 10;
    }
    
    const newStats = {
      totalReviews,
      pendingResponses,
      averageRating
    };
    
    setStats(newStats);
    
    // Send stats back to parent component if callback is provided
    if (onStatsUpdate) {
      onStatsUpdate(newStats);
    }
  };

  const applyFilters = (): void => {
    if (!Array.isArray(reviews)) {
      setFilteredReviews([]);
      return;
    }

    let filtered = [...reviews];
    
    // Filter by restaurant
    if (filters.restaurantId) {
      filtered = filtered.filter(review => review.restaurantId === filters.restaurantId);
    }
    
    // Filter by response status
    if (filters.responseStatus === "responded") {
      filtered = filtered.filter(review => review.restaurantResponse !== null);
    } else if (filters.responseStatus === "pending") {
      filtered = filtered.filter(review => review.restaurantResponse === null);
    }
    
    // Sort reviews
    if (filters.sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filters.sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (filters.sortBy === "highest-rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === "lowest-rating") {
      filtered.sort((a, b) => a.rating - b.rating);
    }
    
    setFilteredReviews(filtered);
  };

  const handleFilterChange = (field: keyof ReviewFilter, value: string): void => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpenResponseModal = (review: Review): void => {
    setSelectedReview(review);
    setIsResponseModalOpen(true);
  };

  const handleCloseResponseModal = (): void => {
    setIsResponseModalOpen(false);
    setSelectedReview(null);
  };

  const handleResponseSubmit = async (reviewId: string, response: string): Promise<void> => {
    setResponseSubmitting(true);
    
    try {
      const res = await fetch("/api/restaurateur/reviews/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reviewId,
          response
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit response");
      }
      
      // Update local state
      setReviews(prevReviews => {
        if (!Array.isArray(prevReviews)) return [];
        return prevReviews.map(review => 
          review.id === reviewId 
            ? { ...review, restaurantResponse: response } 
            : review
        );
      });
      
    } catch (err) {
      console.error("Error submitting response:", err);
      throw err;
    } finally {
      setResponseSubmitting(false);
    }
  };

  const handleOpenFlagModal = (review: Review): void => {
    setSelectedFlagReview(review);
    setIsFlagModalOpen(true);
  };

  const handleCloseFlagModal = (): void => {
    setIsFlagModalOpen(false);
    setSelectedFlagReview(null);
  };

  const handleFlagSuccess = (): void => {
    console.log("Review flagged successfully");
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get card colors based on index
  const getCardColor = (index: number): string => {
    const colors = ["#fdf9f5", "#fdedf6", "#fbe9fc", "#f1eafe"];
    return colors[index % colors.length] ?? "#ffffff";
  };

  // Render star ratings
  const renderStars = (rating: number): JSX.Element => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className={`${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            <FontAwesomeIcon icon={faStar} />
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Filter Controls */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="restaurantFilter" className="block text-sm text-gray-600 mb-1">
              Restaurant
            </label>
            <select
              id="restaurantFilter"
              value={filters.restaurantId}
              onChange={(e) => handleFilterChange("restaurantId", e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
            >
              <option value="">All Restaurants</option>
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.title}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="responseFilter" className="block text-sm text-gray-600 mb-1">
              Response Status
            </label>
            <select
              id="responseFilter"
              value={filters.responseStatus}
              onChange={(e) => handleFilterChange("responseStatus", e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
            >
              <option value="all">All Reviews</option>
              <option value="responded">Responded</option>
              <option value="pending">Pending Response</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sortFilter" className="block text-sm text-gray-600 mb-1">
              Sort By
            </label>
            <select
              id="sortFilter"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest-rating">Highest Rating</option>
              <option value="lowest-rating">Lowest Rating</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#faf2e5] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm">Total Reviews</h3>
              <p className="text-2xl font-bold">{stats.totalReviews}</p>
            </div>
            <div className="bg-[#f2d36e] p-3 rounded-full">
              <FontAwesomeIcon icon={faFileAlt} className="text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-[#fdedf6] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm">Pending Responses</h3>
              <p className="text-2xl font-bold">{stats.pendingResponses}</p>
            </div>
            <div className="bg-[#f9c3c9] p-3 rounded-full">
              <FontAwesomeIcon icon={faClock} className="text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-[#f1eafe] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm">Average Rating</h3>
              <p className="text-2xl font-bold">{stats.averageRating}</p>
            </div>
            <div className="bg-[#dab9f8] p-3 rounded-full">
              <FontAwesomeIcon icon={faStar} className="text-white" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
          <p>There was an error loading reviews: {error}</p>
          <button 
            onClick={fetchReviews}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((review, index) => (
            <div
              key={review.id}
              className="rounded-xl shadow-sm p-5 transition-all hover:shadow-md"
              style={{ backgroundColor: getCardColor(index) }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{review.restaurantTitle}</h3>
                  <div className="flex items-center mt-1">
                    {renderStars(review.rating)}
                    <span className="ml-2 text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium">
                    By: {review.isAnonymous ? "Anonymous User" : `${review.patron?.firstName} ${review.patron?.lastName}`}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <div className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    review.restaurantResponse 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {review.restaurantResponse ? "Responded" : "Needs Response"}
                  </div>
                  <button
                    className="p-2 text-gray-600 hover:text-red-500"
                    title="Flag review"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenFlagModal(review);
                    }}
                  >
                    <FontAwesomeIcon icon={faFlag} />
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
                  <div className="flex justify-end mt-2">
                    <button
                      className="text-blue-600 hover:text-blue-800 text-xs"
                      onClick={() => handleOpenResponseModal(review)}
                    >
                      Edit Response
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-[#dab9f8] text-white rounded-lg hover:bg-[#c9a2f2] transition-colors"
                    onClick={() => handleOpenResponseModal(review)}
                  >
                    <FontAwesomeIcon icon={faComment} />
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
          <h3 className="text-xl font-medium text-gray-700 mb-2">No reviews found</h3>
          <p className="text-gray-500 mb-6">
            {reviews && Array.isArray(reviews) && reviews.length > 0 
              ? "No reviews match your current filters." 
              : "Once your restaurants receive reviews, they will appear here."}
          </p>
          {reviews && Array.isArray(reviews) && reviews.length > 0 && (
            <button
              onClick={() => setFilters({ restaurantId: "", responseStatus: "all", sortBy: "newest" })}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
      
    {/* Review Response Modal */}
    {selectedReview && (
        <ReviewResponseModal
          isOpen={isResponseModalOpen}
          onClose={handleCloseResponseModal}
          review={selectedReview}
          onResponseSubmit={handleResponseSubmit}
        />
      )}
      
      {/* Flag Review Modal */}
      {selectedFlagReview && (
        <FlagReviewModal
          isOpen={isFlagModalOpen}
          onClose={handleCloseFlagModal}
          review={selectedFlagReview}
          onSuccess={handleFlagSuccess}
        />
      )}
    </div>
  );
}