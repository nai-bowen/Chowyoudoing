/*eslint-disable*/
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft,
  faUsers,
  faSpinner,
  faShareAlt,
  faInfoCircle,
  faCopy,
  faWandMagicSparkles,
  faTrophy,
  faCrown
} from "@fortawesome/free-solid-svg-icons";
import RedeemPremiumButton from "@/app/_components/RedeemPremiumButton";

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  bonusesEarned: number;
  bonusesAvailable: number;
  nextBonusAt: number;
}

interface ReferredRestaurateur {
  id: string;
  restaurantName: string;
  approvedAt: string | null;
  verificationStatus: string;
  submittedAt: string;
}

interface RestaurateurData {
  id: string;
  email: string;
  restaurantName: string;
  referralCode: string | null;
  referralStats: ReferralStats;
  referredRestaurateurs: ReferredRestaurateur[];
  isPremium: boolean;
  premiumExpiresAt: string | null;
}

export default function RestaurateurReferralsPage(): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    successfulReferrals: 0,
    bonusesEarned: 0,
    bonusesAvailable: 0,
    nextBonusAt: 5 // Number of referrals needed for next bonus
  });
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [referredRestaurateurs, setReferredRestaurateurs] = useState<ReferredRestaurateur[]>([]);

  // Check if user is authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login/restaurateur");
    } else if (status === "authenticated") {
      // Check if it's a restaurateur account
      if (session?.user?.userType !== "restaurateur") {
        router.push("/login/restaurateur");
      } else {
        // Check if there's an existing referral code
        fetchRestaurateurData();
      }
    }
  }, [status, session, router]);

  const fetchRestaurateurData = async (): Promise<void> => {
    try {
      const response = await fetch("/api/restaurateur/profile");
      
      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }
      
      const data: RestaurateurData = await response.json();
      
      // Set referral code
      setReferralCode(data.referralCode || null);
      
      // Set referral stats if available
      if (data.referralStats) {
        setStats(data.referralStats);
      }
      
      // Set premium status
      setIsPremium(data.isPremium || false);
      setPremiumExpiresAt(data.premiumExpiresAt);
      
      // Set referred restaurateurs if available
      if (data.referredRestaurateurs) {
        setReferredRestaurateurs(data.referredRestaurateurs);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a unique referral code
  const generateReferralCode = async (): Promise<void> => {
    try {
      setIsGeneratingCode(true);
      
      // Call API to generate a code
      const response = await fetch("/api/restaurateur/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referralCode: "generate"
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      const data = await response.json();
      setReferralCode(data.referralCode);
      
      // Update stats if they're included in the response
      if (data.referralStats) {
        setStats(data.referralStats);
      }
    } catch (error) {
      console.error("Error generating referral code:", error);
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

  // Get the shareable referral link
  const getReferralLink = (): string => {
    const baseUrl = typeof window !== "undefined" 
      ? window.location.origin 
      : "https://chowyoudoing.com";
    
    return `${baseUrl}/register/restaurateur?ref=${referralCode}`;
  };

  // Handle successful premium redemption
  const handlePremiumRedeemed = (): void => {
    // Refresh the data to get updated premium status and bonus count
    fetchRestaurateurData();
  };

  // Format premium expiry date for display
  const formatExpiryDate = (dateString: string | null): string => {
    if (!dateString) return "Not active";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()}
          className="mr-4 p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Refer & Earn</h1>
          <p className="text-gray-600">Invite other restaurant owners and earn premium benefits</p>
        </div>
      </div>
      
      {/* Premium Status Banner */}
      <div className={`mb-8 p-6 rounded-xl ${
          isPremium 
            ? "bg-gradient-to-r from-[#dab9f8]/20 to-[#f2d36f]/20 border border-[#f2d36f]/30" 
            : "bg-gray-100"
        }`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faCrown} className={isPremium ? "text-[#f2d36f]" : "text-gray-400"} />
              Premium Status
            </h2>
            <p className="text-gray-600 mt-1">
              {isPremium 
                ? `Active until: ${formatExpiryDate(premiumExpiresAt)}` 
                : "Not active - redeem your bonuses to activate premium!"}
            </p>
          </div>
          
          {/* Only show redeem button if there are available bonuses */}
          {stats.bonusesAvailable > 0 && (
            <RedeemPremiumButton 
              availableBonuses={stats.bonusesAvailable} 
              onSuccess={handlePremiumRedeemed}
            />
          )}
        </div>
      </div>
      
      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FontAwesomeIcon icon={faInfoCircle} className="text-[#f2d36f] mr-2" />
          How Our Referral Program Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#faf2e5] rounded-full flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faShareAlt} className="text-[#f2d36f] text-xl" />
            </div>
            <h3 className="font-semibold mb-2">1. Share Your Code</h3>
            <p className="text-gray-600">
              Share your unique referral code with other restaurant owners who might be interested in joining Chow You Doing.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#fdedf6] rounded-full flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faUsers} className="text-[#f9c3c9] text-xl" />
            </div>
            <h3 className="font-semibold mb-2">2. They Sign Up</h3>
            <p className="text-gray-600">
              When they register using your referral code, you both get credit for the referral once their account is approved.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#f1eafe] rounded-full flex items-center justify-center mb-4">
              <svg 
                className="w-6 h-6 text-[#dab9f8]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">3. Earn Rewards</h3>
            <p className="text-gray-600">
              For every 5 successful referrals, you earn 1 month of premium benefits for free. The more you refer, the more you earn!
            </p>
          </div>
        </div>
      </div>
      
      {/* Referral Dashboard */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
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
              <p className="text-3xl font-bold">{stats.totalReferrals}</p>
              <p className="text-sm text-gray-500">
                {stats.successfulReferrals} successful sign-ups
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
                {stats.bonusesAvailable} premium months available
              </p>
            </div>
            
            <div className="bg-[#fbe9fc] rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-gray-600 text-sm">Next Bonus</h3>
                <div className="bg-[#dab9f8] p-2 rounded-full">
                  <FontAwesomeIcon icon={faCrown} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold">{stats.nextBonusAt}</p>
              <p className="text-sm text-gray-500">
                referrals until your next free month
              </p>
            </div>
          </div>
          
          {/* Redeem Premium Button - Only show if there are available bonuses */}
          {stats.bonusesAvailable > 0 && (
            <div className="mt-6 text-center">
              <RedeemPremiumButton 
                availableBonuses={stats.bonusesAvailable} 
                onSuccess={handlePremiumRedeemed}
                className="mx-auto py-3 px-8"
              />
              <p className="text-sm text-gray-500 mt-2">
                Redeem one of your {stats.bonusesAvailable} earned premium months!
              </p>
            </div>
          )}
        </div>
        
        {/* Referral Code Section */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold mb-4">Share Your Referral Code</h3>
          
          {referralCode ? (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-gray-100 px-4 py-3 rounded-lg flex-grow">
                  <span className="font-mono text-lg">{referralCode}</span>
                </div>
                
                <button
                  onClick={() => copyToClipboard(referralCode)}
                  className="p-3 bg-[#dab9f8] text-white rounded-lg hover:bg-[#c9a2f2] transition-colors"
                  title="Copy referral code"
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              </div>
              
              {/* Referral Link */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or share this link
                </label>
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 px-4 py-3 rounded-lg flex-grow overflow-x-auto">
                    <span className="font-mono text-sm">{getReferralLink()}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(getReferralLink())}
                    className="p-3 bg-[#dab9f8] text-white rounded-lg hover:bg-[#c9a2f2] transition-colors flex-shrink-0"
                    title="Copy referral link"
                  >
                    <FontAwesomeIcon icon={faCopy} />
                  </button>
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
          
          {referredRestaurateurs.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center border-b pb-2 font-medium text-gray-700">
                <span>Restaurant</span>
                <span>Date</span>
                <span>Status</span>
              </div>
              
              {/* Display actual referred restaurateurs */}
              {referredRestaurateurs.map((restaurateur) => (
                <div key={restaurateur.id} className="py-4 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-gray-800">{restaurateur.restaurantName}</span>
                  <span className="text-gray-500 text-sm">
                    {new Date(restaurateur.submittedAt).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    restaurateur.verificationStatus === "APPROVED" 
                      ? "bg-green-100 text-green-800" 
                      : restaurateur.verificationStatus === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {restaurateur.verificationStatus.charAt(0).toUpperCase() + 
                      restaurateur.verificationStatus.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                You haven't received any referrals yet. {referralCode ? "Share your code to get started!" : "Generate a referral code to get started!"}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">How do I know if my referral was successful?</h3>
            <p className="text-gray-600">
              Your referral is counted as successful once the restaurant owner you referred completes their registration and their account is approved by our team.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">When do I receive my premium benefits?</h3>
            <p className="text-gray-600">
              Premium benefits are automatically applied when you reach 5 referral points. You can redeem your earned months at any time by clicking the "Redeem 1 Month Premium" button. If you already have a premium subscription, your subscription period will be extended by one month.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Is there a limit to how many people I can refer?</h3>
            <p className="text-gray-600">
              No, there is no limit! The more restaurant owners you refer, the more premium benefits you can earn.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">What happens if someone enters my code but doesn't complete registration?</h3>
            <p className="text-gray-600">
              You will only receive referral credit when the account is fully registered and approved. Incomplete registrations don't count towards your referral total.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}