/*eslint-disable*/
// src/app/_components/ReferralDashboard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUsers, 
  faCopy, 
  faShare, 
  faTrophy, 
  faSpinner,
  faCrown,
  faWandMagicSparkles
} from "@fortawesome/free-solid-svg-icons";
import { generateUniqueReferralCode } from "@/lib/referral";

interface ReferralStats {
  code: string | null;
  points: number;
  referrals: {
    id: string;
    createdAt: string;
    referredType: string;
  }[];
  pointsToNextBonus: number;
  bonusesEarned: number;
  unusedBonuses: number;
  shareUrl: string;
}

const ReferralDashboard: React.FC = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareMenuOpen, setShareMenuOpen] = useState<boolean>(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);

  const fetchReferralStats = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/restaurateur/referrals");
      
      if (!response.ok) {
        throw new Error("Failed to fetch referral statistics");
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching referral stats:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralStats();
  }, []);

  // Generate a new referral code
  const generateReferralCode = async (): Promise<void> => {
    try {
      setIsGeneratingCode(true);
      
      // Generate a unique referral code using the function from referral.ts
      const newCode = await generateUniqueReferralCode();
      
      // Update the restaurateur's referral code in the database
      const response = await fetch("/api/restaurateur/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referralCode: newCode
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update referral code");
      }
      
      // Refresh stats to get the new code
      await fetchReferralStats();
    } catch (err) {
      console.error("Error generating referral code:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Copy referral code to clipboard
  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy text: ", err);
      });
  };

  // Share referral link
  const shareReferralLink = async (): Promise<void> => {
    if (!stats || !stats.code) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Chow You Doing as a restaurant owner",
          text: "Sign up using my referral code and we'll both get benefits!",
          url: stats.shareUrl
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      setShareMenuOpen(!shareMenuOpen);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} spin className="text-[#dab9f8] text-xl mr-3" />
        <span className="text-gray-600">Loading referral statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm">
        <p className="text-red-500">Error loading referral data: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm">
        <p className="text-gray-500">No referral data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#dab9f8] to-[#f2d36f] p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">Your Referral Program</h2>
        <p className="text-white/80">
          Invite other restaurant owners and earn premium benefits
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#faf2e5] rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-gray-600 text-sm">Your Referrals</h3>
              <div className="bg-[#f2d36e] p-2 rounded-full">
                <FontAwesomeIcon icon={faUsers} className="text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.points}</p>
            <p className="text-sm text-gray-500">
              {stats.referrals.length} successful sign-ups
            </p>
          </div>
          
          <div className="bg-[#fdedf6] rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-gray-600 text-sm">Bonuses Earned</h3>
              <div className="bg-[#f5b7ee] p-2 rounded-full">
                <FontAwesomeIcon icon={faTrophy} className="text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.bonusesEarned}</p>
            <p className="text-sm text-gray-500">
              {stats.unusedBonuses} premium months available
            </p>
          </div>
          
          <div className="bg-[#fbe9fc] rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-gray-600 text-sm">Next Bonus</h3>
              <div className="bg-[#dab9f8] p-2 rounded-full">
                <FontAwesomeIcon icon={faCrown} className="text-white" />
              </div>
            </div>
            {stats.pointsToNextBonus > 0 ? (
              <>
                <p className="text-3xl font-bold">{stats.pointsToNextBonus}</p>
                <p className="text-sm text-gray-500">
                  referrals until your next free month
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-gray-500">
                  You just earned a bonus! Keep referring.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Referral Code Section */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-semibold mb-4">Share Your Referral Code</h3>
        
        {stats.code ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gray-100 px-4 py-3 rounded-lg flex-grow">
                <span className="font-mono text-lg">{stats.code}</span>
              </div>
              
              <button
                onClick={() => copyToClipboard(stats.code as string)}
                className="p-3 bg-[#dab9f8] text-white rounded-lg hover:bg-[#c9a2f2] transition-colors"
                title="Copy referral code"
              >
                <FontAwesomeIcon icon={faCopy} />
              </button>
              
              <div className="relative">
                <button
                  onClick={shareReferralLink}
                  className="p-3 bg-[#f2d36f] text-white rounded-lg hover:bg-[#e6c860] transition-colors"
                  title="Share referral link"
                >
                  <FontAwesomeIcon icon={faShare} />
                </button>
                
                {/* Share menu dropdown */}
                {shareMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(stats.shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Share on Facebook
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(stats.shareUrl)}&text=${encodeURIComponent("Join Chow You Doing using my referral code!")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Share on Twitter
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent("Join Chow You Doing")}&body=${encodeURIComponent(`I'm inviting you to join Chow You Doing as a restaurant owner. Use my referral code ${stats.code} or sign up using this link: ${stats.shareUrl}`)}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Share via Email
                    </a>
                    <button
                      onClick={() => copyToClipboard(stats.shareUrl)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {copied && (
              <div className="text-green-600 text-sm mb-4">
                Copied to clipboard!
              </div>
            )}
          </>
        ) : (
          <div className="mb-6">
            <div className="bg-gray-50 border border-dashed border-gray-300 p-6 rounded-lg text-center mb-4">
              <p className="text-gray-600 mb-4">
                You don't have a referral code yet. Generate one to start earning benefits!
              </p>
              <button
                onClick={generateReferralCode}
                disabled={isGeneratingCode}
                className="px-6 py-3 bg-gradient-to-r from-[#dab9f8] to-[#f2d36f] text-white rounded-full hover:opacity-90 transition-all disabled:opacity-70 flex items-center justify-center mx-auto"
              >
                {isGeneratingCode ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2" />
                    Generate My Referral Code
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        <p className="text-gray-600 text-sm">
          Share this code with other restaurant owners. When they sign up using your code, 
          you'll receive referral points. Every 5 referrals earns you 1 month of premium benefits for free!
        </p>
      </div>
      
      {/* Recent Referrals */}
      <div className="p-6">
        <h3 className="font-semibold mb-4">Recent Referrals</h3>
        
        {stats.referrals.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.referrals.slice(0, 5).map((referral) => (
                  <tr key={referral.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        referral.referredType === "restaurateur" 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {referral.referredType === "restaurateur" ? "Restaurant" : "Customer"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              You haven't received any referrals yet. {stats.code ? "Share your code to get started!" : "Generate a referral code to get started!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralDashboard;