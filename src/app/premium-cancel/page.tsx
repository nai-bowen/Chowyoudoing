/*eslint-disable*/

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function PremiumCancelPage(): JSX.Element {
  const router = useRouter();
  
  // Redirect to dashboard after 10 seconds
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push("/restaurant-dashboard");
    }, 10000);
    
    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9ebc2] via-[#faf0f6] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl border border-white/30 
                    shadow-lg overflow-hidden p-8">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon 
              icon={faTimes} 
              className="text-gray-500 text-5xl" 
            />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-[#dab9f8]">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 mb-6">
            You've cancelled the premium subscription checkout process.
          </p>
          <p className="text-gray-500 mb-6">
            You can try again anytime to unlock premium features for your restaurant.
          </p>
          <div className="flex flex-col gap-4 justify-center items-center">
            <Link 
              href="/restaurant-dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to Dashboard
            </Link>
            <p className="text-sm text-gray-500">
              You'll be redirected to dashboard in a few seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}