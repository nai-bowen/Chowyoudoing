/*eslint-disable*/
"use client";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faHeart as faSolidHeart, faUtensils, faCircle, faSearch, faFilter, faTimes } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import Image from "next/image";
import Link from "next/link";
import ReviewModal from '@/app/_components/ReviewModal';
import RequestMenuModal from "@/app/_components/RequestMenuModal";
import AnimatedBackground from "../_components/AnimatedBackground";
import WriteReviewModal from '@/app/_components/WriteReviewModal';

// Define types
interface Patron {
  firstName: string;
  lastName: string;
  id?: string;
}

interface Review {
  reviewStandards: string | undefined;
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
  imageUrl?: string | undefined;
  videoUrl?: string | null;
  patron?: Patron;
  menuItemId?: string;
  isAnonymous?: boolean;
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
  hasReviews?: boolean;
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
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("");
  const [selectedMenuItemName, setSelectedMenuItemName] = useState<string>("");
  
  // Carousel state
  const [carouselStart, setCarouselStart] = useState<number>(0);
  const itemsPerPage = 3; // Number of menu items to show at once

  const [favourites, setfavourites] = useState<Record<string, boolean>>({});
  const [isSubmittingFav, setIsSubmittingFav] = useState<Record<string, boolean>>({});

  // New state for filtering reviews by menu items
  const [selectedReviewFilters, setSelectedReviewFilters] = useState<string[]>([]);
  const [reviewFilterSearch, setReviewFilterSearch] = useState<string>("");
  const [showReviewFilters, setShowReviewFilters] = useState<boolean>(false);

  // New state for menu search and filter
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>("");
  const [showOnlyReviewed, setShowOnlyReviewed] = useState<boolean>(false);

  const processRestaurantData = (data: any): {
    id: string;
    name: string;
    address: string;
    reviews: any[];
    menuItems: any[];
  } => {
    // Process menu items to check if they have reviews
    const processedMenuItems = Array.isArray(data.menuItems) ? 
      data.menuItems.map((item: any) => {
        // Check if this menu item has reviews - first by direct ID match
        const hasDirectReviews = Array.isArray(data.reviews) && 
          data.reviews.some((review: any) => review.menuItemId === item.id);
        
        // Fall back to text matching only if no direct matches
        const hasTextReviews = !hasDirectReviews && Array.isArray(data.reviews) && 
          data.reviews.some((review: any) => {
            if (!item.name) return false;
            
            // Check if review title/content mentions the menu item
            const reviewContainsItem = 
              (review.title?.toLowerCase().includes(item.name.toLowerCase())) ||
              (review.content?.toLowerCase().includes(item.name.toLowerCase()));
              
            return reviewContainsItem;
          });
        
        // Return menu item with hasReviews flag
        return {
          ...item,
          hasReviews: hasDirectReviews || hasTextReviews
        };
      }) : [];
      
    // Create the restaurant object with the processed data
    return {
      id: data.id,
      name: data.name || data.title || "Restaurant",
      address: data.address || data.location || "No address available",
      reviews: Array.isArray(data.reviews) ? data.reviews : [],
      menuItems: processedMenuItems,
    };
  };

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

  // Function to check if a menu item has reviews - more thorough implementation
  const hasReviews = (menuItemId?: string): boolean => {
    if (!menuItemId || !restaurant || !restaurant.reviews) return false;
    
    return restaurant.reviews.some(review => {
      // Direct menuItemId match
      if (review.menuItemId === menuItemId) return true;
      
      // Look for possible indirect references
      // 1. Check if the review title matches the menu item name
      const menuItem = restaurant.menuItems.find(item => item.id === menuItemId);
      if (menuItem && review.title && review.title.toLowerCase().includes(menuItem.name.toLowerCase())) {
        return true;
      }
      
      // 2. Check if the review content mentions the menu item name
      if (menuItem && review.content && review.content.toLowerCase().includes(menuItem.name.toLowerCase())) {
        return true;
      }
      
      return false;
    });
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
        // Include explicit query parameter to request reviews with menuItem IDs
        const res = await fetch(`/api/restaurants/${restaurantId}?t=${timestamp}&includeReviewMenuItems=true`);
        if (!res.ok) throw new Error("Failed to fetch restaurant data");
        const data = await res.json();
        
        console.log("Restaurant data fetched:", {
          reviewCount: data.reviews?.length || 0,
          menuItemCount: data.menuItems?.length || 0,
          // Log a sample review if available to debug
          sampleReview: data.reviews?.length > 0 ? {
            id: data.reviews[0].id,
            menuItemId: data.reviews[0].menuItemId,
            content: data.reviews[0].content?.substring(0, 30) + "..."
          } : null
        });
        
        // Process the restaurant data
        const restaurantData = processRestaurantData(data);
        
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

  // When opening the review modal
  const handleReviewClick = (review: Review): void => {
    console.log("Opening review:", review);
    
    // Before setting the selected review, find any menu item mentioned in the content
    const menuItem = restaurant?.menuItems.find(item => {
      if (!review.content) return false;
      return review.content.toLowerCase().includes(item.name.toLowerCase());
    });
    
    // Update the reviewStandards field to include menu item info if found
    const reviewWithMenuInfo = {
      ...review,
      reviewStandards: menuItem 
        ? `Menu item: ${menuItem.name}${review.reviewStandards ? `\n\n${review.reviewStandards}` : ""}`
        : review.reviewStandards
    };
    
    setSelectedReview(reviewWithMenuInfo);
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
  const handleOpenWriteReviewModal = (menuItemId?: string, menuItemName?: string): void => {
    if (!restaurant) return;
    
    // Set the selected menu item info if provided
    setSelectedMenuItemId(menuItemId || "");
    setSelectedMenuItemName(menuItemName || "");
    setModalType(ModalType.WRITE);
  }

  // Handle successful review submission
  const handleReviewSuccess = (): void => {
    console.log("Review submitted successfully, refreshing data");
    setReviewUpdated(true);
    
    // Automatically switch to reviews tab after submitting a review
    setActiveTab("reviews");
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
    setSelectedMenuItemId("");
    setSelectedMenuItemName("");
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

  const findMenuItemForReview = (review: Review): MenuItem | undefined => {
    if (!restaurant || !restaurant.menuItems || !review.content) return undefined;
    
    // Get all possible text content from the review
    const reviewText = (review.content || review.text || '').toLowerCase();
    
    // Try to find a menu item whose name is mentioned in the review text
    // Sort by length descending to prioritize longer, more specific matches
    // (prevents matching "tuna" in "tuna roll" if both are menu items)
    const sortedMenuItems = [...restaurant.menuItems]
      .sort((a, b) => b.name.length - a.name.length);
      
    return sortedMenuItems.find(item => {
      const itemName = item.name.toLowerCase();
      
      // Check for word boundaries to avoid partial matches
      // This checks for the item name as a whole word or phrase
      const wordBoundaryRegex = new RegExp(`\\b${itemName}\\b`, 'i');
      
      // First check with word boundaries
      if (wordBoundaryRegex.test(reviewText)) {
        return true;
      }
      
      // If that doesn't match, fall back to a simple includes check
      // for menu items that might be compound phrases
      return reviewText.includes(itemName);
    });
  };

  // Toggle a menu item in the review filter
  const toggleMenuItemFilter = (menuItemId: string): void => {
    setSelectedReviewFilters(prevFilters => {
      if (prevFilters.includes(menuItemId)) {
        return prevFilters.filter(id => id !== menuItemId);
      } else {
        return [...prevFilters, menuItemId];
      }
    });
  };

  // Clear all review filters
  const clearReviewFilters = (): void => {
    setSelectedReviewFilters([]);
    setReviewFilterSearch("");
  };

  // Filter menu items based on search and hasReviews
  const filteredMenuItems = useMemo(() => {
    if (!restaurant) return [];
    
    return restaurant.menuItems.filter(item => {
      // Apply search filter if present
      const matchesSearch = menuSearchQuery === "" || 
        item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(menuSearchQuery.toLowerCase()));
      
      // Apply "has reviews" filter if toggled on
      const matchesReviewFilter = !showOnlyReviewed || (item.hasReviews === true);
      
      return matchesSearch && matchesReviewFilter;
    });
  }, [restaurant, menuSearchQuery, showOnlyReviewed]);

  // Filter reviews based on selected menu items
  const filteredReviews = useMemo(() => {
    if (!restaurant) return [];
    
    // If no filters are selected, show all reviews
    if (selectedReviewFilters.length === 0) {
      return restaurant.reviews;
    }
    
    return restaurant.reviews.filter(review => {
      // If the review has a menuItemId and it's in our selected filters
      if (review.menuItemId && selectedReviewFilters.includes(review.menuItemId)) {
        return true;
      }
      
      // Otherwise check if the review mentions any of the selected menu items
      return selectedReviewFilters.some(menuItemId => {
        const menuItem = restaurant.menuItems.find(item => item.id === menuItemId);
        if (!menuItem || !review.content) return false;
        
        return review.content.toLowerCase().includes(menuItem.name.toLowerCase());
      });
    });
  }, [restaurant, selectedReviewFilters]);

  // Filter menu items in dropdown based on search
  const filteredMenuItemsForDropdown = useMemo(() => {
    if (!restaurant) return [];
    
    return restaurant.menuItems.filter(item => 
      reviewFilterSearch === "" || 
      item.name.toLowerCase().includes(reviewFilterSearch.toLowerCase())
    );
  }, [restaurant, reviewFilterSearch]);

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
      <AnimatedBackground />      
      <div className="fixed top-0 right-0 w-64 h-64 bg-[#FFD879]/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-20 left-10 w-80 h-80 bg-[#f9c3c9]/10 rounded-full blur-3xl"></div>
      
      {/* Top Navigation Bar */}
      <header className="py-4 px-6 bg-transparent">

      </header>
      
      {/* Restaurant Header with Gradient - Full width with adjusted spacing */}
      <div className="relative py-14 text-left px-8 rounded-full z-0">
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
              onClick={() => handleOpenWriteReviewModal()}
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
                {/* Search and filter controls */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                  <div className="relative flex-grow max-w-md">
                    <input
                      type="text"
                      placeholder="Search menu items..."
                      value={menuSearchQuery}
                      onChange={(e) => setMenuSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pl-10 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                    </div>
                    {menuSearchQuery && (
                      <button 
                        onClick={() => setMenuSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOnlyReviewed}
                        onChange={() => setShowOnlyReviewed(!showOnlyReviewed)}
                        className="form-checkbox h-5 w-5 text-[#f5b7ee] rounded focus:ring-[#f5b7ee] border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">Show only reviewed items</span>
                    </label>
                  </div>
                </div>

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
                
                {/* Menu Items */}
                {filteredMenuItems.length > 0 ? (
                  filteredMenuItems
                    .slice(carouselStart, carouselStart + itemsPerPage)
                    .map((item, index) => {
                      // List of possible border colors
                      const borderColors = ['#faeec9', '#facace', '#f8bff1', '#e0c1f9', '#f5d97a'];
                      
                      // Randomly select a color for the border
                      const borderColor = borderColors[Math.floor(Math.random() * borderColors.length)];
                      
                      // Use the hasReviews property directly instead of calling the function
                      const itemHasReviews = item.hasReviews === true;

                      return (
                        <div 
                          key={index} 
                          className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow hover:scale-105 transition-transform duration-300 relative"
                          style={{ border: `2px solid ${borderColor}` }}
                        >
                          {/* Review status badge */}
                          <div className="absolute top-2 left-2 z-10">
                            <span 
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shadow-sm ${
                                itemHasReviews 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {itemHasReviews ? "✓ Reviewed" : "No reviews yet"}
                            </span>
                          </div>
                          <div className="flex justify-between items-start mt-2">
                            <div className="flex-1 pr-4 pt-4">
                              {/* Make the title clickable to open the write review modal */}
                              <h3 
                                className="font-semibold text-lg text-black cursor-pointer hover:text-[#dab9f8] transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenWriteReviewModal(item.id, item.name);
                                }}
                              >
                                {item.name}
                                {!itemHasReviews && (
                                  <span className="ml-2 text-xs text-[#dab9f8]">(Write a review)</span>
                                )}
                              </h3>
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
                    })
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No menu items match your search criteria.</p>
                    <button
                      onClick={() => {
                        setMenuSearchQuery("");
                        setShowOnlyReviewed(false);
                      }}
                      className="mt-2 text-[#dab9f8] hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
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
                  onClick={() => handleOpenWriteReviewModal()}
                  className="text-[#dab9f8] font-medium hover:underline block mt-2"
                >
                  Be the first to upload photos in your review!
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "reviews" && (
          <div className="px-4">
            {restaurant.reviews.length > 0 ? (
              <>
                {/* Filter controls */}
                <div className="mb-6 relative">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="relative">
                      <button
                        onClick={() => setShowReviewFilters(!showReviewFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
                        <span>Filter by Menu Item</span>
                        <FontAwesomeIcon 
                          icon={showReviewFilters ? faChevronUp : faChevronDown} 
                          className="text-gray-500"
                        />
                      </button>
                      
                      {/* Selected filters badges */}
                      {selectedReviewFilters.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedReviewFilters.map(filterId => {
                            const menuItem = restaurant.menuItems.find(item => item.id === filterId);
                            if (!menuItem) return null;
                            
                            return (
                              <span 
                                key={filterId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-[#f5b7ee]/20 text-[#dab9f8] text-sm rounded-full"
                              >
                                {menuItem.name}
                                <button
                                  onClick={() => toggleMenuItemFilter(filterId)}
                                  className="text-[#dab9f8] hover:text-[#c9a1f0] ml-1"
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </span>
                            );
                          })}
                          
                          <button
                            onClick={clearReviewFilters}
                            className="text-[#dab9f8] text-sm hover:underline"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                      
                      {/* Dropdown menu */}
                      {showReviewFilters && (
                        <div className="absolute z-20 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg">
                          <div className="p-3">
                            {/* Search input */}
                            <div className="relative mb-3">
                              <input
                                type="text"
                                placeholder="Search menu items..."
                                value={reviewFilterSearch}
                                onChange={(e) => setReviewFilterSearch(e.target.value)}
                                className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md text-sm"
                              />
                              <FontAwesomeIcon 
                                icon={faSearch} 
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                              />
                            </div>
                            
                            {/* Menu items checkboxes */}
                            <div className="max-h-60 overflow-y-auto">
                              {filteredMenuItemsForDropdown.length > 0 ? (
                                filteredMenuItemsForDropdown.map(item => (
                                  <label 
                                    key={item.id} 
                                    className="flex items-center py-2 px-1 hover:bg-gray-50 cursor-pointer rounded"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedReviewFilters.includes(item.id || "")}
                                      onChange={() => toggleMenuItemFilter(item.id || "")}
                                      className="form-checkbox h-4 w-4 text-[#dab9f8] rounded focus:ring-[#dab9f8] border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{item.name}</span>
                                  </label>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 py-2">No menu items match your search.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Show number of filtered reviews if filters are applied */}
                    {selectedReviewFilters.length > 0 && (
                      <div className="text-sm text-gray-600">
                        Showing {filteredReviews.length} of {restaurant.reviews.length} reviews
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Reviews list */}
                <div className="space-y-6">
                  {filteredReviews.length > 0 ? (
                    filteredReviews.map((review, index) => {
                      // Find the menu item for this review (if menuItemId exists)
                      const menuItem = review.menuItemId 
                        ? restaurant.menuItems.find(item => item.id === review.menuItemId)
                        : null;
                        
                      return (
                        <div 
                          key={review.id || index} 
                          className="bg-white rounded-lg shadow-md p-5 cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden"
                          onClick={() => handleReviewClick(review)}
                        >
                          {/* Blob decoration for review card */}
                          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#f9ebc3]/10 rounded-full"></div>
                          
                          {/* Menu Item Name*/}
                          {menuItem && (
                            <div className="mb-3 px-2 py-1 bg-[#f8bff1]/10 rounded-md inline-block">
                              <span className="text-sm font-medium text-[#dab9f8]">Review for: {menuItem.name}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between relative z-10">
                            <div className="flex items-center">
                              {renderStars(review.rating || 5)}
                              {review.date && (
                                <span className="ml-2 text-sm text-gray-500">{review.date}</span>
                              )}
                            </div>
                            <div className="text-sm font-medium text-[#f5b7ee]">
                            {review.isAnonymous 
                              ? "Anonymous" 
                              : `${review.patron?.firstName || review.author || "Anonymous"} ${review.patron?.lastName?.charAt(0) || ""}`}
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
                      );
                    })
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No reviews match your filter criteria.</p>
                      <button
                        onClick={clearReviewFilters}
                        className="mt-2 text-[#dab9f8] hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No reviews available for this restaurant.</p>
                <button
                  onClick={() => handleOpenWriteReviewModal()}
                  className="text-[#dab9f8] font-medium hover:underline block mt-2"
                >
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
        <WriteReviewModal
          isOpen={true}
          onClose={closeModal}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          menuItemId={selectedMenuItemId}
          menuItemName={selectedMenuItemName}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Read Review Modal */}
      {/* Read Review Modal */}
      {modalType === ModalType.READ && selectedReview && (
        <ReviewModal 
          review={{
            id: selectedReview.id,
            // Ensure required properties are always defined with non-null values
            content: selectedReview.content || selectedReview.text || "", 
            rating: typeof selectedReview.rating === 'number' ? selectedReview.rating : 5,
            
            // Add image URL
            imageUrl: selectedReview.imageUrl,
            
            // Use reviewStandards to display menu item information
            reviewStandards: selectedReview.menuItemId && restaurant.menuItems ? 
                            `Menu item: ${restaurant.menuItems.find(item => item.id === selectedReview.menuItemId)?.name || ''}` : 
                            selectedReview.reviewStandards,
            
            // Include all optional properties with their original values or safe defaults
            date: selectedReview.date,
            upvotes: selectedReview.upvotes ?? 0,
            asExpected: selectedReview.asExpected ?? 0,
            wouldRecommend: selectedReview.wouldRecommend ?? 0,
            valueForMoney: selectedReview.valueForMoney ?? 0,
            
            // Include patron information for author display
            patron: selectedReview.patron?.id
            ? {
                id: selectedReview.patron.id,
                firstName: selectedReview.patron.firstName,
                lastName: selectedReview.patron.lastName,
              }
            : undefined,
                      
            // Add isAnonymous property
            isAnonymous: selectedReview.isAnonymous ?? false,
            
            // Keep track of user's vote
          }}
          isOpen={true} 
          onClose={closeModal} 
          onVoteUpdate={handleVoteUpdate} 
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