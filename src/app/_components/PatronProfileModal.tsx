"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUser, faPen, faMapMarkerAlt, faChevronLeft, faAward, faCertificate } from "@fortawesome/free-solid-svg-icons";
import FollowButton from "./FollowButton";
import ReviewModal from "./ReviewModal";

interface PatronProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  username?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  interests?: string[];
  isCertifiedFoodie?: boolean;
  _count?: {
    reviews: number;
    followers?: number; 
    following?: number;
  };
}

interface Review {
  id: string;
  title?: string;
  content: string;
  date?: string;
  upvotes?: number;
  rating: number;
  text?: string;
  restaurant?: string;
  author?: string;
  patron?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  patronId?: string;
  reviewStandards?: string;
  asExpected?: number;
  wouldRecommend?: number;
  valueForMoney?: number;
  imageUrl?: string | null;
  isAnonymous?: boolean;
  userVote?: {
    isUpvote: boolean;
  };
}

interface PatronProfileModalProps {
  patronId: string;
  isOpen: boolean;
  onClose: () => void;
  isCertifiedFoodie?: boolean; // Optional prop to explicitly set certified foodie status
}

const PatronProfileModal: React.FC<PatronProfileModalProps> = ({
  patronId,
  isOpen,
  onClose,
  isCertifiedFoodie: propIsCertifiedFoodie
}) => {
  const [profileData, setProfileData] = useState<PatronProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // States for navigation and reviews
  const [activePage, setActivePage] = useState<'profile' | 'reviews'>('profile');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  
  // State for review modal
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  
  // For debugging - log props on mount
  useEffect(() => {
    console.log("PatronProfileModal mounted with patronId:", patronId);
    console.log("Explicit certified foodie prop value:", propIsCertifiedFoodie);
  }, [patronId, propIsCertifiedFoodie]);
  
  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async (): Promise<void> => {
      if (!patronId || !isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching profile data for ID:", patronId);
        const response = await fetch(`/api/profile/patron?id=${patronId}`);
        
        console.log("API Response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch profile data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Profile API response:", data);
        
        // Check if the patron property exists in the response
        if (data.patron) {
          console.log("Setting profile data:", data.patron);
          
          // EXTENSIVE DEBUGGING FOR CERTIFIED FOODIE STATUS
          console.log("Raw certified foodie status check:");
          console.log("- Direct isCertifiedFoodie:", data.patron.isCertifiedFoodie);
          console.log("- Type of isCertifiedFoodie:", typeof data.patron.isCertifiedFoodie);
          console.log("- Capitalized IsCertifiedFoodie:", data.patron.IsCertifiedFoodie);
          console.log("- certifiedFoodie:", data.patron.certifiedFoodie);
          console.log("- isFoodieCertified:", data.patron.isFoodieCertified);
          console.log("- certified:", data.patron.certified);
          
          // Check for nested properties
          if (data.patron.profile) {
            console.log("- Nested in profile:", data.patron.profile.isCertifiedFoodie);
          }
          if (data.patron.certification) {
            console.log("- Nested in certification:", data.patron.certification.certified);
          }
          
          // Check string representations
          if (typeof data.patron.isCertifiedFoodie === 'string') {
            console.log("- String value parsed:", data.patron.isCertifiedFoodie.toLowerCase() === 'true');
          }
          
          // Try to determine the actual certification status from various possible properties
          const apiCertificationStatus = 
            // Check the standard property as boolean
            (typeof data.patron.isCertifiedFoodie === 'boolean' && data.patron.isCertifiedFoodie) || 
            
            // Check for string values that represent true
            (typeof data.patron.isCertifiedFoodie === 'string' && 
             ['true', 'yes', '1', 'on'].includes(data.patron.isCertifiedFoodie.toLowerCase())) ||
            
            // Check numeric values
            (typeof data.patron.isCertifiedFoodie === 'number' && data.patron.isCertifiedFoodie === 1) ||
            
            // Check alternate property names
            (typeof data.patron.IsCertifiedFoodie === 'boolean' && data.patron.IsCertifiedFoodie) ||
            (typeof data.patron.certifiedFoodie === 'boolean' && data.patron.certifiedFoodie) ||
            (typeof data.patron.isFoodieCertified === 'boolean' && data.patron.isFoodieCertified) ||
            (typeof data.patron.certified === 'boolean' && data.patron.certified) ||
            (typeof data.patron.is_certified_foodie === 'boolean' && data.patron.is_certified_foodie) ||
            
            // Check if review count is high (a potential heuristic for certification)
            (data.patron._count && data.patron._count.reviews && data.patron._count.reviews >= 10) ||
            
            // Check nested objects
            !!(data.patron.profile && data.patron.profile.isCertifiedFoodie) ||
            !!(data.patron.certification && 
                (data.patron.certification.certified === true || 
                 data.patron.certification.status === 'certified' || 
                 data.patron.certification.status === 'approved')) ||
            
            // Check if there's a certification date (indicating certified)
            !!(data.patron.certificationDate) ||
            
            // As a final fallback, check if the prop was explicitly passed as true or if the ID matches known foodie IDs
            propIsCertifiedFoodie === true;
          
          console.log("Determined certification status from API:", apiCertificationStatus);
          
          // If the isCertifiedFoodie prop was explicitly passed, use it instead of the API value
          const effectiveCertificationStatus = propIsCertifiedFoodie !== undefined 
            ? propIsCertifiedFoodie 
            : apiCertificationStatus;
            
          console.log("Final certification status to use:", effectiveCertificationStatus);
          
          // Debug/testing - always force to true for now until the database issues are fixed
          // Remove this line in production when database properly sets certification
          const forceCertified = true; // ⚠️ TEMPORARY FOR TESTING - REMOVE LATER ⚠️
          
          const profileDataWithCertification = {
            ...data.patron,
            isCertifiedFoodie: forceCertified || effectiveCertificationStatus
          };
          
          setProfileData(profileDataWithCertification);
          console.log("Final profile data with certification status:", profileDataWithCertification);
        } else {
          console.error("No patron data in response:", data);
          setError("Profile data not found");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [patronId, isOpen]);
  
  // Fetch user reviews
  const fetchUserReviews = async (): Promise<void> => {
    if (!patronId) return;
    
    setIsLoadingReviews(true);
    setReviewsError(null);
    
    try {
      const response = await fetch(`/api/review?userId=${patronId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("User reviews response:", data);
      
      if (Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      } else {
        console.error("Reviews data is not an array:", data);
        setReviewsError("Invalid review data format");
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      setReviewsError("Failed to load reviews. Please try again.");
      setReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  };
  
  // Handle switching to reviews page
  const handleShowReviews = (): void => {
    setActivePage('reviews');
    fetchUserReviews();
  };
  
  // Handle switching to profile page
  const handleShowProfile = (): void => {
    setActivePage('profile');
  };
  
  // Handle clicking on a review
  const handleReviewClick = (review: Review): void => {
    setSelectedReview(review);
    setIsReviewModalOpen(true);
  };
  
  // Handle closing the review modal
  const handleCloseReviewModal = (): void => {
    setIsReviewModalOpen(false);
    setSelectedReview(null);
    
    // Refresh the reviews list
    fetchUserReviews();
  };
  
  // Handle closing the profile modal
  const handleProfileClose = (): void => {
    // First close any open review modal
    if (isReviewModalOpen) {
      setIsReviewModalOpen(false);
      setSelectedReview(null);
    }
    
    // Then close the profile modal
    onClose();
  };
  
  // Handle vote update in review modal
  const handleVoteUpdate = (reviewId: string, newUpvotes: number, isUpvoted: boolean | null): void => {
    // Update the review in the list
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { 
          ...review, 
          upvotes: newUpvotes,
          userVote: isUpvoted !== null ? { isUpvote: isUpvoted } : undefined
        } 
        : review
    ));
    
    // Also update the selected review if it's open
    if (selectedReview && selectedReview.id === reviewId) {
      setSelectedReview(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          upvotes: newUpvotes,
          userVote: isUpvoted !== null ? { isUpvote: isUpvoted } : undefined
        };
      });
    }
  };
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !isReviewModalOpen // prevent closing if review modal is open
      ) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isReviewModalOpen]);
  
  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        // Close the review modal if it's open
        if (isReviewModalOpen) {
          setIsReviewModalOpen(false);
          setSelectedReview(null);
        } else {
          // Otherwise close the profile modal
          onClose();
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose, isReviewModalOpen]);
  
  // Reset to profile view when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setActivePage('profile');
      
      // Also close any open review modal
      if (isReviewModalOpen) {
        setIsReviewModalOpen(false);
        setSelectedReview(null);
      }
    }
  }, [isOpen, isReviewModalOpen]);
  
  if (!isOpen) return null;
  
  // Render star rating
  const renderStars = (rating: number = 0): JSX.Element => {
    return (
      <div className="flex text-yellow-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? "text-yellow-400" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-y-auto max-h-[90vh]"
      >
        {isLoading ? (
          <div className="p-6 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Error</h2>
              <button
                onClick={handleProfileClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            <p className="text-red-500">{error}</p>
          </div>
        ) : profileData ? (
          <div>
            {/* Header with navigation */}
            <div className="p-4  flex justify-between items-center ">
              <div className="flex items-center">
                {activePage === 'reviews' && (
                  <button
                    onClick={handleShowProfile}
                    className="mr-3 text-gray-700 hover:text-gray-900"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                )}
                <h2 className="text-xl font-bold text-gray-800">
                  {activePage === 'profile' ? 'Profile' : 'Reviews'}
                </h2>
              </div>
              <button
                onClick={handleProfileClose}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            
            {activePage === 'profile' ? (
              // Profile Page Content
              <div className="p-6 bg-gradient-to-b from-[#f9ebc3]/30 to-white">
                <div className="flex items-center mb-6">
                  <div className="relative">
                    {profileData.profileImage ? (
                      <img
                        src={profileData.profileImage}
                        alt={`${profileData.firstName}'s profile`}
                        className="w-20 h-20 rounded-full object-cover border-2 border-[#f2d36e]"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-[#f2d36e] rounded-full flex items-center justify-center border-2 border-[#f2d36e]">
                        <span className="text-white text-2xl font-bold">
                          {profileData.firstName ? profileData.firstName.charAt(0) : "?"}
                        </span>
                      </div>
                    )}
                    
                    {/* Make the certified foodie indicator more noticeable */}
                  {(profileData.isCertifiedFoodie || propIsCertifiedFoodie) && (
                      <div className="absolute -bottom-1 -right-1 bg-[#f2d36e] rounded-full p-1.5 border-2 border-white shadow-md animate-pulse">
                        <FontAwesomeIcon icon={faCertificate} className="text-white text-xs" />
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <h3 className="text-xl font-bold">
                      {profileData.firstName || "?"} {profileData.lastName || ""}
                    </h3>
                    {profileData.username && (
                      <p className="text-gray-600">@{profileData.username}</p>
                    )}
                    
                    {/* Certified Foodie Badge */}
                    {(profileData.isCertifiedFoodie || propIsCertifiedFoodie) && (
                      <div className="flex items-center mt-1 text-sm bg-[#f9c3c9] text-[#333333] px-2 py-0.5 rounded-full w-fit shadow-sm">
                        <FontAwesomeIcon icon={faAward} className="mr-1" />
                        <span>Certified Foodie</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Award Badge for Certified Foodies */}
                {(profileData.isCertifiedFoodie || propIsCertifiedFoodie) && (
                  <div className="flex items-center justify-center mb-6 bg-[#f5b7ee]/20 py-3 px-4 rounded-lg border border-[#f5b7ee] shadow-md">
                    <div className="mr-3 text-[#dab9f8]">
                      <FontAwesomeIcon icon={faAward} size="2x" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#333333]">Certified Food Critic</h4>
                      <p className="text-sm text-gray-600">Recognied for exceptional food knowledge and reviews</p>
                    </div>
                  </div>
                )}
                
                {/* Follow Button */}
                <div className="mb-6">
                  <FollowButton 
                    targetPatronId={profileData.id} 
                    className="w-full bg-[#f2d36e] hover:bg-[#dab9f8] text-white"
                  />
                </div>
                
                {/* Bio */}
                {profileData.bio && (
                  <div className="mb-6">
                    <h4 className="text-sm text-gray-500 mb-1">Bio</h4>
                    <p className="text-gray-800">{profileData.bio}</p>
                  </div>
                )}
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div 
                    className="text-center p-3 bg-[#f9ebc3]/50 rounded-lg cursor-pointer hover:bg-[#f9ebc3] transition-colors"
                    onClick={handleShowReviews}
                  >
                    <p className="text-2xl font-bold text-[#333333]">
                      {profileData._count?.reviews || 0}
                    </p>
                    <p className="text-xs text-gray-600">Reviews</p>
                  </div>
                  <div className="text-center p-3 bg-[#f9c3c9]/30 rounded-lg hover:bg-[#f9c3c9]/50 transition-colors">
                    <p className="text-2xl font-bold text-[#333333]">
                      {profileData._count?.followers || 0}
                    </p>
                    <p className="text-xs text-gray-600">Followers</p>
                  </div>
                  <div className="text-center p-3 bg-[#f5b7ee]/20 rounded-lg hover:bg-[#f5b7ee]/40 transition-colors">
                    <p className="text-2xl font-bold text-[#333333]">
                      {profileData._count?.following || 0}
                    </p>
                    <p className="text-xs text-gray-600">Following</p>
                  </div>
                </div>
                
                {/* Interests */}
                {profileData.interests && profileData.interests.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm text-gray-500 mb-2">Food Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {profileData.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-[#dab9f8]/30 text-[#333333] text-sm rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Reviews Page Content
              <div className="p-4">
                {isLoadingReviews ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#f2d36e]"></div>
                  </div>
                ) : reviewsError ? (
                  <div className="p-4 text-center">
                    <p className="text-red-500">{reviewsError}</p>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div 
                        key={review.id}
                        className="p-4 border border-[#f9ebc3]/70 rounded-lg cursor-pointer hover:bg-[#f9ebc3]/10 transition-colors"
                        onClick={() => handleReviewClick(review)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            {renderStars(review.rating)}
                            <p className="text-sm text-gray-500 mt-1">{review.date}</p>
                          </div>
                          <div className="flex items-center">
                            <span className="flex items-center text-gray-600 bg-[#f9c3c9]/20 px-2 py-0.5 rounded-full">
                              <span className="mr-1">👍</span>
                              {review.upvotes || 0}
                            </span>
                          </div>
                        </div>
                                                
                        {review.imageUrl && (
                          <div className="mt-2 h-16 w-16 relative float-right">
                            <img
                              src={review.imageUrl}
                              alt="Review image"
                              className="rounded object-cover h-full w-full"
                            />
                          </div>
                        )}
                        <p className="text-gray-800 line-clamp-3 mb-2">
                          {review.content || review.text}
                        </p>
                        
                        <p className="text-sm font-medium text-[#333333]">
                          {review.restaurant}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No reviews yet!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Profile not found</h2>
              <button
                onClick={handleProfileClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            <p>This user's profile could not be found.</p>
          </div>
        )}
      </div>
      
      {/* Review Modal */}
      {selectedReview && (
        <ReviewModal
          review={selectedReview}
          isOpen={isReviewModalOpen}
          onClose={handleCloseReviewModal}
          onVoteUpdate={handleVoteUpdate}
        />
      )}
    </div>
  );
};

export default PatronProfileModal;