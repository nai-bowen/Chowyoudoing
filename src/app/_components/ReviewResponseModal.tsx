// src/app/_components/ReviewResponseModal.tsx
"use client";

import { useState, Fragment } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSpinner, faStar } from "@fortawesome/free-solid-svg-icons";

interface ReviewResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: {
    id: string;
    content: string;
    rating: number;
    createdAt: string;
    patron?: {
      firstName: string;
      lastName: string;
    } | null;
    isAnonymous: boolean;
    restaurantResponse: string | null;
  };
  onResponseSubmit: (reviewId: string, response: string) => Promise<void>;
}

export default function ReviewResponseModal({
  isOpen,
  onClose,
  review,
  onResponseSubmit
}: ReviewResponseModalProps): JSX.Element | null {
  const [response, setResponse] = useState<string>(review.restaurantResponse || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!response.trim()) {
      setError("Please enter a response");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onResponseSubmit(review.id, response.trim());
      setSuccess(true);
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error submitting response:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#faf2e5] px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Respond to {review.isAnonymous ? "Anonymous" : `${review.patron?.firstName} ${review.patron?.lastName}`}'s Review
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
                Your response has been submitted successfully!
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>
                        <FontAwesomeIcon 
                          icon={faStar} 
                          className={`${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                        />
                      </span>
                    ))}
                    <span className="ml-2 text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.content}</p>
                </div>
                
                <p className="text-sm text-gray-600 mt-4 mb-2">
                  Your response will be publicly visible to all users.
                </p>
              </div>
              
              <div className="mb-5">
                <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Response
                </label>
                <textarea
                  id="response"
                  placeholder="Type your response..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8] resize-none"
                  required
                />
              </div>
              
              {error && (
                <div className="mb-5 bg-red-50 text-red-700 p-3 rounded-lg">
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
                  className="px-4 py-2 bg-[#dab9f8] text-white rounded-lg hover:bg-[#c9a2f2] disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Fragment>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Submitting...
                    </Fragment>
                  ) : "Post Response"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}