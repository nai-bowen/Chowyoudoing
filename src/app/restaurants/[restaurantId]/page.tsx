/*eslint-disable*/
"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/_components/Home-Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUtensils, faChevronUp, faChevronDown, faStar } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";

// Define strong types
type Patron = {
  firstName: string;
  lastName: string;
};

type Review = {
  id: string;
  content: string;
  rating: number;
  imageUrl?: string;
  text?: string;
  patron?: Patron;
  date?: string;
  isAnonymous: boolean;
};

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  img_url?: string;
};

type Restaurant = {
  id: string;
  name: string;
  address: string;
  reviews: Review[];
  menuItems: MenuItem[];
};

type RestaurantPageParams = {
  restaurantId: string;
};

// This is a simplified version of the AnimatedBackground component
// In a real implementation, you would import the actual component
function AnimatedBackground(): JSX.Element {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="fixed top-0 right-0 w-64 h-64 bg-[#FFD879]/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-20 left-10 w-80 h-80 bg-[#f9c3c9]/10 rounded-full blur-3xl"></div>
    </div>
  );
}

// RestaurantContent component
function RestaurantContent(): JSX.Element {
  const params = useParams<RestaurantPageParams>();
  const restaurantId = params?.restaurantId as string;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "photos" | "reviews">("menu");
  const [menuPhotos, setMenuPhotos] = useState<string[]>([]);
  
  // Carousel state
  const [carouselStart, setCarouselStart] = useState<number>(0);
  const itemsPerPage = 3; // Number of menu items to show at once
  
  // Refs for menu items to enable scrolling to them
  const menuItemRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    // Default value for localStorage in case it's not available
    const defaultVisitedRestaurants: string[] = [];
    let visitedPages: string[] = defaultVisitedRestaurants;
    
    try {
      // Track restaurant visits in localStorage
      const visitLimit = 3;
      const storedVisits = localStorage.getItem("visitedRestaurants");
      
      // Safely parse localStorage data
      if (storedVisits) {
        try {
          visitedPages = JSON.parse(storedVisits);
          // Ensure it's an array
          if (!Array.isArray(visitedPages)) {
            visitedPages = defaultVisitedRestaurants;
          }
        } catch (e) {
          console.error("Error parsing visited restaurants:", e);
          visitedPages = defaultVisitedRestaurants;
        }
      }

      if (restaurantId && !visitedPages.includes(restaurantId)) {
        visitedPages.push(restaurantId);
        localStorage.setItem("visitedRestaurants", JSON.stringify(visitedPages));
      }

      if (visitedPages.length > visitLimit) {
        setShowPopup(true);
      }
    } catch (e) {
      // Handle localStorage errors (e.g., in incognito mode)
      console.error("Error accessing localStorage:", e);
    }

    async function fetchRestaurant() {
      if (!restaurantId) {
        setError("Restaurant ID is missing");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/restaurants/${restaurantId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch restaurant data: ${res.status}`);
        }
        const data = await res.json();
        
        // Ensure the returned data has the expected structure
        if (!data || typeof data !== 'object') {
          throw new Error("Invalid restaurant data format");
        }
        
        // Set defaults for potential missing data
        const safeData: Restaurant = {
          id: data.id || restaurantId,
          name: data.name || "Restaurant",
          address: data.address || "Address not available",
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
          menuItems: Array.isArray(data.menuItems) ? data.menuItems : []
        };
        
        setRestaurant(safeData);
        setMenuPhotos(extractPhotos(safeData));
      } catch (error) {
        console.error("Error fetching restaurant:", error);
        setError("Failed to load restaurant data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurant();
  }, [restaurantId]);

  // Handle hash anchor navigation for menu items
  useEffect(() => {
    if (!loading && restaurant && window.location.hash) {
      const hash = window.location.hash.substring(1); // Remove the # symbol
      
      // Set a slight delay to ensure DOM elements are rendered
      setTimeout(() => {
        // Find the menu item that matches the hash
        const menuItem = restaurant.menuItems.find(item => 
          item.name.replace(/\s+/g, "-").toLowerCase() === hash
        );
        
        if (menuItem) {
          // Switch to the menu section
          setActiveTab("menu");
          
          // Scroll to the menu item
          const itemRef = menuItemRefs.current[hash];
          if (itemRef) {
            itemRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a highlight animation
            itemRef.classList.add('highlight-animation');
            // Remove the animation class after the animation completes
            setTimeout(() => {
              itemRef.classList.remove('highlight-animation');
            }, 2000);
          }
        }
      }, 300);
    }
  }, [loading, restaurant]);

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

  // Render stars for rating
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

  

  // Loading state
  if (loading) return (
    <div className="bg-white min-h-screen flex justify-center items-center relative">
      <AnimatedBackground />
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#dab9f8]"></div>
    </div>
  );
  
  // Error state
  if (error) return (
    <div className="bg-white min-h-screen flex justify-center items-center relative">
      <AnimatedBackground />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-red-500">{error}</p>
        <Link href="/patron-search" className="mt-4 text-[#dab9f8] hover:underline block text-center">
          Back to Search
        </Link>
      </div>
    </div>
  );
  
  // No restaurant found
  if (!restaurant) return (
    <div className="bg-white min-h-screen flex justify-center items-center relative">
      <AnimatedBackground />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500">Restaurant not found.</p>
        <Link href="/patron-search" className="mt-4 text-[#dab9f8] hover:underline block text-center">
          Back to Search
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen relative">
      <AnimatedBackground />
      
      {/* Block Page with Popup if Limit Exceeded */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
            <h2 className="text-2xl font-bold text-[#f5b7ee]">Sign Up to Continue</h2>
            <p className="mt-4 text-gray-600">
              You have reached your free view limit. Create an account to explore more!
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <Link href="/register">
                <button className="px-6 py-2 bg-[#f9c3c9] text-white rounded-full hover:bg-[#f5b7ee] transition">
                  Sign Up
                </button>
              </Link>
              <Link href="/login">
                <button className="px-6 py-2 bg-[#dab9f8] text-white rounded-full hover:bg-[#c9a1f0] transition">
                  Log In
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}


      
      {/* Restaurant Header with Gradient */}
      <div className="relative py-14 text-left px-8 rounded-full z-0">
        {/* Background with blur */}
        <div 
          className="absolute top-0 right-0 w-full h-full rounded-full blur-3xl"
          style={{
            background: 'linear-gradient(to right, #f9ebc3, #f9c3c9, #f5b7ee, #dab9f8)',
            opacity: 0.4,
            zIndex: -1
          }}
        />

        {/* Content */}
        <div className="container mx-auto relative z-10">
          <button
            className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-[#f5f5f5] transition-colors z-10"
            onClick={() => {
              // Prompt to login since this is for non-account holders
              setShowPopup(true);
            }}
            aria-label="Add to favorites"
          >
            <FontAwesomeIcon 
              icon={faRegularHeart} 
              className="text-gray-400"
              size="lg"
            />
          </button>
          <h1 className="text-4xl font-medium text-gray-600 mb-1">{restaurant.name}</h1>
          <p className="text-gray-700 mb-8">{restaurant.address}</p>

          <div>
            <Link href="/login">
              <button 
                className="bg-white text-[#f5b7ee] px-6 py-2 rounded-full hover:bg-[#f5b7ee] hover:text-white transition-colors font-medium border border-[#f5b7ee]"
              >
                Write a Review
              </button>
            </Link>
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
                    
                    // Create anchor ID for the menu item
                    const itemAnchor = item.name.replace(/\s+/g, "-").toLowerCase();

                    return (
                      <div 
                        key={item.id || index} 
                        id={itemAnchor}
                        ref={(el: HTMLDivElement | null) => { 
                          menuItemRefs.current[itemAnchor] = el; 
                        }}                        
                        className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow hover:scale-105 transition-transform duration-300"
                        style={{ border: `2px solid ${borderColor}` }}
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
                <Link href="/login">
                  <button className="text-[#dab9f8] font-medium hover:underline block mt-2 mx-auto">
                    Would you like to request a menu?
                  </button>
                </Link>
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
                <Link href="/login">
                  <button className="text-[#dab9f8] font-medium hover:underline block mt-2">
                    Login to upload photos in your review!
                  </button>
                </Link>
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
                    className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow relative overflow-hidden"
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
                      {review.isAnonymous ? (
                        "Anonymous"
                      ) : (
                        <>
                          {review.patron?.firstName || "Anonymous"} {review.patron?.lastName?.charAt(0) || ""}
                        </>
                      )}
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No reviews available for this restaurant.</p>
                <Link href="/login">
                  <button className="text-[#dab9f8] font-medium hover:underline block mt-2">
                    Login to write a review!
                  </button>
                </Link>
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
      
      {/* CSS for highlight animation */}
      <style jsx global>{`
        @keyframes highlight {
          0% {
            box-shadow: 0 0 0 0 rgba(245, 183, 238, 0.5);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(245, 183, 238, 0);
            transform: scale(1.03);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(245, 183, 238, 0);
            transform: scale(1);
          }
        }
        
        .highlight-animation {
          animation: highlight 2s ease-in-out;
          background-color: rgba(249, 235, 195, 0.3);
        }
      `}</style>
    </div>
  );
}

// Main page component
export default function RestaurantPage(): JSX.Element {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Suspense fallback={
        <div className="bg-white min-h-screen flex justify-center items-center relative">
          <div className="fixed top-0 right-0 w-64 h-64 bg-[#FFD879]/20 rounded-full blur-3xl"></div>
          <div className="fixed bottom-20 left-10 w-80 h-80 bg-[#f9c3c9]/10 rounded-full blur-3xl"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#dab9f8]"></div>
        </div>
      }>
        <RestaurantContent />
      </Suspense>
    </div>
  );
}