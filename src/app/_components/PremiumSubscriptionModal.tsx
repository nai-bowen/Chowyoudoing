/*eslint-disable*/

// src/app/_components/PremiumSubscriptionModal.tsx
"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCrown, 
  faTimes, 
  faCheck, 
  faSpinner,
  faImage,
  faComment,
  faChartLine,
  faStar
} from "@fortawesome/free-solid-svg-icons";

interface PremiumSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  feature?: "image_upload" | "review_response" | "analytics" | "visibility";
}

export default function PremiumSubscriptionModal({
  isOpen,
  onClose,
  onSubscribe,
  feature
}: PremiumSubscriptionModalProps): JSX.Element | null {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");

  if (!isOpen) return null;

  // Feature-specific messaging
  const getFeatureMessage = (): { title: string; icon: typeof faCrown } => {
    switch (feature) {
      case "image_upload":
        return {
          title: "Unlimited Menu Images",
          icon: faImage
        };
      case "review_response":
        return {
          title: "Unlimited Review Responses",
          icon: faComment
        };
      case "analytics":
        return {
          title: "Advanced Analytics",
          icon: faChartLine
        };
      case "visibility":
        return {
          title: "Enhanced Visibility",
          icon: faStar
        };
      default:
        return {
          title: "Premium Features",
          icon: faCrown
        };
    }
  };

  const { title, icon } = getFeatureMessage();

  const handleSubscribe = async (): Promise<void> => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: selectedPlan,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }
  
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#dab9f8] to-[#f2d36f] px-6 py-4 text-white">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-white hover:text-gray-200"
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FontAwesomeIcon icon={icon} className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Upgrade to Premium</h2>
              <p className="text-white/80">Unlock {title} and more!</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Upgrade to our premium plan to access exclusive features designed to boost your restaurant's online presence and customer engagement.
            </p>
            
            {/* Feature specific message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-800">
              <p className="font-medium">You've reached the limit for free users.</p>
              <p className="text-sm">Subscribe now to unlock {title.toLowerCase()} and all premium features.</p>
            </div>
          </div>
          
          {/* Pricing Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-full inline-flex">
              <button 
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedPlan === "monthly" 
                    ? "bg-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setSelectedPlan("monthly")}
              >
                Monthly
              </button>
              <button 
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedPlan === "yearly" 
                    ? "bg-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setSelectedPlan("yearly")}
              >
                Yearly <span className="text-green-500">Save 20%</span>
              </button>
            </div>
          </div>
          
          {/* Pricing Card */}
          <div className="border border-[#dab9f8]/30 rounded-lg p-4 mb-6 hover:border-[#dab9f8] transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">Premium Plan</h3>
                <p className="text-gray-500 text-sm">All features included</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {selectedPlan === "monthly" ? "£19.99" : "£191.90"}
                </div>
                <div className="text-gray-500 text-sm">
                  {selectedPlan === "monthly" ? "per month" : "per year"}
                </div>
              </div>
            </div>
            
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheck} className="text-green-500 mt-1" />
                <span>Unlimited menu images</span>
              </li>
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheck} className="text-green-500 mt-1" />
                <span>Unlimited review responses</span>
              </li>
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheck} className="text-green-500 mt-1" />
                <span>Review sentiment analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheck} className="text-green-500 mt-1" />
                <span>Priority visibility on search results</span>
              </li>
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheck} className="text-green-500 mt-1" />
                <span>Detailed customer engagement analytics</span>
              </li>
            </ul>
            
            <div className="text-center">
              <button
                onClick={handleSubscribe}
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-[#dab9f8] to-[#f2d36f] text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>Subscribe Now</>
                )}
              </button>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            No long-term commitment. Cancel anytime.
          </div>
        </div>
      </div>
    </div>
  );
}