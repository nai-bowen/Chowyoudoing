/*eslint-disable*/
"use client";

import { useState, Fragment } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFlag,
  faTimes,
  faSpinner,
  faExclamationCircle
} from "@fortawesome/free-solid-svg-icons";

interface Review {
  id: string;
  content: string;
  rating: number;
  createdAt?: string;
  restaurant?: string;
  patron?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  isAnonymous?: boolean;
}

interface FlagReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
  onSuccess: () => void;
}

export default function FlagReviewModal({
  isOpen,
  onClose,
  review,
  onSuccess
}: FlagReviewModalProps): JSX.Element | null {
  const [reason, setReason] = useState<string>("inappropriate");
  const [details, setDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch("/api/review/flag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId: review.id,
          reason,
          details: details.trim() || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to flag review");
      }
      
      setSuccess(true);
      
      // Call the onSuccess callback
      onSuccess();
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error flagging review:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const authorName = review.isAnonymous 
    ? "Anonymous" 
    : review.patron 
      ? `${review.patron.firstName} ${review.patron.lastName}`
      : "Unknown User";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#faf2e5] px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <FontAwesomeIcon icon={faFlag} className="mr-2 text-red-500" />
            Report Review
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
                Your report has been submitted successfully!
              </div>
              <p className="text-gray-600">
                Our team will review this report and take appropriate action. Thank you for helping to keep our community safe.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Review by {authorName}</h3>
                  {review.restaurant && (
                    <p className="text-sm text-gray-600 mb-2">{review.restaurant}</p>
                  )}
                  <p className="text-sm text-gray-700">{review.content.length > 150 ? `${review.content.substring(0, 150)}...` : review.content}</p>
                </div>
                
                <p className="text-sm text-gray-600 mt-4 mb-2">
                  Please select a reason for reporting this review:
                </p>
              </div>
              
              <div className="mb-5">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                >
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="misinformation">False or Misleading Information</option>
                  <option value="spam">Spam</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {reason === "other" && (
                <div className="mb-5">
                  <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
                    Please provide details
                  </label>
                  <textarea
                    id="details"
                    placeholder="Please explain why you are reporting this review..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8] resize-none"
                    required={reason === "other"}
                  />
                </div>
              )}
              
              {error && (
                <div className="mb-5 bg-red-50 text-red-700 p-3 rounded-lg flex items-start">
                  <FontAwesomeIcon icon={faExclamationCircle} className="mt-1 mr-2" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-70"
                  disabled={isSubmitting || (reason === "other" && !details.trim())}
                >
                  {isSubmitting ? (
                    <Fragment>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Submitting...
                    </Fragment>
                  ) : "Submit Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}