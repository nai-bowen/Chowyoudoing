/*eslint-disable*/

// src/lib/hoc/withPremiumCheck.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import usePremiumStatus from "../../lib/hooks/usePremiumStatus";
import PremiumSubscriptionModal from "@/app/_components/PremiumSubscriptionModal";

type PremiumFeature = "image_upload" | "review_response" | "analytics" | "visibility";

interface WithPremiumCheckProps {
  feature: PremiumFeature;
  fallback?: React.ReactNode;
}

// Higher-order component to protect premium features
export default function withPremiumCheck<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithPremiumCheckProps
): React.FC<P> {
  return function WithPremiumCheck(props: P) {
    const { data: session, status } = useSession();
    const { isPremium, checkFeatureAccess, refreshPremiumStatus } = usePremiumStatus();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
    const [isChecking, setIsChecking] = useState<boolean>(true);

    useEffect(() => {
      const checkAccess = async () => {
        if (status === "authenticated" && session?.user?.userType === "restaurateur") {
          setIsChecking(true);
          const canAccess = await checkFeatureAccess(options.feature);
          setHasAccess(canAccess);
          setIsChecking(false);
        } else if (status === "unauthenticated") {
          setHasAccess(false);
          setIsChecking(false);
        }
      };

      checkAccess();
    }, [status, session, options.feature, checkFeatureAccess]);

    const handleSubscribeSuccess = async () => {
      await refreshPremiumStatus();
      setHasAccess(true);
      setShowPremiumModal(false);
    };

    // Show loading state while checking access
    if (isChecking) {
      return (
        <div className="flex justify-center items-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#dab9f8]"></div>
        </div>
      );
    }

    // If user has access or is premium, render the component
    if (hasAccess === true || isPremium) {
      return <WrappedComponent {...props} />;
    }

    // Otherwise show the fallback or a prompt to upgrade
    return (
      <>
        <div onClick={() => setShowPremiumModal(true)}>
          {options.fallback || (
            <div className="p-6 border border-dashed border-gray-300 rounded-lg text-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="text-[#dab9f8] mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-700 mb-1">Premium Feature</h3>
              <p className="text-sm text-gray-500">
                Upgrade to access {options.feature.replace("_", " ")}
              </p>
            </div>
          )}
        </div>

        <PremiumSubscriptionModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onSubscribe={handleSubscribeSuccess}
          feature={options.feature}
        />
      </>
    );
  };
}