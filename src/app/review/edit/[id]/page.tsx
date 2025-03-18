/*eslint-disable*/
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/app/_components/navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTrash, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

// Define types for review
interface Review {
  id: string;
  content: string;
  rating: number;
  asExpected: number;
  wouldRecommend: number;
  valueForMoney: number;
  imageUrl: string | null;
  date: string;
  restaurant: string;
  restaurantId: string;
  menuItemId?: string;
  menuItemName?: string;
  patron?: {
    id: string;
    firstName: string;
    lastName: string;
  };
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-[#D29501] mb-4">Confirmation</h3>
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

export default function EditReviewPage(): JSX.Element {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;
  
  // Review state
  const [review, setReview] = useState<Review | null>(null);
  const [content, setContent] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [asExpected, setAsExpected] = useState<number>(5);
  const [wouldRecommend, setWouldRecommend] = useState<number>(5);
  const [valueForMoney, setValueForMoney] = useState<number>(5);
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch review data
  useEffect(() => {
    const fetchReviewData = async () => {
      if (status !== "authenticated" || !reviewId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/review/${reviewId}`);
        
        if (!response.ok) {
          throw new Error(response.status === 403 
            ? "You don't have permission to edit this review" 
            : "Failed to fetch review data");
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
        setIsLoading(false);
      }
    };

    fetchReviewData();
  }, [reviewId, session, status]);

  // Handle update form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewId) {
      setError("Review ID is missing");
      return;
    }
    
    if (!content.trim()) {
      setError("Please provide a review description");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
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
      
      // Redirect back after a short delay
      setTimeout(() => {
        router.push("/patron-dashboard");
      }, 1500);
    } catch (err) {
      console.error("Error updating review:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete review functionality
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };
  
  const cancelDeleteConfirmation = () => {
    setShowDeleteConfirmation(false);
  };
  
  const handleDeleteReview = async () => {
    if (!reviewId) {
      setError("Review ID is missing");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
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
      
      // Redirect back after a short delay
      setTimeout(() => {
        router.push("/patron-dashboard");
      }, 1500);
    } catch (err) {
      console.error("Error deleting review:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render star ratings
  const renderStars = (value: number, onChange: (value: number) => void): JSX.Element => {
    return (
      <div className="stars-container flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star cursor-pointer text-2xl ${value >= star ? "text-yellow-400" : "text-gray-300"}`}
            onClick={() => onChange(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="with-navbar">
        <Navbar />
        <div className="page-content">
          <div className="flex justify-center items-center min-h-screen">
            <p className="text-xl">Loading review data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!review && !isLoading) {
    return (
      <div className="with-navbar">
        <Navbar />
        <div className="page-content">
          <div className="flex flex-col justify-center items-center min-h-screen">
            <p className="text-xl text-red-500">Review not found or you don't have permission to edit it.</p>
            <button 
              onClick={() => router.push("/patron-dashboard")}
              className="mt-4 px-4 py-2 bg-[#D29501] text-white rounded-lg"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="with-navbar">
      <Navbar />
      <div className="page-content">
        <div className="bg-[#FFF5E1] min-h-screen p-6">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#D29501]">Edit Your Review</h1>
              <button
                type="button"
                onClick={() => router.push("/patron-dashboard")}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Back to Dashboard
              </button>
            </div>
            
            {review && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{review.restaurant}</h2>
                {review.menuItemName && (
                  <p className="text-gray-600">Menu Item: {review.menuItemName}</p>
                )}
                <p className="text-gray-500 text-sm">Posted on: {review.date}</p>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
                {successMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rating-section mb-6">
                <label className="block text-gray-700 mb-2 font-medium">Overall Rating</label>
                {renderStars(rating, setRating)}
              </div>
              
              <div className="review-textarea mb-6">
                <label htmlFor="review-content" className="block text-gray-700 mb-2 font-medium">Your Review</label>
                <textarea
                  id="review-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D29501]"
                  placeholder="Share your experience with this restaurant..."
                  required
                />
                <div className="text-sm text-gray-500 mt-1">
                  <span className={`${content.length < 10 ? 'text-red-500' : 'text-green-500'}`}>
                    {content.length}
                  </span>/10 characters minimum
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rating-section">
                  <label className="block text-gray-700 mb-2 font-medium">As Expected</label>
                  {renderStars(asExpected, setAsExpected)}
                </div>
                
                <div className="rating-section">
                  <label className="block text-gray-700 mb-2 font-medium">Would Recommend</label>
                  {renderStars(wouldRecommend, setWouldRecommend)}
                </div>
                
                <div className="rating-section">
                  <label className="block text-gray-700 mb-2 font-medium">Value for Money</label>
                  {renderStars(valueForMoney, setValueForMoney)}
                </div>
              </div>
              
              {review?.imageUrl && (
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2 font-medium">Your Photo</label>
                  <div className="relative h-48 w-full max-w-md">
                    <Image
                      src={review.imageUrl}
                      alt="Review image"
                      className="rounded-lg object-cover"
                      fill
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">You cannot change the photo once uploaded.</p>
                </div>
              )}
              
              <div className="flex flex-wrap justify-between items-center">
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="flex items-center px-4 py-2 text-red-500 border border-red-300 rounded-lg hover:bg-red-50 mb-2 sm:mb-0"
                  disabled={isSubmitting}
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  Delete Review
                </button>
                
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => router.push("/patron-dashboard")}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#D29501] text-white rounded-lg hover:bg-[#b37e01] disabled:opacity-50"
                    disabled={isSubmitting || content.length < 10}
                  >
                    {isSubmitting ? "Saving..." : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
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
}