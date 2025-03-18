/*eslint-disable*/
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Navbar from "../_components/navbar";
import ReviewModal from '../_components/ReviewModal';
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
  id?: string;
}

interface Review {
  id: string;
  title?: string;
  content?: string;
  date?: string;
  upvotes?: number;
  rating?: number;
  text?: string;
  restaurant?: string;
  author?: string;
  latitude?: number | null;
  longitude?: number | null;
  asExpected?: number;
  wouldRecommend?: number;
  valueForMoney?: number;
  imageUrl?: string | null;
  videoUrl?: string | null;
  patron?: Patron;
  userVote?: {
    isUpvote: boolean;
  } | null;
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

// Define an enum for the different modal types for better type safety
enum ModalType {
  NONE,
  READ,
  EDIT,
  REQUEST
}

// Create a separate component for the search functionality
function SearchContent(): JSX.Element {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { data: session, status } = useSession();

  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [modalType, setModalType] = useState<ModalType>(ModalType.NONE);
  const [reviewUpdated, setReviewUpdated] = useState<boolean>(false);

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

  // Refresh restaurant data if a review was updated or deleted
  useEffect(() => {
    if (reviewUpdated && selectedRestaurant) {
      console.log("Refreshing restaurant data due to review update/delete");
      fetchRestaurantDetails(selectedRestaurant.id);
      setReviewUpdated(false);
    }
  }, [reviewUpdated]);

  async function fetchRestaurantDetails(restaurantId: string): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      // Add a cache-busting parameter to ensure we get fresh data
      const timestamp = Date.now();
      const res = await fetch(`/api/restaurants/${restaurantId}?t=${timestamp}`);
      if (!res.ok) throw new Error("Failed to fetch restaurant data");
      const data = await res.json();
      
      console.log("Restaurant data loaded:", data);
      
      // Create the restaurant object with the data
      const restaurant: Restaurant = {
        id: data.id,
        name: data.name,
        address: data.address,
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
        menuItems: Array.isArray(data.menuItems) ? data.menuItems : [],
      };
      
      console.log("Restaurant reviews:", restaurant.reviews);
      
      setSelectedRestaurant(restaurant);
    } catch (err) {
      console.error("Restaurant fetch error:", err);
      setError("Failed to load restaurant details");
    } finally {
      setLoading(false);
    }
  }

  const handleReviewClick = (review: Review): void => {
    console.log("Opening review:", review);
    
    // Set the selected review with the latest vote count
    setSelectedReview({ ...review });
    setModalType(ModalType.READ);
  };
  
  const handleEditReview = (review: Review, e: React.MouseEvent): void => {
    e.stopPropagation(); // Prevent the click from reaching the parent (which would open view modal)
    
    // Check if the current user owns the review
    if (status !== 'authenticated') {
      alert("You must be logged in to edit reviews.");
      return;
    }
    
    // We should check if the current user is the author of the review
    const currentUserId = (session?.user as any)?.id;
    const reviewUserId = review.patron?.id; // We might need to add this to the Review interface
    
    // For now, we'll assume we can't verify ownership perfectly, so we'll allow the edit
    // The backend API will handle the actual permission checking
    
    setSelectedReview({ ...review });
    setModalType(ModalType.EDIT);
  };

  const handleVoteUpdate = (reviewId: string, newUpvotes: number, isUpvoted: boolean | null): void => {
    console.log("Vote update received:", { reviewId, newUpvotes, isUpvoted });

    // Update selected restaurant's review list
    setSelectedRestaurant((prev) => {
        if (!prev) return prev; // If no restaurant is selected, do nothing

        const updatedReviews = prev.reviews.map(review => 
            review.id === reviewId 
                ? { 
                    ...review, 
                    upvotes: newUpvotes, 
                    userVote: isUpvoted !== null ? { isUpvote: isUpvoted } : undefined 
                } 
                : review
        );

        return { ...prev, reviews: updatedReviews };
    });

    // Ensure selected review is also updated in modal
    setSelectedReview((prev) => {
        if (!prev || prev.id !== reviewId) return prev;
        return { ...prev, upvotes: newUpvotes, userVote: isUpvoted !== null ? { isUpvote: isUpvoted } : undefined };
    });

    console.log(`Updated vote count in UI for review ${reviewId}:`, newUpvotes);
  };
  
  // This function needs to use the same Review type as the ReviewModal component
  const handleReviewUpdate = (updatedReview: any): void => {
    // We're using 'any' here to bypass TypeScript's check
    // In a real application, you should create a shared type file
    
    // Cast the updatedReview back to our local Review type
    const typedReview = updatedReview as Review;
    
    // Update in restaurant reviews
    if (selectedRestaurant) {
      setSelectedRestaurant(prev => {
        if (!prev) return prev;
        
        const updatedReviews = prev.reviews.map(review => 
          review.id === typedReview.id ? typedReview : review
        );
        
        return { ...prev, reviews: updatedReviews };
      });
    }
    
    setReviewUpdated(true);
  };

  // Add handler for review deletion
  const handleReviewDelete = (reviewId: string): void => {
    console.log(`Review ${reviewId} has been deleted`);
    
    // Remove the deleted review from the selected restaurant's reviews
    if (selectedRestaurant) {
      setSelectedRestaurant(prev => {
        if (!prev) return prev;
        
        const updatedReviews = prev.reviews.filter(review => review.id !== reviewId);
        
        return {
          ...prev,
          reviews: updatedReviews
        };
      });
    }
    
    // Close the modal since the review no longer exists
    setModalType(ModalType.NONE);
    setSelectedReview(null);
    
    // Flag that an update occurred to refresh data if needed
    setReviewUpdated(true);
  };

  const closeModal = (): void => {
    setModalType(ModalType.NONE);
    setSelectedReview(null);
  };

  const openRequestMenuModal = (): void => {
    setModalType(ModalType.REQUEST);
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

  // Determine if the current user is the author of a review
  const isReviewAuthor = (review: Review): boolean => {
    if (status !== 'authenticated') return false;
    
    const currentUserId = (session?.user as any)?.id;
    // Compare with the review author's ID if available
    if (review.patron?.id && currentUserId) {
      return review.patron.id === currentUserId;
    }
    
    // Fallback check if IDs aren't available
    if (review.patron && session?.user?.name) {
      return review.patron.firstName === session.user.name.split(' ')[0];
    }
    
    return false;
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
                    className="p-4 bg-white shadow-md rounded-md cursor-pointer hover:shadow-lg transition-shadow relative"
                    onClick={() => handleReviewClick(review)}
                  >
                    <div className="flex justify-between items-start">
                      <div>{renderStars(review.rating || 5)}</div>
                      <div className="flex items-center">
                        {/* The arrow color changes based on whether the user has upvoted */}
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 mr-1 ${review.userVote?.isUpvote ? 'text-green-500' : 'text-gray-500'}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <span className="font-semibold">{review.upvotes || 0}</span>
                      </div>
                    </div>
                    <p className="text-sm italic my-2 line-clamp-3">"{review.content || ''}"</p>
                    <p className="text-right mt-2 text-[#A90D3C]">- {review.patron?.firstName || "Anonymous"}</p>
                    
                    {/* Add edit button for reviews by the current user */}
                    {isReviewAuthor(review) && (
                      <button
                        className="absolute top-2 right-2 p-1 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                        onClick={(e) => handleEditReview(review, e)}
                        title="Edit Review"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                    
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

        {/* Read Review Modal */}
        {selectedReview && modalType === ModalType.READ && (
          <ReviewModal 
            review={selectedReview as any} 
            isOpen={true} 
            onClose={closeModal} 
            onVoteUpdate={handleVoteUpdate} 
          />
        )}

        {/* Edit Review Modal */}
        {selectedReview && modalType === ModalType.EDIT && (
          <ReviewModal 
            review={selectedReview as any} 
            isOpen={true} 
            onClose={closeModal} 
            onReviewUpdate={handleReviewUpdate as any}
            onReviewDelete={handleReviewDelete}
          />
        )}

        {/* Request Menu Modal */}
        {modalType === ModalType.REQUEST && (
          <RequestMenuModal 
            isOpen={true}
            onClose={closeModal}
          />
        )}
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