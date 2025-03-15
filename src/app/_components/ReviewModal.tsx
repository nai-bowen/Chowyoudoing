/*eslint-disable */
"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useGeolocation } from "../../lib/locationService";

interface Patron {
  firstName: string;
  lastName: string;
}

interface Review {
  id?: string;
  content: string;
  rating: number;
  imageUrl?: string;
  patron?: Patron;
  reviewStandards?: string;
  date?: string;
  asExpected?: number;
  wouldRecommend?: number;
  valueForMoney?: number;
  upvotes?: number;
  userVote?: {
    isUpvote: boolean;
  };
}

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  menuItemId?: string;
  menuItemName?: string;
  onVoteUpdate?: (reviewId: string, newUpvotes: number, isUpvoted: boolean | null) => void;
}

interface ReadReviewModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
  onVoteUpdate?: (reviewId: string, newUpvotes: number, isUpvoted: boolean | null) => void;
}

// New interface for vote states
interface VoteState {
  upvoted: boolean;
  downvoted: boolean;
}

type ReviewModalProps = WriteReviewModalProps | ReadReviewModalProps;

const ReviewModal: React.FC<ReviewModalProps> = (props) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Determine if this is a read or write modal
  const isReadMode = 'review' in props;
  
  // States for write mode
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>("");
  const [asExpected, setAsExpected] = useState<number>(5);
  const [wouldRecommend, setWouldRecommend] = useState<number>(5);
  const [valueForMoney, setValueForMoney] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [includeLocation, setIncludeLocation] = useState<boolean>(false);
  
  // New states for votes
  const [voteState, setVoteState] = useState<VoteState>({ upvoted: false, downvoted: false });
  const [voteCount, setVoteCount] = useState<number>(0);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [voteError, setVoteError] = useState<string>("");
  
  const location = useGeolocation();

  useEffect(() => {
    if (isReadMode) { 
      const readProps = props as ReadReviewModalProps;
      
      // Log the exact review data we're receiving
      console.log("DEBUGGING - Review modal opened with review:", JSON.stringify(readProps.review, null, 2));
      console.log("DEBUGGING - Upvotes value:", readProps.review.upvotes);
      console.log("DEBUGGING - Upvotes type:", typeof readProps.review.upvotes);
      
      // Force upvotes to be a number (cover all bases)
      let upvotesValue = 0;
      if (typeof readProps.review.upvotes === 'number') {
        upvotesValue = readProps.review.upvotes;
      } else if (readProps.review.upvotes) {
        upvotesValue = Number(readProps.review.upvotes);
      }
      
      console.log("DEBUGGING - Computed upvotes value:", upvotesValue);
      setVoteCount(upvotesValue);
  
      if (readProps.review.userVote) {
        setVoteState({
          upvoted: readProps.review.userVote.isUpvote,
          downvoted: !readProps.review.userVote.isUpvote
        });
      } else {
        setVoteState({ upvoted: false, downvoted: false });
      }
    }
  }, [props]); 
  
  useEffect(() => {
    // Handle click outside to close modal
    function handleClickOutside(event: MouseEvent): void {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        props.onClose();
      }
    }

    // Handle ESC key to close modal
    function handleEscKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        props.onClose();
      }
    }

    if (props.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      
      // Reset form when modal is opened in write mode
      if (!isReadMode) {
        setRating(5);
        setContent("");
        setAsExpected(5);
        setWouldRecommend(5);
        setValueForMoney(5);
        setIncludeLocation(false);
        setErrorMessage("");
        setSuccessMessage("");
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [props.isOpen, props.onClose, isReadMode]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    if (isReadMode) return;
    
    e.preventDefault();
    
    const writeProps = props as WriteReviewModalProps;
    
    if (!content.trim()) {
      setErrorMessage("Please provide a review description");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      const reviewData: {
        restaurantId: string;
        menuItemId?: string;
        content: string;
        rating: number;
        asExpected: number;
        wouldRecommend: number;
        valueForMoney: number;
        latitude?: number;
        longitude?: number;
      } = {
        restaurantId: writeProps.restaurantId,
        content,
        rating,
        asExpected,
        wouldRecommend,
        valueForMoney
      };
      
      // Add menuItemId if provided
      if (writeProps.menuItemId) {
        reviewData.menuItemId = writeProps.menuItemId;
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
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }
      
      setSuccessMessage("Review submitted successfully!");
      
      // Close modal after successful submission
      setTimeout(() => {
        writeProps.onClose();
        // Refresh the page to show the new review
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error submitting review:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle voting for a review - IMMEDIATE UI UPDATE APPROACH
  const handleVote = async (isUpvote: boolean): Promise<void> => {
    if (!isReadMode) return;
    
    const readProps = props as ReadReviewModalProps;
    if (!readProps.review.id) return;
    
    setIsVoting(true);
    setVoteError("");
    
    // Determine vote action based on current state
    let voteAction: 'upvote' | 'downvote' | 'cancel-upvote' | 'cancel-downvote';
    
    if (isUpvote) {
      voteAction = voteState.upvoted ? 'cancel-upvote' : 'upvote';
    } else {
      voteAction = voteState.downvoted ? 'cancel-downvote' : 'downvote';
    }
    
    console.log(`Sending vote action: ${voteAction}`);
    
    // IMMEDIATELY update the UI before waiting for the API response
    let newVoteCount = voteCount;
    let newVoteState = { ...voteState };
    let newIsUpvoted: boolean | null = null;

    // Calculate the new vote count and state based on action
    switch(voteAction) {
      case 'upvote':
        if (!voteState.upvoted) {
          if (voteState.downvoted) {
            // Switching from downvote to upvote (+2)
            newVoteCount += 2;
          } else {
            // New upvote (+1)
            newVoteCount += 1;
          }
          newVoteState = { upvoted: true, downvoted: false };
          newIsUpvoted = true;
        }
        break;
      case 'downvote':
        if (!voteState.downvoted) {
          if (voteState.upvoted) {
            // Switching from upvote to downvote (-2)
            newVoteCount = Math.max(0, newVoteCount - 2);
          } else {
            // New downvote (-1)
            newVoteCount = Math.max(0, newVoteCount - 1);
          }
          newVoteState = { upvoted: false, downvoted: true };
          newIsUpvoted = false;
        }
        break;
      case 'cancel-upvote':
        if (voteState.upvoted) {
          // Remove upvote (-1)
          newVoteCount = Math.max(0, newVoteCount - 1);
          newVoteState = { upvoted: false, downvoted: false };
          newIsUpvoted = null;
        }
        break;
      case 'cancel-downvote':
        if (voteState.downvoted) {
          // Remove downvote (+1)
          newVoteCount += 1;
          newVoteState = { upvoted: false, downvoted: false };
          newIsUpvoted = null;
        }
        break;
    }

    // Update UI immediately
    setVoteCount(newVoteCount);
    setVoteState(newVoteState);
    
    // Call the onVoteUpdate callback if provided to update the parent component
    if (readProps.onVoteUpdate && readProps.review.id) {
      readProps.onVoteUpdate(readProps.review.id, newVoteCount, newIsUpvoted);
    }

    // Now make the API call in the background
    try {
      const response = await fetch(`/api/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({
          reviewId: readProps.review.id,
          action: voteAction
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to vote");
      }
      
      const data = await response.json();
      console.log("Vote response from server:", data);

      // In case the server response has a different count than what we calculated,
      // update with the server value (but only if there's a discrepancy)
      const serverUpvotes = data.upvotes || 0;
      if (serverUpvotes !== newVoteCount) {
        console.log(`Correcting vote count from ${newVoteCount} to server value ${serverUpvotes}`);
        setVoteCount(serverUpvotes);
        
        // Also update parent component if there's a discrepancy
        if (readProps.onVoteUpdate && readProps.review.id) {
          readProps.onVoteUpdate(readProps.review.id, serverUpvotes, newIsUpvoted);
        }
      }
      
    } catch (error) {
      console.error("Error voting for review:", error);
      setVoteError(error instanceof Error ? error.message : "An unexpected error occurred");
      
      // Revert to original state on error
      setVoteCount(voteCount);
      setVoteState(voteState);
    } finally {
      setIsVoting(false);
    }
  };

  // Helper function to render star ratings
  const renderStars = (value: number, readOnly: boolean = false, onClick?: (value: number) => void): JSX.Element => {
    return (
      <div className={`stars-container ${readOnly ? 'text-2xl' : ''}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${value >= star ? (readOnly ? "text-yellow-400" : "filled") : (readOnly ? "text-gray-300" : "")}`}
            onClick={() => onClick && onClick(star)}
            style={{ cursor: readOnly ? 'default' : 'pointer' }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (!props.isOpen) return null;

  // Render read-only review modal
  if (isReadMode) {
    const readProps = props as ReadReviewModalProps;
    const { review } = readProps;
    
    // Add debugging for display value
    console.log("DEBUGGING - About to render upvotes with value:", voteCount);
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 review-modal-overlay">
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto review-modal"
        >
          <div className="p-6 review-modal-body">
            <div className="flex justify-between items-center mb-4 review-modal-header">
              <h2 className="text-2xl font-bold text-[#D29501]">Review Details</h2>
              <button
                onClick={readProps.onClose}
                className="text-gray-500 hover:text-gray-700 close-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              {renderStars(review.rating, true)}
              {review.date && (
                <p className="text-sm text-gray-500 mt-1">{review.date}</p>
              )}
            </div>

            <div className="mb-6">
              <p className="text-lg italic mb-4">"{review.content}"</p>
              <p className="text-right font-semibold text-[#A90D3C]">
                - {review.patron?.firstName || "Anonymous"} {review.patron?.lastName || ""}
              </p>
            </div>

            {/* Vote buttons - using the local state value directly */}
            <div className="vote-buttons flex items-center gap-4 mb-6">
              <button
                onClick={() => handleVote(true)}
                disabled={isVoting}
                className={`vote-button p-2 rounded-full ${voteState.upvoted ? 'bg-green-100' : 'hover:bg-gray-100'}`}
                aria-label="Upvote"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={voteState.upvoted ? "#10B981" : "currentColor"}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              {/* Display the vote count directly from local state */}
              <span className="vote-count font-semibold">{voteCount}</span>
              <button
                onClick={() => handleVote(false)}
                disabled={isVoting}
                className={`vote-button p-2 rounded-full ${voteState.downvoted ? 'bg-red-100' : 'hover:bg-gray-100'}`}
                aria-label="Downvote"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={voteState.downvoted ? "#EF4444" : "currentColor"}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isVoting && <span className="text-sm text-gray-500 ml-2">Processing...</span>}
            </div>
            {voteError && <div className="vote-error p-3 bg-red-100 text-red-700 rounded-lg mb-4">{voteError}</div>}

            {review.imageUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Photos</h3>
                <div className="relative h-64 w-full">
                  <Image
                    src={review.imageUrl}
                    alt="Review image"
                    className="rounded-lg object-cover"
                    fill
                  />
                </div>
              </div>
            )}

            {/* Additional rating criteria */}
            {(review.asExpected !== undefined || review.wouldRecommend !== undefined || review.valueForMoney !== undefined) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Detailed Ratings</h3>
                
                {review.asExpected !== undefined && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-700">As Expected:</p>
                    {renderStars(review.asExpected, true)}
                  </div>
                )}
                
                {review.wouldRecommend !== undefined && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-700">Would Recommend:</p>
                    {renderStars(review.wouldRecommend, true)}
                  </div>
                )}
                
                {review.valueForMoney !== undefined && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-700">Value for Money:</p>
                    {renderStars(review.valueForMoney, true)}
                  </div>
                )}
              </div>
            )}

            {review.reviewStandards && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Review Standards</h3>
                <p className="text-gray-700">{review.reviewStandards}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render write review modal
  const writeProps = props as WriteReviewModalProps;
  
  return (
    <div className="review-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div ref={modalRef} className="review-modal bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="review-modal-header p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#D29501]">Write a Review</h2>
            <button className="text-gray-500 hover:text-gray-700 close-button" onClick={writeProps.onClose}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="review-modal-body p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{writeProps.restaurantName}</h3>
          {writeProps.menuItemName && <p className="menu-item-name text-gray-600 mb-4">{writeProps.menuItemName}</p>}
          
          <form onSubmit={handleSubmit}>
            <div className="rating-section mb-6">
              <label className="block text-gray-700 mb-2">Overall Rating</label>
              {renderStars(rating, false, setRating)}
            </div>
            
            <div className="review-textarea mb-6">
              <label htmlFor="review-content" className="block text-gray-700 mb-2">Your Review</label>
              <textarea
                id="review-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D29501]"
                placeholder="Share your experience with this restaurant..."
                required
              />
            </div>
            
            <div className="rating-section mb-6">
              <label className="block text-gray-700 mb-2">Was it as expected?</label>
              {renderStars(asExpected, false, setAsExpected)}
            </div>
            
            <div className="rating-section mb-6">
              <label className="block text-gray-700 mb-2">Would you recommend it?</label>
              {renderStars(wouldRecommend, false, setWouldRecommend)}
            </div>
            
            <div className="rating-section mb-6">
              <label className="block text-gray-700 mb-2">Value for money</label>
              {renderStars(valueForMoney, false, setValueForMoney)}
            </div>
            
            {/* Location Permission */}
            <div className="location-permission mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-2 checkbox-container mb-2">
                <input
                  type="checkbox"
                  checked={includeLocation}
                  onChange={(e) => setIncludeLocation(e.target.checked)}
                  className="w-4 h-4 text-[#D29501] rounded focus:ring-[#D29501]"
                />
                <span className="text-gray-700">Include my current location with this review</span>
              </label>
              <p className="location-note text-sm text-gray-600">
                {location.loading 
                  ? "Getting your location..." 
                  : location.error 
                    ? `Location error: ${location.error}` 
                    : location.address 
                      ? `Your location: ${location.address}` 
                      : "Enable to show your review on the map"}
              </p>
            </div>
            
            {errorMessage && <div className="error-message p-3 bg-red-100 text-red-700 rounded-lg mb-4">{errorMessage}</div>}
            {successMessage && <div className="success-message p-3 bg-green-100 text-green-700 rounded-lg mb-4">{successMessage}</div>}
            
            <div className="modal-buttons flex justify-end gap-4">
              <button 
                type="button" 
                className="cancel-button px-5 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                onClick={writeProps.onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button px-5 py-2 bg-[#D29501] text-white rounded-lg hover:bg-[#b37e01] disabled:opacity-50"
                disabled={isSubmitting}
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

export default ReviewModal;