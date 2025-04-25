/* eslint-disable */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faArrowRight, faCrown, faUtensils, faChartLine, faCommentDots } from "@fortawesome/free-solid-svg-icons";

function PremiumSuccessContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState<number>(5);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    plan: string;
    expiresAt: string | null;
  }>({
    plan: "Premium",
    expiresAt: null,
  });

  // Extract subscription details from URL parameters
  useEffect(() => {
    const plan = searchParams.get("plan") || "Premium";
    const expiresAt = searchParams.get("expiresAt");

    setSubscriptionInfo({
      plan,
      expiresAt,
    });
  }, [searchParams]);

  // Create countdown for auto-redirect
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/restaurant-dashboard");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  // Format expiration date
  const formatExpirationDate = (dateString: string | null): string => {
    if (!dateString) return "your next billing cycle";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "your next billing cycle";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#f9ebc2] via-[#faf0f6] to-white">
      {/* Blob decorations */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-[#FFD879]/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 w-64 h-64 bg-[#FFC1B5]/20 rounded-full blur-3xl"></div>

      {/* Success Card */}
      <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-3xl border border-white/30 
        shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
        <div className="p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500">
              <FontAwesomeIcon icon={faCheckCircle} size="3x" />
            </div>
          </div>

          {/* Title with gradient */}
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#dab9f8] to-[#f2d36f] bg-clip-text text-transparent">
            Welcome to {subscriptionInfo.plan}!
          </h1>

          <p className="text-gray-600 mb-8">
            Your subscription has been successfully activated and will remain active until {formatExpirationDate(subscriptionInfo.expiresAt)}.
          </p>

          {/* Premium Features */}
          <div className="bg-[#faf2e5]/50 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-[#f2d36f] mb-4 flex items-center justify-center">
              <FontAwesomeIcon icon={faCrown} className="mr-2" />
              Premium Benefits
            </h2>

            <ul className="space-y-4 text-left">
              <li className="flex items-start">
                <FontAwesomeIcon icon={faUtensils} className="text-[#f9c3c9] mt-1 mr-3" />
                <div>
                  <span className="font-medium">Enhanced Menu Management</span>
                  <p className="text-sm text-gray-600">Upload unlimited menu items with images and custom categories</p>
                </div>
              </li>
              <li className="flex items-start">
                <FontAwesomeIcon icon={faChartLine} className="text-[#dab9f8] mt-1 mr-3" />
                <div>
                  <span className="font-medium">Advanced Analytics</span>
                  <p className="text-sm text-gray-600">Access detailed customer insights and performance metrics</p>
                </div>
              </li>
              <li className="flex items-start">
                <FontAwesomeIcon icon={faCommentDots} className="text-[#f2d36f] mt-1 mr-3" />
                <div>
                  <span className="font-medium">Priority Review Responses</span>
                  <p className="text-sm text-gray-600">Your responses to reviews appear higher in feeds</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Redirect Notice */}
          <p className="text-sm text-gray-500 mb-6">
            You'll be automatically redirected to your dashboard in {countdown} seconds...
          </p>

          {/* Return to Dashboard Button */}
          <Link
            href="/restaurant-dashboard"
            className="inline-flex items-center justify-center w-full py-3 bg-[#dab9f8] text-white font-medium rounded-full 
              hover:bg-[#c9a2f2] transition-colors"
          >
            Go to Dashboard Now
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PremiumSuccessPage(): JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PremiumSuccessContent />
    </Suspense>
  );
}
