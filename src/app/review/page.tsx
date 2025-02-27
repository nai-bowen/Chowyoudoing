/*eslint-disable */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

// Define types for search results
type SearchResult = {
  id: string;
  name: string;
  type: string;
  url?: string;
  restaurant?: string;
};

// Define MenuItem type
interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string | null;
}

export default function ReviewPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const [restaurantId, setRestaurantId] = useState<string>("");
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [menuItemId, setMenuItemId] = useState<string>("");
  const [menuItemName, setMenuItemName] = useState<string>("");
  const [standards, setStandards] = useState({
    asExpected: 0,
    wouldRecommend: 0,
    valueForMoney: 0
  });
  const [reviewText, setReviewText] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  
  // Menu items dropdown
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState<boolean>(false);

  // Clear any error messages when session status changes
  useEffect(() => {
    console.log("Session status:", status);
    console.log("Session data:", session);
    if (status === "authenticated") {
      setErrorMessage(null);
      console.log("User is authenticated:", session?.user);
    }
  }, [status, session]);

  // Handle restaurant search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&meals=false&categories=false&locations=false`);
          if (!response.ok) throw new Error("Search failed");
          
          const data = await response.json();
          console.log("Search results:", data);
          setSearchResults(data.results);
          setShowResults(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Fetch menu items when restaurant is selected using fetch API
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!restaurantId) {
        setMenuItems([]);
        return;
      }
      
      setIsLoadingMenuItems(true);
      try {
        // Use fetch API instead of server action
        const response = await fetch(`/api/restaurants/${restaurantId}/menu-items`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch menu items");
        }
        
        const data = await response.json();
        console.log("Menu items:", data);
        setMenuItems(data.items || []);
      } catch (error) {
        console.error("Error fetching menu items:", error);
        setMenuItems([]);
      } finally {
        setIsLoadingMenuItems(false);
      }
    };

    fetchMenuItems();
  }, [restaurantId]);

  const handleRestaurantSelect = (result: SearchResult) => {
    console.log("Selected restaurant:", result);
    setRestaurantId(result.id);
    setRestaurantName(result.name);
    setSearchQuery(result.name);
    setShowResults(false);
    // Reset menu item when restaurant changes
    setMenuItemId("");
    setMenuItemName("");
  };

  const handleMenuItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setMenuItemId("");
      setMenuItemName("");
      return;
    }
    
    const selectedItem = menuItems.find(item => item.id === selectedId);
    if (selectedItem) {
      console.log("Selected menu item:", selectedItem);
      setMenuItemId(selectedItem.id);
      setMenuItemName(selectedItem.name);
    }
  };

  const handleRatingChange = (standard: keyof typeof standards, value: number) => {
    setStandards(prev => ({
      ...prev,
      [standard]: value
    }));
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    if (!event.target.files?.[0]) return;
    const file = event.target.files[0];
    
    // Check file size (7MB max)
    if (file.size > 7 * 1024 * 1024) {
      alert("File size exceeds 7MB limit");
      return;
    }
    
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      console.log(`${type} upload response:`, data);
      if (data.url) {
        type === "image" ? setImage(data.url) : setVideo(data.url);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error messages
    setErrorMessage(null);
    
    // Check if user is logged in
    if (status !== "authenticated") {
      setErrorMessage("You must be logged in to submit a review. Please log in and try again.");
      return;
    }
    
    if (!restaurantName) {
      alert("Please select a restaurant.");
      return;
    }
    
    if (reviewText.length < 10) {
      alert("Review must be at least 10 characters long.");
      return;
    }
    
    setIsSubmitting(true);
    
    const reviewData = {
      restaurant: restaurantName,
      menuItem: menuItemName || undefined, // Only include if selected
      standards: {
        asExpected: standards.asExpected,
        wouldRecommend: standards.wouldRecommend,
        valueForMoney: standards.valueForMoney
      },
      content: reviewText,
      imageUrl: image,
      videoUrl: video,
      rating: 5, // Default rating, you might want to add a rating component
    };
    
    console.log("Submitting review:", reviewData);
    console.log("Current session:", session);
    
    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
        credentials: "include", // Include cookies for auth
      });
      
      console.log("Review submission status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
        
        if (response.status === 401) {
          setErrorMessage("You must be logged in to submit a review. Please log in and try again.");
          throw new Error("Unauthorized: You must be logged in to submit a review");
        } else {
          setErrorMessage(`Error: ${errorData.error || response.statusText}`);
          throw new Error(`Failed to submit review: ${errorData.error || response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log("Review submission response:", data);
      
      if (data.success) {
        // Redirect to the restaurant page or review confirmation
        router.push(`/restaurants/${data.restaurantId}`);
      } else {
        throw new Error(data.error || "Failed to submit review");
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);
      if (!errorMessage) {
        setErrorMessage(error.message || "Failed to submit review. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render rating selector
  const RatingSelector = ({ 
    name, 
    value, 
    onChange 
  }: { 
    name: keyof typeof standards; 
    value: number; 
    onChange: (name: keyof typeof standards, value: number) => void 
  }) => {
    return (
      <div className="flex flex-col">
        <label className="mb-1 font-medium">{name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(name, rating)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                value === rating ? 'bg-amber-500 text-white' : 'bg-gray-200'
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Show a login prompt if user is not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto p-4 bg-amber-50 min-h-screen">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-amber-600 mb-6">Write Your Review</h2>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 rounded-lg mb-4">
            <p className="font-semibold">You need to be logged in to submit a review.</p>
            <button
              onClick={() => signIn()}
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-md font-medium"
            >
              Log in now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="container mx-auto p-4 bg-amber-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-amber-800">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-amber-50 min-h-screen">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-amber-600 mb-6">Write Your Review</h2>
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{errorMessage}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Restaurant Search */}
          <div className="relative">
            <label className="flex items-center gap-2 mb-2">
              <div className="bg-amber-500 text-white p-1 rounded-full flex items-center justify-center w-6 h-6">
                ✓
              </div>
              Restaurant
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              placeholder="Search for restaurants..."
              className="block w-full border border-gray-300 rounded-md p-2"
              required
            />
            
            {isSearching && (
              <div className="absolute right-3 top-10">
                <div className="animate-spin h-5 w-5 border-2 border-amber-500 rounded-full border-t-transparent"></div>
              </div>
            )}
            
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults
                  .filter(result => result.type === "Restaurant")
                  .map(result => (
                    <div
                      key={result.id}
                      className="px-4 py-2 hover:bg-amber-50 cursor-pointer"
                      onClick={() => handleRestaurantSelect(result)}
                    >
                      {result.name}
                    </div>
                  ))}
              </div>
            )}
          </div>
          
          {/* Menu Item Dropdown */}
          <div>
            <label className="flex items-center gap-2 mb-2">
              <div className="bg-amber-500 text-white p-1 rounded-full flex items-center justify-center w-6 h-6">
                🍔
              </div>
              Menu Item
            </label>
            <select
              value={menuItemId}
              onChange={handleMenuItemSelect}
              className="block w-full border border-gray-300 rounded-md p-2"
              disabled={!restaurantId || isLoadingMenuItems}
            >
              <option value="">Select a menu item (optional)</option>
              {menuItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.category ? `(${item.category})` : ''}
                </option>
              ))}
            </select>
            {isLoadingMenuItems && <p className="text-sm text-gray-500 mt-1">Loading menu items...</p>}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium mb-4">Ratings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RatingSelector 
              name="asExpected" 
              value={standards.asExpected}
              onChange={handleRatingChange}
            />
            <RatingSelector 
              name="wouldRecommend" 
              value={standards.wouldRecommend}
              onChange={handleRatingChange}
            />
            <RatingSelector 
              name="valueForMoney" 
              value={standards.valueForMoney}
              onChange={handleRatingChange}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium mb-2">Upload Content</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Upload */}
            <div>
              <p className="text-gray-600 mb-2">Upload Image</p>
              <div className="border-2 border-dashed border-amber-300 rounded-md p-4 text-center">
                {!image ? (
                  <>
                    <div className="flex justify-center mb-2">
                      <div className="w-16 h-16 bg-amber-300 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Upload From device</p>
                    <p className="text-xs text-gray-400">Max 7MB</p>
                    <input 
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, "image")}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label 
                      htmlFor="image-upload"
                      className="mt-2 inline-block bg-amber-500 text-white px-3 py-1 rounded-md text-sm cursor-pointer"
                    >
                      {isUploading ? "Uploading..." : "Select Image"}
                    </label>
                  </>
                ) : (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={image} 
                      alt="Uploaded image" 
                      className="max-h-32 mx-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Video Upload */}
            <div>
              <p className="text-gray-600 mb-2">Upload Video</p>
              <div className="border-2 border-dashed border-amber-300 rounded-md p-4 text-center">
                {!video ? (
                  <>
                    <div className="flex justify-center mb-2">
                      <div className="w-16 h-16 bg-amber-300 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Upload From device</p>
                    <p className="text-xs text-gray-400">Max 7MB</p>
                    <input 
                      type="file"
                      id="video-upload"
                      accept="video/*"
                      onChange={(e) => handleUpload(e, "video")}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label 
                      htmlFor="video-upload"
                      className="mt-2 inline-block bg-amber-500 text-white px-3 py-1 rounded-md text-sm cursor-pointer"
                    >
                      {isUploading ? "Uploading..." : "Select Video"}
                    </label>
                  </>
                ) : (
                  <div className="relative">
                    <video 
                      src={video} 
                      controls 
                      className="max-h-32 mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => setVideo(null)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="review-text" className="block mb-2">Tell us about your meal...</label>
          <textarea
            id="review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 h-32"
            minLength={10}
            required
          />
        </div>
        
        <div className="text-center">
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-md font-medium"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </form>
    </div>
  );
}