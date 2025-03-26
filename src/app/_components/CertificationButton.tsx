/*eslint-disable*/
"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward, faSpinner } from "@fortawesome/free-solid-svg-icons";
import CertificationModal from "./CertificationModal";

interface CertificationButtonProps {
  patronId: string;
  isCertifiedFoodie: boolean;
  onCertificationChange?: () => void;
}

interface CertificationEligibility {
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
}

const CertificationButton: React.FC<CertificationButtonProps> = ({
  patronId,
  isCertifiedFoodie,
  onCertificationChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [eligibility, setEligibility] = useState<CertificationEligibility | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch eligibility data when the button is clicked
  const fetchEligibility = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/profile/certification');
      if (!response.ok) {
        throw new Error("Failed to fetch certification eligibility");
      }
      const data = await response.json();
      setEligibility(data);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching certification eligibility:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle certification submission
  const handleSubmit = async (data: { justification?: string; socialMediaLink?: string }): Promise<void> => {
    try {
      const response = await fetch('/api/profile/certification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit certification request");
      }

      const result = await response.json();
      
      // Update eligibility or refetch it
      if (result.automaticApproval) {
        // If automatically approved, update the eligibility
        setEligibility(prev => prev ? {
          ...prev,
          isAlreadyCertified: true,
          hasPendingRequest: false
        } : null);
      } else {
        // If pending, update the eligibility
        setEligibility(prev => prev ? {
          ...prev,
          hasPendingRequest: true,
          certificationRequest: {
            id: 'new',
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        } : null);
      }
      
      // Notify parent component if needed
      if (onCertificationChange) {
        onCertificationChange();
      }
      
      // Close modal after a delay to show the updated status
      setTimeout(() => {
        setIsModalOpen(false);
      }, 3000);
    } catch (err) {
      console.error("Error submitting certification request:", err);
      throw err; // Re-throw for the modal to handle
    }
  };

  return (
    <>
      <button
        onClick={fetchEligibility}
        disabled={loading}
        className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
          isCertifiedFoodie
            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
            : "bg-[#D29501] text-white hover:bg-[#b37e01]"
        }`}
      >
        {loading ? (
          <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
        ) : (
          <FontAwesomeIcon icon={faAward} className="mr-2" />
        )}
        {isCertifiedFoodie
          ? "Certified Foodie"
          : "Become a Certified Foodie"}
      </button>
      
      {error && (
        <div className="mt-2 text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {eligibility && (
        <CertificationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eligibility={eligibility}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
};

export default CertificationButton;