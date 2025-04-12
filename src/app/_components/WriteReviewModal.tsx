/*eslint-disable*/
"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Upload, MapPin, Star, Search, EyeOff, Receipt } from "lucide-react";
import { useGeolocation } from "../../lib/locationService";
import { useSession } from "next-auth/react";
import SubmitReceiptModal from "@/app/_components/SubmitReceiptModal";

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
interface WriteReviewModalProps {
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

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
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
  
  // New state for anonymous reviews
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  
  // Processing states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [includeLocation, setIncludeLocation] = useState<boolean>(false);
  
  // New state for image prompt popup
  const [showImagePrompt, setShowImagePrompt] = useState<boolean>(false);
  
  // New state for receipt verification prompt
  const [showVerificationPrompt, setShowVerificationPrompt] = useState<boolean>(false);
  const [submittedReview, setSubmittedReview] = useState<{ id: string; restaurantId: string } | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  
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
      setIsAnonymous(false); // Reset anonymous flag
      setErrorMessage("");
      setSuccessMessage("");
      setIsSimpleMode(true);
      setIsSubmitting(false);
      setShowImagePrompt(false);
      // Reset verification states
      setShowVerificationPrompt(false);
      setSubmittedReview(null);
      setIsReceiptModalOpen(false);
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

  // Function to check if form is ready to submit but missing an image
  const handleSubmitClick = (e: React.FormEvent): void => {
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
    
    // If no image, show prompt instead of submitting
    if (!imageUrl) {
      setShowImagePrompt(true);
      return;
    }
    
    // Otherwise, proceed with submission
    handleSubmit();
  };

// Add this function to extract review data from various response formats
const extractReviewData = (data: any, fallbackRestaurantId: string): { reviewId: string | null; restaurantId: string | null } => {
  console.log("API Response type:", typeof data);
  console.log("API Response structure:", JSON.stringify(data, null, 2));
  
  let reviewId = null;
  let restaurantId = null;
  
  // Try all possible response structures
  if (data.review && data.review.id) {
    reviewId = data.review.id;
    restaurantId = data.review.restaurantId || fallbackRestaurantId;
  } else if (data.id) {
    reviewId = data.id;
    restaurantId = data.restaurantId || fallbackRestaurantId;
  } else if (data.data && data.data.review && data.data.review.id) {
    reviewId = data.data.review.id;
    restaurantId = data.data.review.restaurantId || fallbackRestaurantId;
  } else if (data.reviewId) {
    reviewId = data.reviewId;
    restaurantId = data.restaurantData?.id || fallbackRestaurantId;
  } else if (data.review && data.review._id) {
    reviewId = data.review._id;
    restaurantId = data.review.restaurant?.id || data.review.restaurantId || fallbackRestaurantId;
  } 
  
  // If no ID found, search recursively as a last resort
  if (!reviewId) {
    reviewId = findIdRecursively(data);
    if (!restaurantId) {
      restaurantId = findIdRecursively(data, 'restaurantId') || fallbackRestaurantId;
    }
  }
  
  console.log("Extracted review ID:", reviewId);
  console.log("Extracted restaurant ID:", restaurantId);
  
  return { reviewId, restaurantId };
};

// Helper function to find IDs recursively in complex objects
const findIdRecursively = (obj: any, key = 'id'): string | null => {
  if (!obj || typeof obj !== 'object') return null;
  
  // Check direct properties
  if (obj[key] !== undefined && obj[key] !== null) {
    return String(obj[key]);
  }
  
  // Check nested properties
  for (const prop in obj) {
    if (typeof obj[prop] === 'object' && obj[prop] !== null) {
      const found = findIdRecursively(obj[prop], key);
      if (found) return found;
    }
  }
  
  return null;
};

// Then update the handleSubmit function
const handleSubmit = async (): Promise<void> => {
  setIsSubmitting(true);
  setErrorMessage("");
  setShowImagePrompt(false);
  
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
      isAnonymous: boolean;
    } = {
      content,
      rating,
      asExpected,
      wouldRecommend,
      valueForMoney,
      isAnonymous
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
    
    // Use our robust extraction function to get the IDs
    const { reviewId, restaurantId } = extractReviewData(data, selectedRestaurantId);
    
    if (!reviewId) {
      // If we still can't get an ID, show success but skip verification
      console.warn("Could not determine review ID from response - skipping verification prompt");
      setSuccessMessage("Review submitted successfully!");
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
      return;
    }
    
    // Store the extracted review info for verification
    setSubmittedReview({
      id: reviewId,
      restaurantId: restaurantId || selectedRestaurantId
    });
    
    // Show the verification prompt
    setShowVerificationPrompt(true);
    
  } catch (error) {
    console.error("Error submitting review:", error);
    setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    setIsSubmitting(false);
  }
};

const handleReceiptModalClose = (): void => {
  setIsReceiptModalOpen(false);
  setSuccessMessage("Review submitted successfully!");
  setTimeout(() => {
    onClose();
    // Call success callback if provided
    if (onSuccess) {
      onSuccess();
    }
  }, 1000);
};

const handleVerificationResponse = (wantToVerify: boolean): void => {
  setShowVerificationPrompt(false);
  
  if (wantToVerify) {
    if (submittedReview && submittedReview.id && submittedReview.restaurantId) {
      // Open receipt modal only if we have valid data
      console.log("Opening receipt modal with:", submittedReview);
      setIsReceiptModalOpen(true);
    } else {
      console.error("Missing review data for verification:", submittedReview);
      setErrorMessage("Unable to verify review: Missing review information");
      
      // Still show success message for the review submission
      setSuccessMessage("Review submitted successfully!");
      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    }
  } else {
    // Just show success message and close
    setSuccessMessage("Review submitted successfully!");
    setTimeout(() => {
      onClose();
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    }, 2000);
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

  const handleImagePromptResponse = (addImage: boolean): void => {
    setShowImagePrompt(false);
    
    if (addImage) {
      // Focus on image upload
      if (imageUploadRef.current) {
        imageUploadRef.current.click();
      }
    } else {
      // Submit the review without an image
      handleSubmit();
    }
  };

  const handleContinue = (): void => {
    // Validate basic form fields
    if (!selectedRestaurantId && !selectedRestaurantName) {
      setErrorMessage("Please select a restaurant");
      return;
    }
    
    if (!content.trim() || content.length < 10) {
      setErrorMessage("Please provide a review description (at least 10 characters)");
      return;
    }

    // If valid, show detailed options
    setErrorMessage("");
    setIsSimpleMode(false);
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
          
          <form onSubmit={handleSubmitClick}>
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
            
            {/* Anonymous Review Option */}
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-yellow-500 rounded focus:ring-2 focus:ring-yellow-400"
                />
                <span className="flex items-center gap-1.5 text-gray-700">
                  <EyeOff size={16} className="text-gray-500" />
                  Post anonymously
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Your name won't be displayed with this review
              </p>
            </div>
            
            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {errorMessage}
              </div>
            )}
            
            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                {successMessage}
              </div>
            )}
            
            {/* Form Actions - Different based on mode */}
            {isSimpleMode ? (
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!content || content.length < 10 || !selectedRestaurantName}
                  className="px-6 py-2 bg-gradient-to-r from-[#f9c3c9] to-[#dab9f8] text-white rounded-md hover:from-[#f5b7ee] hover:to-[#c9a1f0] focus:outline-none disabled:opacity-50 transition-colors"
                >
                  Continue
                </button>
              </div>
            ) : (
              <div>
                {/* Additional Options (Hidden in Simple Mode) */}
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
                
                {/* Submit Button */}
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
                    className="px-6 py-2 bg-gradient-to-r from-[#f9c3c9] to-[#dab9f8] text-white rounded-md hover:from-[#f5b7ee] hover:to-[#c9a1f0] focus:outline-none disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </div>
            )}
          </form>
          
          {/* Image Prompt Popup */}
          {showImagePrompt && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
                <h2 className="text-2xl font-bold text-[#f5b7ee]">Add an Image?</h2>
                <p className="mt-4 text-gray-600">
                  We love reviews with images! They help other users get a better feel for the restaurant and food.
                </p>
                <div className="mt-6 flex justify-center space-x-4">
                  <button 
                    onClick={() => handleImagePromptResponse(false)}
                    className="px-6 py-2 bg-[#f9c3c9] text-white rounded-full hover:bg-[#f5b7ee] transition"
                  >
                    Submit Anyway
                  </button>
                  <button 
                    onClick={() => handleImagePromptResponse(true)}
                    className="px-6 py-2 bg-[#dab9f8] text-white rounded-full hover:bg-[#c9a1f0] transition"
                  >
                    Add an Image
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Verification Prompt Popup */}
          {showVerificationPrompt && submittedReview && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
                <div className="w-16 h-16 mx-auto bg-[#faf2e5] rounded-full flex items-center justify-center mb-4">
                  <Receipt size={28} className="text-[#f2d36e]" />
                </div>
                <h2 className="text-2xl font-bold text-[#f5b7ee]">Verify Your Review?</h2>
                <p className="mt-4 text-gray-600">
                  If you have a receipt, you can verify your review to make it more reliable for other users.
                  Verified reviews have better visibility and help build trust!
                </p>
                <div className="mt-6 flex justify-center space-x-4">
                  <button 
                    onClick={() => handleVerificationResponse(false)}
                    className="px-6 py-2 bg-[#f9c3c9] text-white rounded-full hover:bg-[#f5b7ee] transition"
                  >
                    No, Thanks
                  </button>
                  <button 
                    onClick={() => handleVerificationResponse(true)}
                    className="px-6 py-2 bg-[#dab9f8] text-white rounded-full hover:bg-[#c9a1f0] transition"
                  >
                    Yes, Verify
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Receipt Modal */}
          {isReceiptModalOpen && submittedReview && submittedReview.id && submittedReview.restaurantId && (
            <SubmitReceiptModal
              isOpen={isReceiptModalOpen}
              onClose={handleReceiptModalClose}
              review={{
                id: submittedReview.id,
                restaurantId: submittedReview.restaurantId,
                restaurant: selectedRestaurantName,
                date: new Date().toISOString()
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WriteReviewModal;