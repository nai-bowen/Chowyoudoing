// src/app/_components/FollowingList.tsx
"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import PatronProfileModal from "./PatronProfileModal";

interface FollowingUser {
  id: string;
  firstName: string;
  lastName: string;
  username?: string | null;
  profileImage?: string | null;
  isCertifiedFoodie?: boolean;
}

const FollowingList: React.FC = () => {
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchFollowing = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch("/api/profile/following");
        
        if (!response.ok) {
          throw new Error("Failed to fetch following");
        }
        
        const data = await response.json();
        setFollowing(data.following || []);
      } catch (error) {
        console.error("Error fetching following:", error);
        setError("Failed to load following. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFollowing();
  }, []);
  
  const handleViewProfile = (userId: string) => {
    setSelectedUser(userId);
    setIsProfileModalOpen(true);
  };
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <FontAwesomeIcon icon={faUserGroup} className="mr-2 text-[#F1C84B]" />
        People You Follow
      </h2>
      
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F1C84B]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
          <p>{error}</p>
        </div>
      ) : following.length > 0 ? (
        <div className="space-y-4">
          {following.map((user) => (
            <div
              key={user.id}
              className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleViewProfile(user.id)}
            >
              <div className="relative">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={`${user.firstName}'s profile`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-[#F1C84B] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.firstName.charAt(0)}
                    </span>
                  </div>
                )}
                
                {user.isCertifiedFoodie && (
                  <div className="absolute -bottom-1 -right-1 bg-[#F1C84B] rounded-full p-0.5 border border-white">
                    <FontAwesomeIcon icon={faUser} className="text-white text-xs" />
                  </div>
                )}
              </div>
              
              <div className="ml-3">
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                {user.username && (
                  <p className="text-xs text-gray-500">@{user.username}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FontAwesomeIcon icon={faUserGroup} className="text-4xl text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            You're not following anyone yet
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Follow food enthusiasts to see their reviews in your feed.
          </p>
        </div>
      )}
      
      {selectedUser && (
        <PatronProfileModal
          patronId={selectedUser}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </div>
  );
};

export default FollowingList;