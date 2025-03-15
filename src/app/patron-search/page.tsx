/*eslint-disable*/
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Navbar from "../_components/navbar";
import ReviewModal from '@/app/_components/ReviewModal';
import RequestMenuModal from "@/app/_components/RequestMenuModal";

// Define types
interface SearchResult {
  id: string;
  name: string;
  type: "Restaurant" | "Food Item" | "Category" | "Location";
  url: string;
  restaurant?: string;
}

interface Patron {
  firstName: string;
  lastName: string;
}

interface Review {
  id: string;
  content: string;
  rating: number;
  imageUrl?: string;
  upvotes: number;
  patron?: Patron;
  reviewStandards?: string;
  date?: string;
  asExpected?: number;
  wouldRecommend?: number;
  valueForMoney?: number;
  userVote?: {
    isUpvote: boolean;
  };
}

interface MenuItem {
  name: string;
  description: string;
  price: string;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  reviews: Review[];
  menuItems: MenuItem[];
}

// Create a separate component for the search functionality
function SearchContent(): JSX.Element {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [reviewUpdated, setReviewUpdated] = useState<boolean>(false);
  const [isRequestMenuModalOpen, setIsRequestMenuModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    
    async function fetchResults(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${query}&restaurants=true&meals=false&categories=false&locations=false`);
        if (!res.ok) throw new Error("Failed to fetch search results");
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to load search results");
      } finally {
        setLoading(false);
      }
    }
    
    fetchResults();
  }, [query]);

  // Refresh restaurant data if a review was updated
  useEffect(() => {
    if (reviewUpdated && selectedRestaurant) {
      console.log("Refreshing restaurant data due to review update");
      fetchRestaurantDetails(selectedRestaurant.id);
      setReviewUpdated(false);
    }
  }, [reviewUpdated]);

  async function fetchRestaurantDetails(restaurantId: string): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      // Add cache-busting to ensure fresh data
      const timestamp = Date.now();
      const res = await fetch(`/api/restaurants/${restaurantId}?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!res.ok) throw new Error("Failed to fetch restaurant data");
      const data = await res.json();
      
      console.log("Restaurant data loaded:", data);
      
      // Print every review's upvote value for debugging
      if (Array.isArray(data.reviews)) {
        data.reviews.forEach((review: any, index: number) => {
          console.log(`DEBUG: Review ${index} upvotes:`, review.upvotes, "type:", typeof review.upvotes);
        });
      }
      
      // Create the restaurant object with the data
      const restaurant: Restaurant = {
        id: data.id,
        name: data.name,
        address: data.address,
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
        menuItems: Array.isArray(data.menuItems) ? data.menuItems : [],
      };
      
      setSelectedRestaurant(restaurant);
    } catch (err) {
      console.error("Restaurant fetch error:", err);
      setError("Failed to load restaurant details");
    } finally {
      setLoading(false);
    }
  }

  const handleReviewClick = (review: Review): void => {
    console.log("Opening review with upvotes:", review.upvotes, "type:", typeof review.upvotes);
    
    // Set the selected review
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  // Optimistic UI update approach
  const handleVoteUpdate = (reviewId: string, newUpvotes: number, isUpvoted: boolean | null): void => {
    console.log("Vote update received:", { reviewId, newUpvotes, isUpvoted });

    // Immediately update the UI state with the new vote count
    setSelectedRestaurant(prevState => {
      if (!prevState) return null;
      
      // Update the upvotes in the reviews array
      const updatedReviews = prevState.reviews.map(review => {
        if (review.id === reviewId) {
          console.log(`Updating review ${reviewId} upvotes from ${review.upvotes} to ${newUpvotes}`);
          return {
            ...review,
            upvotes: newUpvotes,
            userVote: isUpvoted !== null ? { isUpvote: isUpvoted } : undefined
          };
        }
        return review;
      });
      
      return {
        ...prevState,
        reviews: updatedReviews
      };
    });
    
    // Also update the selected review if it's open in the modal
    if (selectedReview && selectedReview.id === reviewId) {
      console.log(`Updating modal review ${reviewId} upvotes to ${newUpvotes}`);
      setSelectedReview({
        ...selectedReview,
        upvotes: newUpvotes,
        userVote: isUpvoted !== null ? { isUpvote: isUpvoted } : undefined
      });
    }
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setSelectedReview(null);
    // Flag that we need to refresh the data when modal closes
    setReviewUpdated(true);
  };

  const openRequestMenuModal = (): void => {
    setIsRequestMenuModalOpen(true);
  };

  const closeRequestMenuModal = (): void => {
    setIsRequestMenuModalOpen(false);
  };

  const renderStars = (rating: number): JSX.Element => {
    const stars: JSX.Element[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`${i <= rating ? "text-yellow-400" : "text-gray-300"}`}>
          ★
        </span>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  return (
    <div className="page-content">
      <main className="bg-[#FFF5E1] min-h-screen text-[#5A5A5A] px-8 w-full">
        {/* Search Bar */}
        <div className="flex justify-center pt-6">
          <input
            type="text"
            placeholder="Search restaurants..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A90D3C]"
          />
        </div>
        
        {loading && (
          <div className="flex justify-center mt-4">
            <p>Loading...</p>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center mt-4 text-[#A90D3C]">
            <p>{error}</p>
          </div>
        )}
        
        {/* Results Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Search Results</h2>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {results.map((restaurant) => (
                <div key={restaurant.id} className="p-4 bg-white shadow-md rounded-md">
                  <h3 className="font-semibold text-[#D29501]">{restaurant.name}</h3>
                  {restaurant.restaurant && (
                    <p className="text-sm text-gray-600">{restaurant.restaurant}</p>
                  )}
                  <button
                    onClick={() => fetchRestaurantDetails(restaurant.id)}
                    className="mt-2 px-4 py-2 bg-[#A90D3C] text-white rounded-lg"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-lg">No results found.</p>
          )}
          
          {/* Request a Menu Call to Action */}
          <div className="mt-8 text-center">
            <p className="text-lg mb-2">Can't find what you're looking for?</p>
            <button
              onClick={openRequestMenuModal}
              className="py-2 px-6 bg-[#D29501] text-white rounded-lg hover:bg-[#B27C01] transition-colors"
            >
              Request a Menu Here
            </button>
          </div>
        </section>

        {/* Selected Restaurant Details */}
        {selectedRestaurant && (
          <section className="mt-8 pb-10">
            <h1 className="text-4xl font-bold text-center text-[#D29501]">{selectedRestaurant.name}</h1>
            <p className="text-center text-sm text-[#A90D3C]">{selectedRestaurant.address}</p>
            
            {/* Reviews Section */}
            <h2 className="text-2xl font-semibold mt-6">Reviews</h2>
            {selectedRestaurant.reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {selectedRestaurant.reviews.map((review) => (
                  <div 
                    key={review.id} 
                    className="p-4 bg-white shadow-md rounded-md cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleReviewClick(review)}
                  >
                    <div className="flex justify-between items-start">
                      <div>{renderStars(review.rating)}</div>
                      <div className="flex items-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 mr-1 ${review.userVote?.isUpvote ? 'text-green-500' : 'text-gray-500'}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        {/* DEBUG: Render upvotes value and type */}
                        <span className="font-semibold">
                          {/* Use the simple approach that works on dashboard */}
                          {review.upvotes || 0}
                        </span>
                        {/* For debugging */}
                        {/* <span className="text-xs ml-1">({typeof review.upvotes})</span> */}
                      </div>
                    </div>
                    <p className="text-sm italic my-2 line-clamp-3">"{review.content}"</p>
                    <p className="text-right mt-2 text-[#A90D3C]">- {review.patron?.firstName || "Anonymous"}</p>
                    {review.imageUrl && (
                      <div className="mt-2 h-16 w-16 relative float-right">
                        <Image
                          src={review.imageUrl}
                          alt="Review image"
                          className="rounded object-cover"
                          fill
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4">No reviews available.</p>
            )}

            {/* Menu Section */}
            <h2 className="text-2xl font-semibold mt-6">Menu</h2>
            {selectedRestaurant.menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {selectedRestaurant.menuItems.map((item, index) => (
                  <div key={index} className="p-4 bg-white shadow-md rounded-md">
                    <h3 className="font-semibold text-[#D29501]">{item.name}</h3>
                    <p className="text-sm">{item.description}</p>
                    <p className="text-lg font-bold text-[#A90D3C] mt-2">{item.price}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4">No menu items available.</p>
            )}
          </section>
        )}

        {/* Review Modal - Use optimistic UI update approach */}
        {selectedReview && (
          <ReviewModal 
            review={selectedReview} 
            isOpen={isModalOpen} 
            onClose={closeModal} 
            onVoteUpdate={handleVoteUpdate} 
          />
        )}

        {/* Request Menu Modal */}
        <RequestMenuModal 
          isOpen={isRequestMenuModalOpen}
          onClose={closeRequestMenuModal}
        />
      </main>
    </div>
  );
}

// Loading fallback component
function SearchFallback(): JSX.Element {
  return (
    <div className="page-content">
      <main className="bg-[#FFF5E1] min-h-screen text-[#5A5A5A] px-8 w-full">
        <div className="flex justify-center pt-6">
          <div className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
            Loading search...
          </div>
        </div>
      </main>
    </div>
  );
}

// Main page component
export default function PatronSearchPage(): JSX.Element {
  return (
    <div className="with-navbar">
      <Navbar />
      <Suspense fallback={<SearchFallback />}>
        <SearchContent />
      </Suspense>
    </div>
  );
}