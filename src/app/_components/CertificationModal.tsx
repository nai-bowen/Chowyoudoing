// /src/app/_components/CertificationModal.tsx
"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCheckCircle, faAward, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

interface CertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligibility: {
    eligible: boolean;
    automaticApproval: boolean;
    reviewCount: number;
    upvoteCount: number;
    isAlreadyCertified: boolean;
    hasPendingRequest: boolean;
    certificationRequest?: {
      id: string;
      status: string;
      createdAt: string;
    };
  };
  onSubmit: (data: { justification?: string; socialMediaLink?: string }) => Promise<void>;
}

const CertificationModal: React.FC<CertificationModalProps> = ({
  isOpen,
  onClose,
  eligibility,
  onSubmit
}) => {
  const [justification, setJustification] = useState<string>("");
  const [socialMediaLink, setSocialMediaLink] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit({
        justification: justification.trim() || undefined,
        socialMediaLink: socialMediaLink.trim() || undefined
      });
      // Success is handled by the parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during submission");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // For certified users, show a congratulations message
  if (eligibility.isAlreadyCertified) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#D29501] flex items-center">
              <FontAwesomeIcon icon={faAward} className="mr-2 text-yellow-500" />
              Certified Foodie
            </h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="text-center py-6">
            <div className="text-5xl text-green-500 mb-4">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Congratulations!</h3>
            <p className="text-gray-700 mb-4">
              You are already a certified foodie. Your reviews will be marked with a special badge to show your expertise.
            </p>
          </div>
          
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#D29501] text-white rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // For users with pending requests
  if (eligibility.hasPendingRequest) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#D29501] flex items-center">
              <FontAwesomeIcon icon={faAward} className="mr-2 text-yellow-500" />
              Certified Foodie
            </h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="text-center py-6">
            <div className="text-5xl text-yellow-500 mb-4">
              <FontAwesomeIcon icon={faExclamationCircle} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Request Pending</h3>
            <p className="text-gray-700 mb-4">
              You already have a pending certification request submitted on{" "}
              {eligibility.certificationRequest?.createdAt 
                ? new Date(eligibility.certificationRequest.createdAt).toLocaleDateString() 
                : "recently"}.
              Our team will review your request soon.
            </p>
          </div>
          
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#D29501] text-white rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#D29501] flex items-center">
            <FontAwesomeIcon icon={faAward} className="mr-2 text-yellow-500" />
            Become a Certified Foodie
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Certified foodies are recognized for their expertise and dedication to food reviews. 
            Their reviews will be marked with a special badge to show their credibility.
          </p>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Your Stats:</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <span className="text-gray-700 mr-2">Reviews:</span>
                <span className={`font-semibold ${eligibility.reviewCount >= 100 ? 'text-green-600' : 'text-gray-800'}`}>
                  {eligibility.reviewCount}/100
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-700 mr-2">Upvotes:</span>
                <span className={`font-semibold ${eligibility.upvoteCount >= 100 ? 'text-green-600' : 'text-gray-800'}`}>
                  {eligibility.upvoteCount}/100
                </span>
              </div>
            </div>
          </div>
          
          {eligibility.automaticApproval ? (
            <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4">
              <h3 className="font-semibold flex items-center mb-2">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                You meet the requirements!
              </h3>
              <p>
                Congratulations! You qualify for automatic certification. Click the button below to become a certified foodie.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">Dont meet the automatic requirements?</h3>
              <p>
                No problem! You can still apply for certification if you have a social media following
                or other qualifications that make you a food expert.
              </p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          {!eligibility.automaticApproval && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="justification">
                Why should you be a certified foodie? (Optional)
              </label>
              <textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D29501]"
                rows={4}
                placeholder="Tell us about your food expertise, experience, or social media following..."
              />
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="socialMedia">
              Social Media Link (Optional)
            </label>
            <input
              type="text"
              id="socialMedia"
              value={socialMediaLink}
              onChange={(e) => setSocialMediaLink(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D29501]"
              placeholder="https://instagram.com/your_foodie_account"
            />
          </div>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#D29501] text-white rounded-md hover:bg-[#b37e01]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : eligibility.automaticApproval 
                ? 'Become a Certified Foodie' 
                : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CertificationModal;