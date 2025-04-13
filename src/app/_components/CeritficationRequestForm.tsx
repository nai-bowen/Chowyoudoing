/*eslint-disable*/
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface CertificationStatus {
  request: {
    id: string;
    status: "pending" | "approved" | "rejected";
    justification: string;
    socialMediaLink: string | null;
    createdAt: string;
    reviewedAt: string | null;
  } | null;
  isCertified: boolean;
  certificationDate: string | null;
}

export default function CertificationRequestForm(): JSX.Element {
  const { data: session, status: sessionStatus } = useSession();
  const [justification, setJustification] = useState<string>("");
  const [socialMediaLink, setSocialMediaLink] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [certStatus, setCertStatus] = useState<CertificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch the current user's certification status
  useEffect(() => {
    const fetchCertificationStatus = async (): Promise<void> => {
      if (sessionStatus !== "authenticated") return;
      
      try {
        const response = await fetch("/api/certification-requests");
        
        if (!response.ok) {
          throw new Error("Failed to fetch certification status");
        }
        
        const data = await response.json() as CertificationStatus;
        setCertStatus(data);
        
        // If user has a rejected request, pre-fill the form
        if (data.request && data.request.status === "rejected") {
          setJustification(data.request.justification || "");
          setSocialMediaLink(data.request.socialMediaLink || "");
        }
      } catch (error) {
        console.error("Error fetching certification status:", error);
        setError("Failed to fetch your certification status. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificationStatus();
  }, [sessionStatus]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate input
      if (justification.trim().length < 10) {
        throw new Error("Please provide a justification (minimum 10 characters)");
      }

      // Validate social media link if provided
      if (socialMediaLink && !isValidUrl(socialMediaLink)) {
        throw new Error("Please enter a valid URL for your social media link");
      }

      // Submit the request
      const response = await fetch("/api/certification-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          justification,
          socialMediaLink: socialMediaLink || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit certification request");
      }

      const data = await response.json();
      setSuccess(data.message || "Your certification request has been submitted successfully!");
      
      // Refresh the status
      setCertStatus(prev => prev ? {
        ...prev,
        request: {
          ...(data.request || prev.request),
          status: "pending",
        },
      } : null);
    } catch (error) {
      console.error("Error submitting certification request:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Format date
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // If user is not logged in
  if (sessionStatus !== "authenticated") {
    return (
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Become a Certified Foodie</h3>
        <p className="text-gray-600 mb-4">Please log in to request foodie certification.</p>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#A90D3C]"></div>
          <span className="ml-2 text-gray-600">Loading certification status...</span>
        </div>
      </div>
    );
  }

  // If user is already certified
  if (certStatus?.isCertified) {
    return (
      <div className="bg-green-50 rounded-lg p-6 mb-6 border border-green-200">
        <div className="flex items-start">
          <div className="bg-green-100 rounded-full p-2 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">You're a Certified Foodie!</h3>
            <p className="text-green-700 mb-1">
              Congratulations! You've been certified as a foodie on {formatDate(certStatus.certificationDate)}.
            </p>
            <p className="text-green-700">
              Your reviews now display a certified badge, giving them more credibility in the community.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user has a pending request
  if (certStatus?.request && certStatus.request.status === "pending") {
    return (
      <div className="bg-yellow-50 rounded-lg p-6 mb-6 border border-yellow-200">
        <div className="flex items-start">
          <div className="bg-yellow-100 rounded-full p-2 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Certification Request Pending</h3>
            <p className="text-yellow-700 mb-1">
              Your request submitted on {formatDate(certStatus.request.createdAt)} is currently being reviewed by our team.
            </p>
            <p className="text-yellow-700">
              We'll notify you once a decision has been made. Thank you for your patience!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user has a rejected request
  const isRejected = certStatus?.request && certStatus.request.status === "rejected";

  // Show the form for new requests or rejected requests
  return (
    <div className={`${isRejected ? 'bg-red-50 border border-red-200' : 'bg-gray-50'} rounded-lg p-6 mb-6`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {isRejected ? 'Your Certification Request Was Rejected' : 'Become a Certified Foodie'}
      </h3>
      
      {isRejected && (
        <div className="mb-4 p-3 bg-white rounded-md border border-red-100">
          <p className="text-red-700 mb-2">
            Your certification request was reviewed and rejected on {formatDate(certStatus?.request?.reviewedAt)}.
          </p>
          <p className="text-gray-600">
            You can modify your request and resubmit it using the form below. Consider adding more details about your
            food expertise and experiences.
          </p>
        </div>
      )}

      <p className="text-gray-600 mb-4">
        {isRejected 
          ? 'Update your application to become a certified foodie:' 
          : 'Apply to become a certified foodie and get a special badge that displays on all your reviews:'}
      </p>

      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-1">
            Why should you be certified? <span className="text-red-500">*</span>
          </label>
          <textarea
            id="justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A90D3C] focus:border-[#A90D3C]"
            placeholder="Tell us about your food expertise, culinary experiences, or why you're passionate about food..."
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Minimum 10 characters. Describe your food expertise, how many restaurants you've visited, why you're passionate about food, etc.
          </p>
        </div>
        
        <div>
          <label htmlFor="socialMediaLink" className="block text-sm font-medium text-gray-700 mb-1">
            Food Social Media (Optional)
          </label>
          <input
            type="url"
            id="socialMediaLink"
            value={socialMediaLink}
            onChange={(e) => setSocialMediaLink(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A90D3C] focus:border-[#A90D3C]"
            placeholder="https://instagram.com/yourfoodaccount"
          />
          <p className="mt-1 text-sm text-gray-500">
            Link to your food-related social media profile (Instagram, TikTok, etc.) if you have one.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#A90D3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-600">
            Only users with quality reviews and demonstrated food knowledge will be certified.
          </span>
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-[#A90D3C] text-white rounded-md hover:bg-[#8a0a31] focus:outline-none focus:ring-2 focus:ring-[#A90D3C] focus:ring-offset-2 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting 
              ? 'Submitting...' 
              : isRejected 
                ? 'Resubmit Request' 
                : 'Submit Certification Request'}
          </button>
        </div>
      </form>
    </div>
  );
}