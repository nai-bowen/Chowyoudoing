/*eslint-disable*/
"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Save, Trash2 } from "lucide-react";
import { useGeolocation } from "../../lib/locationService";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Patron {
  id: string;
  firstName: string;
  lastName: string;
}

interface Review {
  id: string;
  content: string;
  rating: number;
  asExpected: number;
  wouldRecommend: number;
  valueForMoney: number;
  imageUrl: string | null;
  videoUrl: string | null;
  date: string;
  restaurant: string;
  restaurantId: string;
  menuItemId?: string;
  menuItemName?: string;
  patron?: Patron;
}

interface EditReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  onSuccess?: () => void;
}

// Confirmation dialog component
interface ConfirmationDialogProps {
  isOpen: boolean;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmation</h3>
        <p className="mb-6 text-gray-700">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

type RatingType = "rating" | "asExpected" | "wouldRecommend" | "valueForMoney";

const EditReviewModal: React.FC<EditReviewModalProps> = ({
  isOpen,
  onClose,
  reviewId,
  onSuccess
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement | null>(null);
  
  // Review data state
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [content, setContent] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [asExpected, setAsExpected] = useState<number>(5);
  const [wouldRecommend, setWouldRecommend] = useState<number>(5);
  const [valueForMoney, setValueForMoney] = useState<number>(5);
  const [characterCount, setCharacterCount] = useState<number>(0);
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(true);

  // Processing states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);

  // Update character count when content changes
  useEffect(() => {
    setCharacterCount(content.length);
  }, [content]);

  // Fetch review data
  useEffect(() => {
    const fetchReviewData = async () => {
      if (!isOpen || !reviewId) return;
      
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/review/${reviewId}`);
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("You don't have permission to edit this review");
          } else {
            throw new Error("Failed to fetch review data");
          }
        }
        
        const data = await response.json();
        const reviewData = data.review as Review;
        
        setReview(reviewData);
        setContent(reviewData.content || "");
        setRating(reviewData.rating || 5);
        setAsExpected(reviewData.asExpected || 5);
        setWouldRecommend(reviewData.wouldRecommend || 5);
        setValueForMoney(reviewData.valueForMoney || 5);
      } catch (err) {
        console.error("Error fetching review data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && reviewId) {
      fetchReviewData();
    }
  }, [isOpen, reviewId]);

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
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle update form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!reviewId) {
      setErrorMessage("Review ID is missing");
      return;
    }
    
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
    setSuccessMessage("");
    
    try {
      const reviewData = {
        reviewId,
        content,
        rating,
        asExpected,
        wouldRecommend,
        valueForMoney
      };
      
      const response = await fetch(`/api/review/${reviewId}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });
      
      if (!response.ok) {
        // Try to parse the response for error messages
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update review");
        } catch (parseError) {
          throw new Error(`Server error: ${response.statusText || response.status}`);
        }
      }
      
      setSuccessMessage("Review updated successfully!");
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after successful submission
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error updating review:", err);
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete review
  const handleDeleteClick = (): void => {
    setShowDeleteConfirmation(true);
  };
  
  const cancelDeleteConfirmation = (): void => {
    setShowDeleteConfirmation(false);
  };
  
  const handleDeleteReview = async (): Promise<void> => {
    if (!reviewId) {
      setErrorMessage("Review ID is missing");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    setShowDeleteConfirmation(false);
    
    try {
      const response = await fetch(`/api/review/${reviewId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete review");
        } catch (parseError) {
          throw new Error(`Server error: ${response.statusText || response.status}`);
        }
      }
      
      setSuccessMessage("Review deleted successfully!");
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after successful submission
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error deleting review:", err);
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
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
              <h2 className="text-2xl font-bold text-gray-800">Edit Review</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md mb-6">
              <p className="font-semibold">Please log in to edit your review</p>
              <p className="mt-2">You need to be logged in to modify your review.</p>
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

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div 
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Edit Review</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-400"></div>
              <p className="ml-3">Loading review...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !review) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div 
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Edit Review</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
              <p className="font-semibold">Error</p>
              <p className="mt-2">{error || "Could not load review. The review may not exist or you don't have permission to edit it."}</p>
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

  // Main modal content
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Edit Review</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Restaurant and Menu Item Info */}
          <div className="mb-4">
            <h3 className="font-medium text-lg text-gray-800">{review.restaurant}</h3>
            {review.menuItemName && (
              <p className="text-gray-600">Menu Item: {review.menuItemName}</p>
            )}
            {review.date && (
              <p className="text-gray-500 text-sm">Posted on: {new Date(review.date).toLocaleDateString()}</p>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
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
                
                {/* Display image if available */}
                {review.imageUrl && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-700 mb-3">Your Image</h3>
                    <div className="relative h-48 w-full border rounded-md overflow-hidden">
                      <Image
                        src={review.imageUrl}
                        alt="Review image"
                        className="object-contain"
                        fill
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Images cannot be changed once uploaded.</p>
                  </div>
                )}
                
                {/* Display video if available */}
                {review.videoUrl && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-700 mb-3">Your Video</h3>
                    <div className="relative w-full rounded-md overflow-hidden">
                      <video 
                        src={review.videoUrl} 
                        controls 
                        className="w-full max-h-48"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Videos cannot be changed once uploaded.</p>
                  </div>
                )}
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
            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                onClick={handleDeleteClick}
                className="flex items-center px-4 py-2 text-red-500 border border-red-300 rounded-lg hover:bg-red-50"
                disabled={isSubmitting}
              >
                <Trash2 size={18} className="mr-2" />
                Delete
              </button>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg focus:outline-none"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || content.length < 10}
                  className="flex items-center px-6 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 focus:outline-none disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        message="Are you certain you want to delete your review? Deleted reviews cannot be retrieved."
        confirmText="Delete Review"
        cancelText="Cancel"
        onConfirm={handleDeleteReview}
        onCancel={cancelDeleteConfirmation}
      />
    </div>
  );
};

export default EditReviewModal;