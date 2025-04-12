// src/app/_components/ReceiptVerificationModal.tsx
"use client";

import { useState, Fragment } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faSpinner, 
  faCheckCircle, 
  faTimesCircle, 
  faReceipt,
  faUser,
  faCalendarAlt,
  faUtensils,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";

interface Patron {
  id: string;
  firstName: string;
  lastName: string;
}

interface Review {
  id: string;
  content: string;
  rating: number;
  patron: Patron | null;
}

interface Restaurant {
  id: string;
  title: string;
}

interface ReceiptVerification {
  id: string;
  receiptImage: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewId: string | null;
  restaurantId: string;
  review: Review | null;
  restaurant: Restaurant;
}

interface ReceiptVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verification: ReceiptVerification;
  onStatusUpdate: (verificationId: string, status: "approved" | "rejected") => Promise<void>;
  isSubmitting: boolean;
}

export default function ReceiptVerificationModal({
  isOpen,
  onClose,
  verification,
  onStatusUpdate,
  isSubmitting
}: ReceiptVerificationModalProps): JSX.Element | null {
  const [rejectReason, setRejectReason] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleApprove = async (): Promise<void> => {
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      await onStatusUpdate(verification.id, "approved");
      setSuccessMessage("Receipt verification approved successfully");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to approve verification");
    }
  };

  const handleReject = async (): Promise<void> => {
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      await onStatusUpdate(verification.id, "rejected");
      setSuccessMessage("Receipt verification rejected");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to reject verification");
    }
  };

  const extractItems = (content: string): string[] => {
    // Simple extraction logic - improve as needed
    const items = content.split(',').map(item => item.trim());
    return items;
  };

  // Determine if we can show action buttons (only for pending verifications)
  const canShowActions = verification.status === "pending" && !isSubmitting && !successMessage;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#faf2e5] px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <FontAwesomeIcon icon={faReceipt} className="mr-2 text-[#f2d36e]" />
            Verification Request Details
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
          {/* User Info */}
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-[#faf2e5] flex items-center justify-center text-[#f2d36e] font-semibold mr-3">
              {verification.review?.patron ? 
                getInitials(verification.review.patron.firstName, verification.review.patron.lastName) : 
                "?"
              }
            </div>
            <div>
              <h3 className="font-semibold">
                {verification.review?.patron ? 
                  `${verification.review.patron.firstName} ${verification.review.patron.lastName}` : 
                  "Anonymous User"
                }
              </h3>
              <p className="text-sm text-gray-600 flex items-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-gray-400" />
                {formatDate(verification.submittedAt)}
              </p>
            </div>
            <div className="ml-auto">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                verification.status === "approved" ? "bg-green-100 text-green-800" :
                verification.status === "rejected" ? "bg-red-100 text-red-800" :
                "bg-yellow-100 text-yellow-800"
              }`}>
                <span className="capitalize">{verification.status}</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Receipt Details</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Restaurant:</p>
                <p className="text-sm text-gray-600">{verification.restaurant.title}</p>
              </div>
              
              {/* Items from the receipt or review */}
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-700">Items:</p>
                <div className="text-sm text-gray-600">
                  {verification.review?.content ? (
                    <ul>
                      {extractItems(verification.review.content).map((item, index) => (
                        <li key={index} className="ml-2">{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No items information available</p>
                  )}
                </div>
              </div>
              
              {/* Review Rating */}
              {verification.review?.rating && (
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Rating:</p>
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>
                        {star <= verification.review!.rating ? "★" : "☆"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Total Amount - Mock value for illustration */}
              <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                <p className="font-medium text-gray-700">Total Amount:</p>
                <p className="font-medium">$78.45</p>
              </div>
            </div>
          </div>
          
          {/* Receipt Image */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Receipt Image</h3>
            
            <div className="bg-gray-100 rounded-lg p-4 flex flex-col items-center justify-center h-48">
              {verification.receiptImage ? (
                <img
                  src={verification.receiptImage}
                  alt="Receipt"
                  className="max-h-full object-contain"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='%23ccc' d='M0 0h512v512H0z'/%3E%3Ctext x='50%25' y='50%25' font-size='24' text-anchor='middle' dominant-baseline='middle' fill='%23999'%3EReceipt Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              ) : (
                <>
                  <FontAwesomeIcon icon={faReceipt} className="text-gray-400 text-4xl mb-2" />
                  <p className="text-gray-500 text-sm">Receipt Image (Placeholder for actual image)</p>
                </>
              )}
            </div>
          </div>
          
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
              <p>{successMessage}</p>
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
              <p>{errorMessage}</p>
            </div>
          )}
          
          {/* Action Buttons */}
          {canShowActions && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Fragment>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Processing...
                  </Fragment>
                ) : (
                  <Fragment>
                    <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                    Reject
                  </Fragment>
                )}
              </button>
              
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Fragment>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Processing...
                  </Fragment>
                ) : (
                  <Fragment>
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    Approve
                  </Fragment>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}