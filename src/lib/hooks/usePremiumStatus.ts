/*eslint-disable*/

// src/lib/hooks/usePremiumStatus.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface PremiumStatus {
  isPremium: boolean;
  premiumSince: string | null;
  premiumExpiresAt: string | null;
  responseQuota: {
    remaining: number;
    resetAt: string;
  };
}

interface UsePremiumStatusReturn {
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  premiumDetails: PremiumStatus | null;
  checkFeatureAccess: (feature: "image_upload" | "review_response" | "analytics" | "visibility") => Promise<boolean>;
  refreshPremiumStatus: () => Promise<void>;
}

export default function usePremiumStatus(): UsePremiumStatusReturn {
  const { data: session, status } = useSession();
  const [premiumDetails, setPremiumDetails] = useState<PremiumStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPremiumStatus = useCallback(async (): Promise<void> => {
    if (status !== "authenticated" || session?.user?.userType !== "restaurateur") {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/restaurateur/premium");
      
      if (!response.ok) {
        throw new Error("Failed to fetch premium status");
      }
      
      const data = await response.json();
      setPremiumDetails(data);
    } catch (err) {
      console.error("Error fetching premium status:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [session, status]);

  // Initial fetch
  useEffect(() => {
    fetchPremiumStatus();
  }, [fetchPremiumStatus]);

  // Function to check if user has access to a particular premium feature
  const checkFeatureAccess = async (
    feature: "image_upload" | "review_response" | "analytics" | "visibility"
  ): Promise<boolean> => {
    // Refresh status first to ensure we have the latest data
    await fetchPremiumStatus();
    
    // If premium, always allow access
    if (premiumDetails?.isPremium) {
      return true;
    }
    
    // Otherwise, check feature-specific quotas for free tier
    switch (feature) {
      case "image_upload":
        // Check if user has reached image upload limit
        // This would require additional API call to count current images
        // For now, we'll return a placeholder value
        return false; // Assuming they've reached the limit
        
      case "review_response":
        // Check if user has remaining review response quota
        return (premiumDetails?.responseQuota.remaining ?? 0) > 0;
        
      case "analytics":
      case "visibility":
        // These features are premium-only
        return false;
        
      default:
        return false;
    }
  };

  return {
    isPremium: premiumDetails?.isPremium ?? false,
    isLoading,
    error,
    premiumDetails,
    checkFeatureAccess,
    refreshPremiumStatus: fetchPremiumStatus
  };
}