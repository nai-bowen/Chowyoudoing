/*eslint-disable*/
"use client";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faHeart as faSolidHeart, faUtensils } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../_components/navbar";
import ReviewModal from '@/app/_components/ReviewModal';
import RequestMenuModal from "@/app/_components/RequestMenuModal";
import AnimatedBackground from "../_components/AnimatedBackground";
import EnhancedReviewModal from '@/app/_components/EnhancedReviewModal';

// Define types
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
  id?: string;
  name: string;
  description: string;
  price: string;
  img_url?: string;
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
  REQUEST,
  WRITE
}

// Create a separate component for the restaurant details
function RestaurantContent(): JSX.Element {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("id");
  const { data: session, status } = useSession();
  
  // If no restaurant ID is found, we'll show a search interface instead
  const [showSearch, setShowSearch] = useState<boolean>(!restaurantId);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Array<{id: string; name: string; location?: string}>>([]);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [modalType, setModalType] = useState<ModalType>(ModalType.NONE);
  const [reviewUpdated, setReviewUpdated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"menu" | "photos" | "reviews">("menu");
  const [menuPhotos, setMenuPhotos] = useState<string[]>([]);
  
  // Carousel state
  const [carouselStart, setCarouselStart] = useState<number>(0);
  const itemsPerPage = 3; // Number of menu items to show at once

  const [favourites, setfavourites] = useState<Record<string, boolean>>({});
  const [isSubmittingFav, setIsSubmittingFav] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "authenticated") {
      fetchfavourites();
    }
  }, [status]);
  const fetchfavourites = async (): Promise<void> => {
    if (status !== "authenticated") return;
    
    try {
      const response = await fetch("/api/profile/favourites");
      if (!response.ok) throw new Error("Failed to fetch favourites");
      
      const data = await response.json();
      const favMap: Record<string, boolean> = {};
      
      // Create a map of restaurant IDs for O(1) lookup
      data.favourites.forEach((fav: any) => {
        if (fav.restaurant) {
          favMap[fav.restaurant.id] = true;
        }
      });
      
      setfavourites(favMap);
    } catch (error) {
      console.error("Error fetching favourites:", error);
    }
  };

  const toggleFavorite = async (restaurantId: string, e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.stopPropagation(); // Prevent clicking the card underneath
    e.preventDefault(); // Prevent navigation
    
    if (status !== "authenticated") {
      alert("You must be logged in to favorite restaurants.");
      return;
    }   // Optimistic UI update
    setIsSubmittingFav(prev => ({ ...prev, [restaurantId]: true }));
    
    const isFavorite = favourites[restaurantId];
    
    try {
      if (isFavorite) {
        // Remove from favourites
        const response = await fetch(`/api/profile/favourites?restaurantId=${restaurantId}`, {
          method: "DELETE",
        });
        
        if (!response.ok) throw new Error("Failed to remove from favourites");
        
        setfavourites(prev => {
          const updated = { ...prev };
          delete updated[restaurantId];
          return updated;
        });
      } else {
        // Add to favourites
        const response = await fetch("/api/profile/favourites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ restaurantId }),
        });
        
        if (!response.ok) throw new Error("Failed to add to favourites");
        
        setfavourites(prev => ({
          ...prev,
          [restaurantId]: true,
        }));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert the optimistic update if there's an error
      await fetchfavourites();
    } finally {
      setIsSubmittingFav(prev => ({ ...prev, [restaurantId]: false }));
    }
  };


  // Handle search query for finding restaurants
  useEffect(() => {
    if (!showSearch || !searchQuery || searchQuery.length < 2) return;
    
    const searchRestaurants = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/search?q=${searchQuery}&restaurants=true&meals=false&categories=false&locations=false`);
        if (!res.ok) throw new Error("Failed to fetch search results");
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error("Search error:", err);
      }
    };
    
    const timeoutId = setTimeout(() => {
      searchRestaurants();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [showSearch, searchQuery]);

  // Fetch restaurant details when ID is available
  useEffect(() => {
    if (!restaurantId && !showSearch) {
      setLoading(false);
      return;
    }
    
    if (showSearch) return;
    
    const fetchRestaurantDetails = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const timestamp = Date.now();
        const res = await fetch(`/api/restaurants/${restaurantId}?t=${timestamp}`);
        if (!res.ok) throw new Error("Failed to fetch restaurant data");
        const data = await res.json();
        
        // Create the restaurant object with the data
        const restaurantData: Restaurant = {
          id: data.id,
          name: data.name || data.title || "Restaurant",
          address: data.address || data.location || "No address available",
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
          menuItems: Array.isArray(data.menuItems) ? data.menuItems : [],
        };
        
        setRestaurant(restaurantData);
        setMenuPhotos(extractPhotos(restaurantData));
      } catch (err) {
        console.error("Restaurant fetch error:", err);
        setError("Failed to load restaurant details");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, [restaurantId, showSearch]);

  // Refresh restaurant data if a review was updated
  useEffect(() => {
    if (reviewUpdated && restaurant) {
      console.log("Refreshing restaurant data due to review update");
      const fetchUpdatedData = async (): Promise<void> => {
        setLoading(true);
        try {
          const timestamp = Date.now();
          const res = await fetch(`/api/restaurants/${restaurant.id}?t=${timestamp}`);
          if (!res.ok) throw new Error("Failed to fetch restaurant data");
          const data = await res.json();
          
          const restaurantData: Restaurant = {
            id: data.id,
            name: data.name || data.title || "Restaurant",
            address: data.address || data.location || "No address available",
            reviews: Array.isArray(data.reviews) ? data.reviews : [],
            menuItems: Array.isArray(data.menuItems) ? data.menuItems : [],
          };
          
          setRestaurant(restaurantData);
          setMenuPhotos(extractPhotos(restaurantData));
        } catch (err) {
          console.error("Restaurant update error:", err);
        } finally {
          setLoading(false);
          setReviewUpdated(false);
        }
      };
      
      fetchUpdatedData();
    }
  }, [reviewUpdated, restaurant]);

  // Extract photos from menu items and reviews
  const extractPhotos = (restaurant: Restaurant): string[] => {
    const photos: string[] = [];
    
    // Get photos from menu items if available
    if (restaurant.menuItems) {
      restaurant.menuItems.forEach(item => {
        if (item.img_url) {
          photos.push(item.img_url);
        }
      });
    }
    
    // Get photos from reviews
    if (restaurant.reviews) {
      restaurant.reviews.forEach(review => {
        if (review.imageUrl) {
          photos.push(review.imageUrl);
        }
      });
    }
    
    return photos;
  };

  const handleReviewClick = (review: Review): void => {
    console.log("Opening review:", review);
    setSelectedReview({ ...review });
    setModalType(ModalType.READ);
  };
  
  const handleEditReview = (review: Review, e: React.MouseEvent): void => {
    e.stopPropagation();
    
    // Check if the current user owns the review
    if (status !== 'authenticated') {
      alert("You must be logged in to edit reviews.");
      return;
    }
    
    // Check if the current user is the author of the review
    const currentUserId = (session?.user as any)?.id;
    const reviewUserId = review.patron?.id;
    
    if (reviewUserId && currentUserId && reviewUserId !== currentUserId) {
      alert("You can only edit your own reviews.");
      return;
    }
    
    setSelectedReview({ ...review });
    setModalType(ModalType.EDIT);
  };

  const handleVoteUpdate = (reviewId: string, newUpvotes: number, isUpvoted: boolean | null): void => {
    console.log("Vote update received:", { reviewId, newUpvotes, isUpvoted });

    // Update restaurant's review list
    setRestaurant((prev) => {
      if (!prev) return prev;

      const updatedReviews = prev.reviews.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              upvotes: newUpvotes, 
              userVote: isUpvoted !== null ? { isUpvote: isUpvoted } : null
            } 
          : review
      );

      return { ...prev, reviews: updatedReviews };
    });

    // Ensure selected review is also updated in modal
    setSelectedReview((prev) => {
      if (!prev || prev.id !== reviewId) return prev;
      return { 
        ...prev, 
        upvotes: newUpvotes, 
        userVote: isUpvoted !== null ? { isUpvote: isUpvoted } : null
      };
    });
  };
  
  // This function handles review updates
  const handleReviewUpdate = (updatedReview: Review): void => {
    // Update in restaurant reviews
    if (restaurant) {
      setRestaurant(prev => {
        if (!prev) return prev;
        
        const updatedReviews = prev.reviews.map(review => 
          review.id === updatedReview.id ? updatedReview : review
        );
        
        return { ...prev, reviews: updatedReviews };
      });
    }
    
    setReviewUpdated(true);
    closeModal();
  };
  
  // Handle opening the write review modal
  const handleOpenWriteReviewModal = (): void => {
    if (!restaurant) return;
    
    setModalType(ModalType.WRITE);
  };

  // Handle review deletion
  const handleReviewDelete = (reviewId: string): void => {
    console.log(`Review ${reviewId} has been deleted`);
    
    // Remove the deleted review from the restaurant's reviews
    if (restaurant) {
      setRestaurant(prev => {
        if (!prev) return prev;
        
        const updatedReviews = prev.reviews.filter(review => review.id !== reviewId);
        
        return {
          ...prev,
          reviews: updatedReviews
        };
      });
    }
    
    // Close the modal since the review no longer exists
    closeModal();
    
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
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`${star <= rating ? "text-[#f2d36e]" : "text-gray-300"}`}>
            ★
          </span>
        ))}
      </div>
    );
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

 
  // Carousel navigation functions
  const nextMenuItems = (): void => {
    if (!restaurant) return;
    
    const maxStart = Math.max(0, restaurant.menuItems.length - itemsPerPage);
    setCarouselStart(prev => Math.min(prev + 1, maxStart));
  };
  
  const prevMenuItems = (): void => {
    setCarouselStart(prev => Math.max(0, prev - 1));
  };
  
  const canGoNext = (): boolean => {
    if (!restaurant) return false;
    return carouselStart < restaurant.menuItems.length - itemsPerPage;
  };
  
  const canGoPrev = (): boolean => {
    return carouselStart > 0;
  };

  // Render search interface if no restaurant ID is provided
  if (showSearch) {
    return (
      <div className="bg-white min-h-screen relative">
        {/* Blob decorations */}
        <div className="fixed top-0 right-0 w-64 h-64 bg-[#FFD879]/20 rounded-full blur-3xl"></div>
        <div className="fixed bottom-20 left-10 w-80 h-80 bg-[#f9c3c9]/10 rounded-full blur-3xl"></div>
        
        <div className="bg-[#f9ebc3] py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-black mb-6 text-left pl-4">Find a Restaurant</h1>
            
            <div className="max-w-md mx-auto relative">
              <input
                type="text"
                placeholder="Search for restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {searchQuery.length > 0 && searchResults.length === 0 && (
              <p className="text-center mt-6 text-gray-500">No restaurants found matching "{searchQuery}"</p>
            )}
          </div>
        </div>
        
        {/* Search Results */}
        <div className="container mx-auto px-4 py-8">
          {searchQuery.length > 0 && searchResults.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold text-black mb-6 text-left pl-4">Search Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {searchResults.map((result) => (
                  <div key={result.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300">
                    <h3 className="font-semibold text-lg text-black mb-2">{result.name}</h3>
                    {result.location && (
                      <p className="text-gray-600 text-sm mb-4">{result.location}</p>
                    )}
                    <button
                      onClick={() => {
                        // Use history API to update the URL with the restaurant ID
                        window.history.pushState({}, '', `?id=${result.id}`);
                        setShowSearch(false);
                      }}
                      className="px-4 py-2 bg-[#f9c3c9] text-white rounded-full hover:bg-[#f5b7ee] transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Request a Menu Call to Action */}
          <div className="mt-16 text-center py-8 bg-white rounded-lg shadow-md">
            <p className="text-lg mb-4">Can't find what you're looking for?</p>
            <button
              onClick={openRequestMenuModal}
              className="px-8 py-3 bg-[#dab9f8] text-white rounded-full hover:bg-[#c9a1f0] transition-colors"
            >
              Request a Menu
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen relative">
        {/* Blob decorations */}
        <div className="fixed top-0 right-0 w-64 h-64 bg-[#FFD879]/20 rounded-full blur-3xl"></div>
        <div className="fixed bottom-20 left-10 w-80 h-80 bg-[#f9c3c9]/10 rounded-full blur-3xl"></div>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#dab9f8]"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center relative">
        {/* Blob decorations */}
        <div className="fixed top-0 right-0 w-64 h-64 bg-[#FFD879]/20 rounded-full blur-3xl"></div>
        <div className="fixed bottom-20 left-10 w-80 h-80 bg-[#f9c3c9]/10 rounded-full blur-3xl"></div>
        <p className="text-red-500 text-lg">{error}</p>
        <button 
          onClick={() => setShowSearch(true)}
          className="text-[#dab9f8] hover:underline mt-4 inline-block"
        >
          Back to Search
        </button>
      </div>
    );
  }

  // No restaurant found
  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-8 text-center relative">
        {/* Blob decorations */}
        <div className="fixed top-0 right-0 w-64 h-64 bg-[#FFD879]/20 rounded-full blur-3xl"></div>
        <div className="fixed bottom-20 left-10 w-80 h-80 bg-[#f9c3c9]/10 rounded-full blur-3xl"></div>
        <p className="text-gray-500 text-lg">Restaurant not found or invalid ID provided.</p>
        <button 
          onClick={() => setShowSearch(true)}
          className="text-[#dab9f8] hover:underline mt-4 inline-block"
        >
          Back to Search
        </button>
      </div>
    );
  }

  return (
    
    <div className="bg-white min-h-screen relative">
      <AnimatedBackground />      <div className="fixed top-0 right-0 w-64 h-64 bg-[#FFD879]/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-20 left-10 w-80 h-80 bg-[#f9c3c9]/10 rounded-full blur-3xl"></div>
      
      {/* Top Navigation Bar */}
      <header className="py-4 px-6 bg-transparent">
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="bg-[#f2d36e] rounded-full h-10 w-10 flex items-center justify-center">
              <FontAwesomeIcon icon={faUtensils} className="text-white" />
            </div>
            <h1 className="ml-3 text-xl font-bold">Chow You Doing?</h1>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-[#f3b4eb]">Home</Link>
            <Link href="/patron-dashboard" className="text-gray-700 hover:text-[#f3b4eb]">Dashboard</Link>
            <Link href="/top-rated" className="text-gray-700 hover:text-[#f3b4eb]">Top Rated</Link>
            <Link href="/recent-reviews" className="text-gray-700 hover:text-[#f3b4eb]">Recent Reviews</Link>
          </nav>
        </div>
      </header>
      
      {/* Restaurant Header with Gradient - Full width with adjusted spacing */}
      <div 
          className="relative py-14 text-left px-8 rounded-full z-0"
        >
          {/* Background with blur */}
          <div 
            className="absolute top-0 right-0 w-full h-full rounded-full blur-3xl"
            style={{
              background: 'linear-gradient(to right, #f9ebc3, #f9c3c9, #f5b7ee, #dab9f8)',
              opacity: 0.4,
              zIndex: -1 // Keeps the blurred background behind the content
            }}
          />

          {/* Content */}
          <div className="container mx-auto relative z-10">
          <button
      onClick={(e) => toggleFavorite(restaurant.id, e)}
      disabled={isSubmittingFav[restaurant.id]}
      className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-[#f5f5f5] transition-colors z-10"
      aria-label={favourites[restaurant.id] ? "Remove from favourites" : "Add to favourites"}
    >
      <FontAwesomeIcon 
        icon={favourites[restaurant.id] ? faSolidHeart : faRegularHeart} 
        className={favourites[restaurant.id] ? "text-[#A90D3C]" : "text-gray-400"}
        spin={isSubmittingFav[restaurant.id]}
        size="lg"
      />
    </button>
            <h1 className="text-4xl font-medium text-gray-600 mb-1">{restaurant.name}</h1>
            <p className="text-gray-700 mb-8">{restaurant.address}</p>

            <div>
              <button 
                onClick={handleOpenWriteReviewModal}
                className="bg-white text-[#f5b7ee] px-6 py-2 rounded-full hover:bg-[#f5b7ee] hover:text-white transition-colors font-medium border border-[#f5b7ee]"
              >
                Write a Review
              </button>
            </div>
          </div>
        </div>

              
      {/* Tab Navigation */}
      <div className="container mx-auto border-b border-gray-200">
        <div className="flex">
          <button
            className={`px-8 py-4 font-medium ${
              activeTab === "menu"
                ? "text-[#dab9f8] border-b-2 border-[#dab9f8]"
                : "text-gray-600 hover:text-[#dab9f8]"
            }`}
            onClick={() => setActiveTab("menu")}
          >
            Menu
          </button>
          <button
            className={`px-8 py-4 font-medium ${
              activeTab === "photos"
                ? "text-[#dab9f8] border-b-2 border-[#dab9f8]"
                : "text-gray-600 hover:text-[#dab9f8]"
            }`}
            onClick={() => setActiveTab("photos")}
          >
            Photos
          </button>
          <button
            className={`px-8 py-4 font-medium ${
              activeTab === "reviews"
                ? "text-[#dab9f8] border-b-2 border-[#dab9f8]"
                : "text-gray-600 hover:text-[#dab9f8]"
            }`}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews ({restaurant.reviews.length})
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="container mx-auto py-8">
      {activeTab === "menu" && (
        <div className="relative px-4">
          {restaurant.menuItems.length > 0 ? (
            <div className="space-y-4 relative">
              {/* Menu Carousel with Navigation Controls */}
              <div className="flex justify-end mb-4 space-x-2">
                <button 
                  onClick={prevMenuItems} 
                  disabled={!canGoPrev()}
                  className={`p-2 rounded-full ${canGoPrev() ? 'bg-[#f9c3c9] text-white' : 'bg-gray-200 text-gray-400'}`}
                  aria-label="Previous items"
                >
                  <FontAwesomeIcon icon={faChevronUp} />
                </button>
                <button 
                  onClick={nextMenuItems}
                  disabled={!canGoNext()}
                  className={`p-2 rounded-full ${canGoNext() ? 'bg-[#f9c3c9] text-white' : 'bg-gray-200 text-gray-400'}`}
                  aria-label="Next items"
                >
                  <FontAwesomeIcon icon={faChevronDown} />
                </button>
              </div>
              
              {/* Menu Items - Displayed as a Vertical Carousel */}
              {restaurant.menuItems
                .slice(carouselStart, carouselStart + itemsPerPage)
                .map((item, index) => {
                  // List of possible border colors
                  const borderColors = ['#faeec9', '#facace', '#f8bff1', '#e0c1f9', '#f5d97a'];
                  
                  // Randomly select a color for the border
                  const borderColor = borderColors[Math.floor(Math.random() * borderColors.length)];

                  return (
                    <div 
                      key={index} 
                      className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow hover:scale-105 transition-transform duration-300"
                      style={{ border: `2px solid ${borderColor}` }} // Apply the random border color
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
                          <h3 className="font-semibold text-lg text-black">{item.name}</h3>
                          <p className="text-gray-600 mt-1 text-sm">{item.description}</p>
                        </div>
                        <p className="text-[#f9c3c9] font-bold text-xl flex-shrink-0">{item.price}</p>
                      </div>
                      {item.img_url && (
                        <div className="mt-3 h-40 relative rounded-md overflow-hidden">
                          <Image 
                            src={item.img_url} 
                            alt={item.name} 
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No menu items available for this restaurant.</p>
              <button
                onClick={openRequestMenuModal}
                className="text-[#dab9f8] font-medium hover:underline block mt-2 mx-auto"
              >
                Would you like to request a menu?
              </button>
            </div>
          )}
        </div>
      )}

        
        {activeTab === "photos" && (
          <div className="px-4">
            {menuPhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {menuPhotos.map((photo, index) => (
                  <div key={index} className="aspect-square relative rounded-lg overflow-hidden shadow-md">
                    <Image 
                      src={photo} 
                      alt={`Restaurant photo ${index + 1}`} 
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No photos available for this restaurant.</p>
                <button 
                  onClick={handleOpenWriteReviewModal}
                  className="text-[#dab9f8] font-medium hover:underline block mt-2">
                  Be the first to upload photos in your review!
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "reviews" && (
          <div className="px-4">
            {restaurant.reviews.length > 0 ? (
              <div className="space-y-6">
                {restaurant.reviews.map((review, index) => (
                  <div 
                    key={review.id || index} 
                    className="bg-white rounded-lg shadow-md p-5 cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden"
                    onClick={() => handleReviewClick(review)}
                  >
                    {/* Blob decoration for review card */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#f9ebc3]/10 rounded-full"></div>
                    
                    <div className="flex justify-between relative z-10">
                      <div className="flex items-center">
                        {renderStars(review.rating || 5)}
                        {review.date && (
                          <span className="ml-2 text-sm text-gray-500">{review.date}</span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-[#f5b7ee]">
                        {review.patron?.firstName || review.author || "Anonymous"} {review.patron?.lastName?.charAt(0) || ""}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-4 relative z-10">
                      {review.imageUrl && (
                        <div className="w-24 h-24 relative flex-shrink-0">
                          <Image 
                            src={review.imageUrl} 
                            alt="Review photo" 
                            fill
                            className="object-cover rounded-md"
                          />
                        </div>
                      )}
                      <p className="text-gray-700 italic">"{review.content || review.text || ''}"</p>
                    </div>
                    
                    {/* Edit button if user is the author */}
                    {isReviewAuthor(review) && (
                      <button
                        className="mt-2 text-sm text-[#dab9f8] hover:underline flex items-center relative z-10"
                        onClick={(e) => handleEditReview(review, e)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit Review
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No reviews available for this restaurant.</p>
                <button
                  onClick={handleOpenWriteReviewModal}
                  className="text-[#dab9f8] font-medium hover:underline block mt-2">
                  Be the first to write a review!
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
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


      {/* Request Menu Modal */}
      {modalType === ModalType.REQUEST && (
        <RequestMenuModal 
          isOpen={true}
          onClose={closeModal}
        />
      )}
      
      {/* Write Review Modal */}
      {modalType === ModalType.WRITE && restaurant && (
        <EnhancedReviewModal
          isOpen={true}
          onClose={closeModal}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
        />
      )}

    </div>
  );
}

// Loading fallback component
function LoadingFallback(): JSX.Element {
  return (
    <div className="bg-white min-h-screen flex justify-center items-center relative">
      {/* Blob decorations */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-[#FFD879]/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-20 left-10 w-80 h-80 bg-[#f9c3c9]/10 rounded-full blur-3xl"></div>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#dab9f8]"></div>
    </div>
  );
}

// Main page component
export default function RestaurantDetailsPage(): JSX.Element {
  return (
    <div>
      <Suspense fallback={<LoadingFallback />}>
        <RestaurantContent />
      </Suspense>
    </div>
  );
}