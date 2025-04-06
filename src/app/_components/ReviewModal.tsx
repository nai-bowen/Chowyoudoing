/*eslint-disable*/
"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useGeolocation } from "../../lib/locationService";
import { X, ChevronUp, ChevronDown, Image as ImageIcon } from "lucide-react";
import PatronProfileModal from "./PatronProfileModal";

interface Patron {
  id: string;
  firstName: string;
  lastName: string;
}

// In ReviewModal.tsx
interface Review {
  id?: string;
  content: string;
  rating: number;
  imageUrl?: string | null;
  patron?: {
    id: string; // This is where it actually is
    firstName: string;
    lastName: string;
  };
  // patronId might not be directly on the review object
  patronId?: string;
  reviewStandards?: string;
  date?: string;
  asExpected?: number;
  wouldRecommend?: number;
  valueForMoney?: number;
  upvotes?: number;
  isAnonymous?: boolean; 
  userVote?: {
    isUpvote: boolean;
  };
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

type ReviewModalProps = ReadReviewModalProps;

const ReviewModal: React.FC<ReviewModalProps> = (props) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Determine if this is a read mode
  const isReadMode = 'review' in props && !('onReviewUpdate' in props);
  
  // States for votes
  const [voteState, setVoteState] = useState<VoteState>({ upvoted: false, downvoted: false });
  const [voteCount, setVoteCount] = useState<number>(0);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [voteError, setVoteError] = useState<string>("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Handle vote state and count initialization for read mode
  useEffect(() => {
    if (isReadMode) { 
      const readProps = props as ReadReviewModalProps;
      
      // Force upvotes to be a number (cover all bases)
      let upvotesValue = 0;
      if (typeof readProps.review.upvotes === 'number') {
        upvotesValue = readProps.review.upvotes;
      } else if (readProps.review.upvotes) {
        upvotesValue = Number(readProps.review.upvotes);
      }
      
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
  }, [isReadMode, props]); 
  
  useEffect(() => {
    if (isReadMode) {
      const readProps = props as ReadReviewModalProps;
      console.log("Review object:", readProps.review);
      console.log("Patron data:", readProps.review.patron);
      console.log("PatronId sources:", {
        directPatronId: readProps.review.patronId,
        nestedPatronId: readProps.review.patron?.id
      });
    }
  }, [props, isReadMode]);
  
  // Add this to debug when profile modal state changes
  useEffect(() => {
    console.log("Profile modal state changed:", {
      isOpen: isProfileModalOpen,
      review: (props as ReadReviewModalProps).review
    });
  }, [isProfileModalOpen, props]);
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
  const renderStars = (value: number): JSX.Element => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-2xl ${value >= star ? "text-yellow-400" : "text-gray-200"}`}
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
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Review Details</h2>
              <button
                onClick={readProps.onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              {renderStars(review.rating)}
              {review.date && (
                <p className="text-sm text-gray-500 mt-1">{review.date}</p>
              )}
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <p className="text-lg italic text-gray-700 mb-4">"{review.content}"</p>
              <p className="text-right font-medium text-gray-700">
                {review.isAnonymous ? (
                  // For anonymous reviews, just show "Anonymous" text
                  <span className="text-gray-700">Anonymous</span>
                ) : (
                  // For non-anonymous reviews, make the name clickable
                  review.patron ? (
                    <button 
                      onClick={() => {
                        const profileId = review.patron?.id || review.patronId;
                        console.log("Clicking patron name, patronId:", profileId);
                        setIsProfileModalOpen(true);
                      }}
                      className="hover:underline hover:text-[#8A0B31] transition-colors cursor-pointer"
                    >
                      {review.patron.firstName || "Anonymous"} {review.patron.lastName ? review.patron.lastName.charAt(0) + '.' : ''}
                    </button>
                  ) : (
                    // Fallback if patron data is missing but review is not anonymous
                    <span className="text-gray-700">Anonymous</span>
                  )
                )}
              </p>
            </div>

            {/* Vote buttons - using the local state value directly */}
            <div className="flex items-center gap-4 mb-6 justify-center">
              <button
                onClick={() => handleVote(true)}
                disabled={isVoting}
                className={`p-2 rounded-full ${voteState.upvoted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
                aria-label="Upvote"
              >
                <ChevronUp size={24} />
              </button>
              {/* Display the vote count directly from local state */}
              <span className="text-lg font-medium">{voteCount}</span>
              <button
                onClick={() => handleVote(false)}
                disabled={isVoting}
                className={`p-2 rounded-full ${voteState.downvoted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
                aria-label="Downvote"
              >
                <ChevronDown size={24} />
              </button>
              {isVoting && <span className="text-sm text-gray-500 ml-2">Processing...</span>}
            </div>
            
            {voteError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {voteError}
              </div>
            )}

            {review.imageUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  <span className="flex items-center">
                    <ImageIcon size={18} className="mr-2" />
                    Photo
                  </span>
                </h3>
                <div className="rounded-md overflow-hidden shadow-sm border border-gray-200">
                  <div className="relative h-64 w-full">
                    <Image
                      src={review.imageUrl}
                      alt="Review image"
                      className="object-cover"
                      fill
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional rating criteria */}
            {(review.asExpected !== undefined || review.wouldRecommend !== undefined || review.valueForMoney !== undefined) && (
              <div className="mb-6 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Detailed Ratings</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {review.asExpected !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Was it as expected?</p>
                      {renderStars(review.asExpected)}
                    </div>
                  )}
                  
                  {review.wouldRecommend !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Would you recommend it?</p>
                      {renderStars(review.wouldRecommend)}
                    </div>
                  )}
                  
                  {review.valueForMoney !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Value for money</p>
                      {renderStars(review.valueForMoney)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {review.reviewStandards && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Additional Notes</h3>
                <p className="text-gray-600">{review.reviewStandards}</p>
              </div>
            )}

            {/* Close button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={readProps.onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
       {/* This should check both possible locations */}
       {!review.isAnonymous && (review.patron?.id || review.patronId) && isProfileModalOpen && (
      <PatronProfileModal
        patronId={review.patron?.id || review.patronId!}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    )}
      </div>
      
    );
  }

  // This component only handles read mode now
  return null;
};


export default ReviewModal;