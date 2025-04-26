/*eslint-disable*/

"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faSpinner } from "@fortawesome/free-solid-svg-icons";

interface RedeemPremiumButtonProps {
  availableBonuses: number;
  onSuccess?: () => void;
  className?: string;
}

const RedeemPremiumButton: React.FC<RedeemPremiumButtonProps> = ({
  availableBonuses,
  onSuccess,
  className = ""
}) => {
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleRedeemClick = async (): Promise<void> => {
    if (availableBonuses <= 0) {
      setError("No premium bonuses available to redeem");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setIsRedeeming(true);
      setError(null);
      
      const response = await fetch("/api/restaurateur/redeem-premium", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to redeem premium month");
      }

      const data = await response.json();
      setSuccess(true);
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset success state after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to redeem premium month");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleRedeemClick}
        disabled={isRedeeming || availableBonuses <= 0}
        className={`flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#dab9f8] to-[#f2d36f] text-white rounded-full hover:opacity-90 transition-all shadow-md ${availableBonuses <= 0 ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {isRedeeming ? (
          <>
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Redeeming...</span>
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faCrown} className="text-white" />
            <span>Redeem 1 Month Premium</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="absolute left-0 right-0 -bottom-8 text-center">
          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs">
            {error}
          </span>
        </div>
      )}
      
      {success && (
        <div className="absolute left-0 right-0 -bottom-8 text-center">
          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs">
            Premium month redeemed successfully!
          </span>
        </div>
      )}
    </div>
  );
};

export default RedeemPremiumButton;