/*eslint-disable*/
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Navbar from "../../_components/navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faUserPlus, faUserMinus } from "@fortawesome/free-solid-svg-icons";

// Define types for our profile data
interface Patron {
  id: string;
  firstName: string;
  lastName: string;
  username: string | null;
  profileImage: string | null;
  bio: string | null;
  interests: string[];
  _count?: {
    followers: number;
    following: number;
    reviews: number;
  };
}

interface Review {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  upvotes: number;
  restaurant: {
    title: string;
  };
}

export default function PublicProfilePage(): JSX.Element {
  const { username } = useParams();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Patron | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch patron by username
        const profileResponse = await fetch(`/api/profile/patron?username=${username}`);
        if (!profileResponse.ok) {
          throw new Error("Failed to fetch profile data");
        }
        const profileData = await profileResponse.json();
        setProfile(profileData.patron);

        // Fetch reviews by this patron
        if (profileData.patron?.id) {
          const reviewsResponse = await fetch(`/api/review?userId=${profileData.patron.id}`);
          if (!reviewsResponse.ok) {
            throw new Error("Failed to fetch reviews");
          }
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews || []);
        }

        // Check if current user is following this patron
        if (status === "authenticated" && session?.user?.id && profileData.patron?.id) {
          const followResponse = await fetch(`/api/profile/follow?targetPatronId=${profileData.patron.id}`);
          if (followResponse.ok) {
            const followData = await followResponse.json();
            setIsFollowing(followData.isFollowing);
          }
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchProfileData();
    }
  }, [username, session, status]);

  // Handle follow/unfollow action
  const handleFollowToggle = async () => {
    if (!profile?.id || status !== "authenticated" || !session?.user?.id) {
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/profile/follow?targetPatronId=${profile.id}`, {
          method: "DELETE",
        });
        
        if (response.ok) {
          setIsFollowing(false);
          // Update follower count
          setProfile(prev => {
            if (!prev || !prev._count) return prev;
            return {
              ...prev,
              _count: {
                ...prev._count,
                followers: Math.max(0, (prev._count.followers || 0) - 1)
              }
            };
          });
        }
      } else {
        // Follow
        const response = await fetch(`/api/profile/follow`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ targetPatronId: profile.id }),
        });
        
        if (response.ok) {
          setIsFollowing(true);
          // Update follower count
          setProfile(prev => {
            if (!prev || !prev._count) return prev;
            return {
              ...prev,
              _count: {
                ...prev._count,
                followers: (prev._count.followers || 0) + 1
              }
            };
          });
        }
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  // Format date string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Render star rating
  const renderStars = (rating: number): JSX.Element => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`${star <= rating ? "text-yellow-400" : "text-gray-300"}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="with-navbar">
        <Navbar />
        <div className="page-content">
          <div className="flex justify-center items-center min-h-screen">
            <p className="text-xl">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="with-navbar">
        <Navbar />
        <div className="page-content">
          <div className="flex flex-col justify-center items-center min-h-screen">
            <p className="text-xl text-red-600">
              {error || "User not found"}
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-[#D29501] text-white rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="with-navbar">
      <Navbar />
      <div className="page-content">
        <div className="bg-[#FFF5E1] min-h-screen p-6">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row">
              <div className="relative w-32 h-32 mx-auto md:mx-0">
                <Image
                  src={profile.profileImage || "/assets/default-profile.jpg"}
                  alt="Profile"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div className="md:ml-8 mt-4 md:mt-0 flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-[#D29501]">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <p className="text-gray-500">@{profile.username || "username"}</p>
                  </div>
                  {status === "authenticated" && session?.user?.id !== profile.id && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`px-4 py-2 ${
                        isFollowing ? "bg-gray-200 text-gray-800" : "bg-[#A90D3C] text-white"
                      } rounded-lg flex items-center ${followLoading ? "opacity-70" : ""}`}
                    >
                      <FontAwesomeIcon 
                        icon={isFollowing ? faUserMinus : faUserPlus} 
                        className="mr-2" 
                      />
                      {followLoading 
                        ? "Processing..." 
                        : isFollowing 
                          ? "Unfollow" 
                          : "Follow"}
                    </button>
                  )}
                </div>
                <p className="mt-2 text-gray-700">{profile.bio || "No bio available"}</p>
                <div className="mt-4">
                  <h3 className="font-semibold">Interests:</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.interests && profile.interests.length > 0 ? (
                      profile.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-[#FFF5E1] rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No interests added yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#D29501]">
                  {profile._count?.reviews || 0}
                </p>
                <p className="text-gray-600">Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#D29501]">
                  {profile._count?.followers || 0}
                </p>
                <p className="text-gray-600">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#D29501]">
                  {profile._count?.following || 0}
                </p>
                <p className="text-gray-600">Following</p>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FontAwesomeIcon icon={faStar} className="text-yellow-400 mr-2" />
              Reviews by {profile.firstName}
            </h2>
            
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-[#D29501]">{review.restaurant.title}</h3>
                      <div className="flex items-center">
                        <span className="text-gray-600 mr-1">👍</span>
                        <span>{review.upvotes}</span>
                      </div>
                    </div>
                    {renderStars(review.rating)}
                    <p className="mt-2 text-gray-700 line-clamp-3">{review.content}</p>
                    <div className="mt-3 text-right">
                      <span className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-6">
                {profile.firstName} hasn't written any reviews yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}