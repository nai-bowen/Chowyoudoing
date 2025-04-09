// src/app/_components/RestaurantConnectionModal.tsx
"use client";

import { useState, Fragment } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faTimes, faSpinner, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

interface Restaurant {
  id: string;
  title: string;
  location: string;
  category: string[] | string;
}

interface RestaurantConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  onSuccess: () => void;
}

export default function RestaurantConnectionModal({
  isOpen,
  onClose,
  restaurant,
  onSuccess
}: RestaurantConnectionModalProps): JSX.Element | null {
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch("/api/restaurateur/connection-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          message: message.trim() || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit connection request");
      }
      
      setSuccess(true);
      
      // Call the onSuccess callback
      onSuccess();
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error submitting connection request:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#faf2e5] px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <FontAwesomeIcon icon={faStore} className="mr-2 text-[#f2d36e]" />
            Request Restaurant Connection
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
                Your connection request has been submitted successfully!
              </div>
              <p className="text-gray-600">
                Our team will review your request and get back to you. You can check the status in the Connection Requests tab.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">{restaurant.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{restaurant.location}</p>
                  {Array.isArray(restaurant.category) && restaurant.category.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {restaurant.category.map((cat, i) => (
                        <span key={i} className="text-xs bg-white px-2 py-1 rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mt-4 mb-2">
                  Please provide information to verify your connection to this restaurant. For example, explain your role or provide details that will help us verify your association.
                </p>
              </div>
              
              <div className="mb-5">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Message (Optional)
                </label>
                <textarea
                  id="message"
                  placeholder="I am the manager of this restaurant location..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8] resize-none"
                />
              </div>
              
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
                  className="px-4 py-2 bg-[#dab9f8] text-white rounded-lg hover:bg-[#c9a2f2] disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Fragment>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Submitting...
                    </Fragment>
                  ) : "Submit Request"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}