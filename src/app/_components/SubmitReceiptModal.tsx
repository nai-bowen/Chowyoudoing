// src/app/_components/SubmitReceiptModal.tsx
"use client";

import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faReceipt, 
  faCloudUploadAlt, 
  faSpinner, 
  faCheckCircle, 
  faExclamationCircle 
} from "@fortawesome/free-solid-svg-icons";

interface Review {
  id: string;
  restaurant?: string;
  restaurantId?: string;
  date?: string;
}

interface SubmitReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
}

export default function SubmitReceiptModal({
  isOpen,
  onClose,
  review
}: SubmitReceiptModalProps): JSX.Element | null {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear any previous errors
    setError(null);
    
    // Check file size (max 7MB)
    if (file.size > 7 * 1024 * 1024) {
      setError("File size exceeds 7MB limit");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Create a form data object to send the file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Upload to Cloudinary through our API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload receipt");
      }

      const data = await response.json();
      setUploadProgress(100);
      setReceiptImage(data.url);
    } catch (err) {
      console.error("Error uploading receipt:", err);
      setError(err instanceof Error ? err.message : "Failed to upload receipt");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!receiptImage) {
      setError("Please upload a receipt image");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/patron/receipt-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId: review.id,
          restaurantId: review.restaurantId,
          receiptImage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit receipt verification");
      }

      setSuccess(true);
      
      // Close modal after short delay on success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error submitting receipt verification:", err);
      setError(err instanceof Error ? err.message : "Failed to submit receipt verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileInput = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#faf2e5] px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <FontAwesomeIcon icon={faReceipt} className="mr-2 text-[#f2d36e]" />
            Verify with Receipt
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isUploading || isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verification Submitted!</h3>
              <p className="text-gray-600">
                Your receipt has been submitted for verification. We'll review it and update your review status.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Upload a receipt to verify your review for <strong>{review.restaurant}</strong> {review.date && <span>from {review.date}</span>}.
                </p>
                
                <p className="text-sm text-gray-500 mb-4">
                  Verified reviews are given more prominence and help establish credibility with other users.
                </p>
              </div>
              
              {/* Upload area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center transition-colors ${
                  error ? 'border-red-300 bg-red-50' : 
                  receiptImage ? 'border-green-300 bg-green-50' : 
                  'border-gray-300 hover:border-[#f2d36e] hover:bg-[#faf2e5]/30'
                }`}
                onClick={!isUploading && !receiptImage ? triggerFileInput : undefined}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                
                {isUploading ? (
                  <div className="py-4">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#f2d36e] text-2xl mb-2" />
                    <p className="text-gray-600">Uploading receipt...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div 
                        className="bg-[#f2d36e] h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : receiptImage ? (
                  <div className="py-4">
                    <div className="relative w-40 h-40 mx-auto mb-2">
                      <img 
                        src={receiptImage} 
                        alt="Receipt" 
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                    <p className="text-green-600 flex items-center justify-center gap-2">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      Receipt uploaded successfully
                    </p>
                    <button 
                      type="button" 
                      className="text-sm text-blue-600 hover:underline mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReceiptImage(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      Upload a different receipt
                    </button>
                  </div>
                ) : (
                  <div className="py-8 cursor-pointer">
                    <FontAwesomeIcon icon={faCloudUploadAlt} className="text-gray-400 text-4xl mb-2" />
                    <p className="text-gray-600">Click to upload your receipt</p>
                    <p className="text-xs text-gray-500 mt-1">JPEG, PNG or GIF (max 7MB)</p>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 p-3 rounded-lg text-red-600 mb-4 flex items-start">
                  <FontAwesomeIcon icon={faExclamationCircle} className="mt-1 mr-2 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-[#f2d36e] text-white rounded-lg hover:bg-[#e6c860] transition-colors disabled:opacity-70 disabled:hover:bg-[#f2d36e]"
                  disabled={!receiptImage || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}