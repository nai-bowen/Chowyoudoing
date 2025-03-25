/*eslint-disable*/
"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Upload, MapPin, Star, Search } from "lucide-react";
import { useGeolocation } from "../../lib/locationService";
import { useSession } from "next-auth/react";

// Define types for search results
interface SearchResult {
  id: string;
  name: string;
  type: string;
  url?: string;
  restaurant?: string;
}

// Define MenuItem type
interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string | null;
}

interface Patron {
  firstName: string;
  lastName: string;
}

// Updated interface to accept both naming conventions
interface EnhancedReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Support both naming patterns
  restaurantId?: string;
  restaurantName?: string;
  menuItemId?: string;
  menuItemName?: string;
  // Also keep original naming for backward compatibility
  initialRestaurantId?: string;
  initialRestaurantName?: string;
  initialMenuItemId?: string;
  initialMenuItemName?: string;
  onSuccess?: () => void;
}

type RatingType = "rating" | "asExpected" | "wouldRecommend" | "valueForMoney";

const EnhancedReviewModal: React.FC<EnhancedReviewModalProps> = ({
  isOpen,
  onClose,
  // Use restaurant props with fallback to initial props
  restaurantId,
  restaurantName,
  menuItemId,
  menuItemName,
  initialRestaurantId,
  initialRestaurantName,
  initialMenuItemId,
  initialMenuItemName,
  onSuccess
}) => {
  const { data: session, status } = useSession();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const imageUploadRef = useRef<HTMLInputElement | null>(null);
  const videoUploadRef = useRef<HTMLInputElement | null>(null);
  
  // Use props with fallbacks
  const effectiveRestaurantId = restaurantId || initialRestaurantId || "";
  const effectiveRestaurantName = restaurantName || initialRestaurantName || "";
  const effectiveMenuItemId = menuItemId || initialMenuItemId || "";
  const effectiveMenuItemName = menuItemName || initialMenuItemName || "";
  
  // Restaurant search states
  const [searchQuery, setSearchQuery] = useState<string>(effectiveRestaurantName);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Selected restaurant and menu item
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(effectiveRestaurantId);
  const [selectedRestaurantName, setSelectedRestaurantName] = useState<string>(effectiveRestaurantName);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>(effectiveMenuItemId);
  const [selectedMenuItemName, setSelectedMenuItemName] = useState<string>(effectiveMenuItemName);
  
  // Menu items for selected restaurant
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState<boolean>(false);
  
  // Review content states
  const [rating, setRating] = useState<number>(4);
  const [content, setContent] = useState<string>("");
  const [asExpected, setAsExpected] = useState<number>(4);
  const [wouldRecommend, setWouldRecommend] = useState<number>(4);
  const [valueForMoney, setValueForMoney] = useState<number>(4);
  const [characterCount, setCharacterCount] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(true); // Toggle between simple and detailed view
  
  // Processing states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [includeLocation, setIncludeLocation] = useState<boolean>(false);
  
  const location = useGeolocation();

  // Update character count when content changes
  useEffect(() => {
    setCharacterCount(content.length);
  }, [content]);

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

  // Fetch menu items when restaurant changes
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!selectedRestaurantId) {
        setMenuItems([]);
        return;
      }
      
      setIsLoadingMenuItems(true);
      try {
        const response = await fetch(`/api/restaurants/${selectedRestaurantId}/menu-items`);
        
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
  }, [selectedRestaurantId]);

  // Handle click outside to close modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Handle ESC key to close modal
    function handleEscKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      
      // Reset form when modal is opened (but keep initial values if provided)
      setSelectedRestaurantId(effectiveRestaurantId);
      setSelectedRestaurantName(effectiveRestaurantName);
      setSearchQuery(effectiveRestaurantName);
      setSelectedMenuItemId(effectiveMenuItemId);
      setSelectedMenuItemName(effectiveMenuItemName);
      
      // Reset other form fields
      setRating(4);
      setContent("");
      setAsExpected(4);
      setWouldRecommend(4);
      setValueForMoney(4);
      setImageUrl(null);
      setVideoUrl(null);
      setIncludeLocation(false);
      setErrorMessage("");
      setSuccessMessage("");
      setIsSimpleMode(true);
      setIsSubmitting(false);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, effectiveRestaurantId, effectiveRestaurantName, effectiveMenuItemId, effectiveMenuItemName]);

  const handleRestaurantSelect = (result: SearchResult): void => {
    console.log("Selected restaurant:", result);
    setSelectedRestaurantId(result.id);
    setSelectedRestaurantName(result.name);
    setSearchQuery(result.name);
    setShowResults(false);
    // Reset menu item when restaurant changes
    setSelectedMenuItemId("");
    setSelectedMenuItemName("");
  };

  const handleMenuItemSelect = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setSelectedMenuItemId("");
      setSelectedMenuItemName("");
      return;
    }
    
    const selectedItem = menuItems.find(item => item.id === selectedId);
    if (selectedItem) {
      console.log("Selected menu item:", selectedItem);
      setSelectedMenuItemId(selectedItem.id);
      setSelectedMenuItemName(selectedItem.name);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "video"): Promise<void> => {
    if (!event.target.files?.[0]) return;
    const file = event.target.files[0];
    
    // Check file size (7MB max)
    if (file.size > 7 * 1024 * 1024) {
      setErrorMessage("File size exceeds 7MB limit");
      return;
    }
    
    setIsUploading(true);
    setErrorMessage("");
    
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
      if (data.url) {
        if (type === "image") {
          setImageUrl(data.url);
        } else {
          setVideoUrl(data.url);
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setErrorMessage("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Validate restaurant selection
    if (!selectedRestaurantId && !selectedRestaurantName) {
      setErrorMessage("Please select a restaurant");
      return;
    }
    
    // Validate review content
    if (!content.trim()) {
      setErrorMessage("Please provide a review description");
      return;
    }
    
    if (content.length < 10) {
      setErrorMessage("Review must be at least 10 characters long");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      const reviewData: {
        restaurantId?: string;
        restaurant?: string;
        menuItemId?: string;
        menuItem?: string;
        content: string;
        rating: number;
        asExpected: number;
        wouldRecommend: number;
        valueForMoney: number;
        imageUrl?: string;
        videoUrl?: string;
        latitude?: number;
        longitude?: number;
      } = {
        content,
        rating,
        asExpected,
        wouldRecommend,
        valueForMoney
      };
      
      // Add restaurant info (prefer ID if available)
      if (selectedRestaurantId) {
        reviewData.restaurantId = selectedRestaurantId;
      } else if (selectedRestaurantName) {
        reviewData.restaurant = selectedRestaurantName;
      }
      
      // Add menu item info if available
      if (selectedMenuItemId) {
        reviewData.menuItemId = selectedMenuItemId;
      } else if (selectedMenuItemName) {
        reviewData.menuItem = selectedMenuItemName;
      }
      
      // Add media URLs if available
      if (imageUrl) {
        reviewData.imageUrl = imageUrl;
      }
      
      if (videoUrl) {
        reviewData.videoUrl = videoUrl;
      }
      
      // Add location if user has permitted it
      if (includeLocation && location.coordinates) {
        reviewData.latitude = location.coordinates.latitude;
        reviewData.longitude = location.coordinates.longitude;
      }
      
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
        credentials: "include", // Include cookies for auth
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to submit review");
      }
      
      const data = await response.json();
      console.log("Review submission response:", data);
      
      setSuccessMessage("Review submitted successfully!");
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after successful submission
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error submitting review:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to render star ratings for different criteria
  const renderStars = (type: RatingType, value: number, onChange: (value: number) => void): JSX.Element => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="text-2xl focus:outline-none transition-colors"
            aria-label={`Rate ${star} out of 5 stars`}
          >
            <span className={`${value >= star ? "text-yellow-400" : "text-gray-200"} hover:scale-110`}>
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  // Check for authentication
  if (status === "unauthenticated") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div 
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Write a Review</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md mb-6">
              <p className="font-semibold">Please log in to submit a review</p>
              <p className="mt-2">You need to be logged in to share your experience.</p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Write a Review</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
          
          <p className="text-gray-600 mb-4">
            Share your experience at this restaurant
          </p>
          
          <form onSubmit={handleSubmit}>
            {/* Restaurant Search */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Restaurant
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  placeholder="Search for restaurants..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  disabled={!!effectiveRestaurantId}
                  required
                />
                
                {isSearching ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-5 w-5 border-2 border-yellow-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : (
                  <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                )}
                
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchResults
                      .filter(result => result.type === "Restaurant")
                      .map(result => (
                        <div
                          key={result.id}
                          className="px-4 py-2 hover:bg-yellow-50 cursor-pointer"
                          onClick={() => handleRestaurantSelect(result)}
                        >
                          {result.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Menu Item Selection */}
            {selectedRestaurantId && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Menu Item (Optional)
                </label>
                <select
                  value={selectedMenuItemId}
                  onChange={handleMenuItemSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  disabled={isLoadingMenuItems || !!effectiveMenuItemId}
                >
                  <option value="">Select a menu item</option>
                  {menuItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.category ? `(${item.category})` : ''} {item.price ? `- ${item.price}` : ''}
                    </option>
                  ))}
                </select>
                {isLoadingMenuItems && <p className="text-sm text-gray-500 mt-1">Loading menu items...</p>}
              </div>
            )}
            
            {/* Overall Rating */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Rating
              </label>
              {renderStars("rating", rating, setRating)}
              <p className="text-sm text-gray-500 mt-1">
                Click on a star to rate
              </p>
            </div>
            
            {/* Review Text */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Your Review
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share details of your experience at this restaurant..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 h-32"
                maxLength={500}
                required
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{characterCount < 10 ? (
                  <span className="text-red-500">{characterCount} (minimum 10)</span>
                ) : characterCount}</span>
                <span>/500 characters</span>
              </div>
            </div>
            
            {/* Toggle for Simple/Detailed Mode */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setIsSimpleMode(!isSimpleMode)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                {isSimpleMode ? "Show More Options" : "Show Fewer Options"}
              </button>
            </div>
            
            {/* Additional Options (Hidden in Simple Mode) */}
            {!isSimpleMode && (
              <div className="border-t pt-4 mt-2">
                {/* Detailed Ratings */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">Detailed Ratings</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Was it as expected?</label>
                      {renderStars("asExpected", asExpected, setAsExpected)}
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Would you recommend it?</label>
                      {renderStars("wouldRecommend", wouldRecommend, setWouldRecommend)}
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Value for money</label>
                      {renderStars("valueForMoney", valueForMoney, setValueForMoney)}
                    </div>
                  </div>
                </div>
                
                {/* Media Uploads */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">Add Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Image Upload */}
                    <div>
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-yellow-400 transition-colors">
                        {!imageUrl ? (
                          <>
                            <div className="flex justify-center mb-2">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                <Upload size={20} />
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">Upload image</p>
                            <p className="text-xs text-gray-400">Max 7MB</p>
                            <input 
                              type="file"
                              ref={imageUploadRef}
                              accept="image/*"
                              onChange={(e) => handleUpload(e, "image")}
                              className="hidden"
                              disabled={isUploading}
                            />
                            <button
                              type="button"
                              onClick={() => imageUploadRef.current?.click()}
                              className="mt-2 px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                              disabled={isUploading}
                            >
                              {isUploading ? "Uploading..." : "Select Image"}
                            </button>
                          </>
                        ) : (
                          <div className="relative">
                            <img 
                              src={imageUrl} 
                              alt="Preview" 
                              className="max-h-24 mx-auto object-contain rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => setImageUrl(null)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Video Upload */}
                    <div>
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-yellow-400 transition-colors">
                        {!videoUrl ? (
                          <>
                            <div className="flex justify-center mb-2">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                <Upload size={20} />
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">Upload video</p>
                            <p className="text-xs text-gray-400">Max 7MB</p>
                            <input 
                              type="file"
                              ref={videoUploadRef}
                              accept="video/*"
                              onChange={(e) => handleUpload(e, "video")}
                              className="hidden"
                              disabled={isUploading}
                            />
                            <button
                              type="button"
                              onClick={() => videoUploadRef.current?.click()}
                              className="mt-2 px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                              disabled={isUploading}
                            >
                              {isUploading ? "Uploading..." : "Select Video"}
                            </button>
                          </>
                        ) : (
                          <div className="relative">
                            <video 
                              src={videoUrl} 
                              controls 
                              className="max-h-24 mx-auto rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => setVideoUrl(null)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                              aria-label="Remove video"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Location Permission */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                    <input
                      type="checkbox"
                      id="include-location"
                      checked={includeLocation}
                      onChange={(e) => setIncludeLocation(e.target.checked)}
                      className="w-4 h-4 text-yellow-400 rounded focus:ring-2 focus:ring-yellow-400"
                    />
                    <div>
                      <label htmlFor="include-location" className="text-gray-700 font-medium cursor-pointer">
                        Include my location
                      </label>
                      <p className="text-sm text-gray-500">
                        {location.loading 
                          ? "Getting your location..." 
                          : location.error 
                            ? `Location error: ${location.error}` 
                            : location.address 
                              ? <span className="flex items-center"><MapPin size={14} className="mr-1" /> {location.address}</span> 
                              : "Add your location to the review"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error/Success Messages */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                {successMessage}
              </div>
            )}
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || content.length < 10 || isUploading || (!selectedRestaurantId && !selectedRestaurantName)}
                className="px-6 py-2 bg-yellow-400 text-white rounded-md hover:bg-yellow-500 focus:outline-none disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedReviewModal;