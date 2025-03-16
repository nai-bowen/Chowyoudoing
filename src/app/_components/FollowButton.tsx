/*eslint-disable*/
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faUserMinus } from "@fortawesome/free-solid-svg-icons";

interface FollowButtonProps {
  targetPatronId: string;
  initialFollowState?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  targetPatronId,
  initialFollowState = false,
  onFollowChange,
  className = ""
}) => {
  const { data: session, status } = useSession();
  const [isFollowing, setIsFollowing] = useState<boolean>(initialFollowState);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Check initial follow status if not provided
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (status !== "authenticated" || !session?.user?.id || isInitialized) return;
      
      try {
        const response = await fetch(`/api/profile/follow/check?targetPatronId=${targetPatronId}`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };
    
    if (!initialFollowState) {
      checkFollowStatus();
    } else {
      setIsInitialized(true);
    }
  }, [targetPatronId, session, status, initialFollowState, isInitialized]);
  
  // Handle follow/unfollow
  const handleToggleFollow = async () => {
    if (status !== "authenticated" || !session?.user?.id || isLoading) return;
    
    setIsLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/profile/follow?targetPatronId=${targetPatronId}`, {
          method: "DELETE",
        });
        
        if (response.ok) {
          setIsFollowing(false);
          if (onFollowChange) onFollowChange(false);
        }
      } else {
        // Follow
        const response = await fetch("/api/profile/follow", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ targetPatronId }),
        });
        
        if (response.ok) {
          setIsFollowing(true);
          if (onFollowChange) onFollowChange(true);
        }
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Don't render if not logged in or viewing own profile
  if (status !== "authenticated" || session?.user?.id === targetPatronId) {
    return null;
  }
  
  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading || !isInitialized}
      className={`px-4 py-2 ${
        isFollowing
          ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
          : "bg-[#A90D3C] text-white hover:bg-[#8A0B31]"
      } rounded-lg flex items-center justify-center transition ${
        isLoading ? "opacity-70 cursor-not-allowed" : ""
      } ${className}`}
    >
      <FontAwesomeIcon
        icon={isFollowing ? faUserMinus : faUserPlus}
        className="mr-2"
      />
      {isLoading
        ? "Processing..."
        : isFollowing
        ? "Unfollow"
        : "Follow"}
    </button>
  );
};

export default FollowButton;