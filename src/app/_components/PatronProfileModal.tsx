// src/app/_components/PatronProfileModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUser, faPen, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import FollowButton from "./FollowButton";

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

interface PatronProfileModalProps {
  patronId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PatronProfileModal: React.FC<PatronProfileModalProps> = ({
  patronId,
  isOpen,
  onClose
}) => {
  const [profileData, setProfileData] = useState<PatronProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // For debugging - log props on mount
  useEffect(() => {
    console.log("PatronProfileModal mounted with patronId:", patronId);
  }, [patronId]);
  
  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
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
          setProfileData(data.patron);
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
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-y-auto max-h-[90vh]"
      >
        {isLoading ? (
          <div className="p-6 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F1C84B]"></div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Error</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            <p className="text-red-500">{error}</p>
          </div>
        ) : profileData ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            
            <div className="flex items-center mb-6">
              <div className="relative">
                {profileData.profileImage ? (
                  <img
                    src={profileData.profileImage}
                    alt={`${profileData.firstName}'s profile`}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-[#F1C84B] rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {profileData.firstName ? profileData.firstName.charAt(0) : "?"}
                    </span>
                  </div>
                )}
                
                {profileData.isCertifiedFoodie && (
                  <div className="absolute -bottom-1 -right-1 bg-[#F1C84B] rounded-full p-1.5 border-2 border-white">
                    <FontAwesomeIcon icon={faPen} className="text-white text-xs" />
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
              </div>
            </div>
            
            {/* Follow Button */}
            <div className="mb-6">
              <FollowButton 
                targetPatronId={profileData.id} 
                className="w-full"
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
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-[#F1C84B]">
                  {profileData._count?.reviews || 0}
                </p>
                <p className="text-xs text-gray-600">Reviews</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-[#F1C84B]">
                  {profileData._count?.followers || 0}
                </p>
                <p className="text-xs text-gray-600">Followers</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-[#F1C84B]">
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
                      className="px-3 py-1 bg-[#F1C84B]/10 text-[#8A0B31] text-sm rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Profile not found</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            <p>This user's profile could not be found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatronProfileModal;