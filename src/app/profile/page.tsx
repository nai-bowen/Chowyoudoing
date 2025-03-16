/*eslint-disable*/
"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "../_components/navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faBookmark, faStar, faUsers, faUserPlus, faCamera, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

// Define types for our profile data
interface Patron {
  id: string;
  firstName: string;
  lastName: string;
  username: string | null;
  email: string;
  profileImage: string | null;
  bio: string | null;
  interests: string[];
  _count?: {
    followers: number;
    following: number;
    reviews: number;
    favorites: number;
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

interface Favorite {
  id: string;
  createdAt: string;
  restaurant?: {
    id: string;
    title: string;
    location: string | null;
    category: string[];
  } | null;
  review?: {
    id: string;
    content: string;
    rating: number;
    restaurant: {
      title: string;
    };
  } | null;
}

export default function ProfilePage(): JSX.Element {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Patron | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [activeTab, setActiveTab] = useState<"reviews" | "favorites">("reviews");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Inline editing states
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [tempUsername, setTempUsername] = useState<string>("");
  const [tempBio, setTempBio] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch profile data when session is available
  useEffect(() => {
    const fetchProfileData = async () => {
      if (status !== "authenticated" || !session?.user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch profile data
        const profileResponse = await fetch("/api/profile");
        if (!profileResponse.ok) {
          throw new Error("Failed to fetch profile data");
        }
        const profileData = await profileResponse.json();
        setProfile(profileData.patron);
        setTempUsername(profileData.patron.username || "");
        setTempBio(profileData.patron.bio || "");

        // Fetch user reviews
        const reviewsResponse = await fetch(`/api/review?userId=${session.user.id}`);
        if (!reviewsResponse.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData.reviews || []);

        // Fetch favorites
        const favoritesResponse = await fetch("/api/profile/favorites");
        if (!favoritesResponse.ok) {
          const errorData = await favoritesResponse.json();
          // Only throw an error if it's not just an empty favorites list
          if (errorData.error !== "No favorites found") {
            throw new Error("Failed to fetch favorites");
          }
          // Set empty array for favorites if none found
          setFavorites([]);
        } else {
          const favoritesData = await favoritesResponse.json();
          setFavorites(favoritesData.favorites || []);
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [session, status]);

  // Handle tab switching
  const handleTabChange = (tab: "reviews" | "favorites") => {
    setActiveTab(tab);
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

  // Profile picture upload handler
  const handleProfilePictureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");
      
      // Upload to Cloudinary
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload image");
      }
      
      const uploadData = await uploadResponse.json();
      
      // Update profile with new image URL
      if (uploadData.url) {
        const updateResponse = await fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...profile,
            profileImage: uploadData.url
          }),
        });
        
        if (!updateResponse.ok) {
          throw new Error("Failed to update profile with new image");
        }
        
        const updatedData = await updateResponse.json();
        setProfile(updatedData.patron);
        setSuccessMessage("Profile picture updated successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      console.error("Error updating profile picture:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile picture");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle inline editing of username
  const startEditingUsername = () => {
    setTempUsername(profile?.username || "");
    setIsEditingUsername(true);
  };

  const saveUsername = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profile,
          username: tempUsername.trim() || null
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update username");
      }
      
      const data = await response.json();
      setProfile(data.patron);
      setSuccessMessage("Username updated successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error updating username:", err);
      setError(err instanceof Error ? err.message : "Failed to update username");
    } finally {
      setIsEditingUsername(false);
      setIsLoading(false);
    }
  };

  const cancelEditingUsername = () => {
    setTempUsername(profile?.username || "");
    setIsEditingUsername(false);
  };

  // Handle inline editing of bio
  const startEditingBio = () => {
    setTempBio(profile?.bio || "");
    setIsEditingBio(true);
  };

  const saveBio = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profile,
          bio: tempBio.trim() || null
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update bio");
      }
      
      const data = await response.json();
      setProfile(data.patron);
      setSuccessMessage("Bio updated successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error updating bio:", err);
      setError(err instanceof Error ? err.message : "Failed to update bio");
    } finally {
      setIsEditingBio(false);
      setIsLoading(false);
    }
  };

  const cancelEditingBio = () => {
    setTempBio(profile?.bio || "");
    setIsEditingBio(false);
  };

  if (isLoading && !profile) {
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

  if (error && !profile) {
    return (
      <div className="with-navbar">
        <Navbar />
        <div className="page-content">
          <div className="flex flex-col justify-center items-center min-h-screen">
            <p className="text-xl text-red-600">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#D29501] text-white rounded-lg"
            >
              Try Again
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
          {profile && (
            <>
              {/* Success message */}
              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                  <span className="block sm:inline">{successMessage}</span>
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
            
              {/* Profile Header */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row">
                  <div className="relative w-32 h-32 mx-auto md:mx-0 group cursor-pointer" onClick={handleProfilePictureClick}>
                    <Image
                      src={profile.profileImage || "/assets/default-profile.jpg"}
                      alt="Profile"
                      fill
                      sizes="128px"
                      className="rounded-full object-cover"
                      loader={({ src }) => {
                        // Handle Cloudinary images
                        if (src.includes('cloudinary.com')) {
                          return src;
                        }
                        // Handle local images
                        return src;
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <FontAwesomeIcon icon={faCamera} className="text-white text-xl" />
                    </div>
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <div className="md:ml-8 mt-4 md:mt-0 flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-2xl font-bold text-[#D29501]">
                          {profile.firstName} {profile.lastName}
                        </h1>
                        
                        {/* Editable username */}
                        {isEditingUsername ? (
                          <div className="flex items-center mt-1">
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">@</span>
                              <input
                                type="text"
                                value={tempUsername}
                                onChange={(e) => setTempUsername(e.target.value)}
                                className="pl-6 pr-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D29501]"
                                placeholder="username"
                              />
                            </div>
                            <button 
                              onClick={saveUsername}
                              className="ml-2 p-1 bg-green-500 text-white rounded-full"
                              title="Save username"
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button 
                              onClick={cancelEditingUsername}
                              className="ml-1 p-1 bg-red-500 text-white rounded-full"
                              title="Cancel"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <p className="text-gray-500">@{profile.username || "username"}</p>
                            <button 
                              onClick={startEditingUsername}
                              className="ml-2 text-gray-500 hover:text-[#D29501]"
                              title="Edit username"
                            >
                              <FontAwesomeIcon icon={faEdit} size="sm" />
                            </button>
                          </div>
                        )}
                      </div>
                      <Link
                        href="/profile/edit"
                        className="px-4 py-2 bg-[#A90D3C] text-white rounded-lg flex items-center"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-2" />
                        Edit Profile
                      </Link>
                    </div>
                    
                    {/* Editable bio */}
                    {isEditingBio ? (
                      <div className="mt-2">
                        <textarea
                          value={tempBio}
                          onChange={(e) => setTempBio(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D29501]"
                          placeholder="Add a bio..."
                          rows={3}
                        ></textarea>
                        <div className="flex justify-end mt-1">
                          <button 
                            onClick={saveBio}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg mr-2"
                            title="Save bio"
                          >
                            <FontAwesomeIcon icon={faCheck} className="mr-1" /> Save
                          </button>
                          <button 
                            onClick={cancelEditingBio}
                            className="px-3 py-1 bg-gray-500 text-white rounded-lg"
                            title="Cancel"
                          >
                            <FontAwesomeIcon icon={faTimes} className="mr-1" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-start">
                        <p className="text-gray-700">{profile.bio || "No bio available"}</p>
                        <button 
                          onClick={startEditingBio}
                          className="ml-2 text-gray-500 hover:text-[#D29501] mt-1"
                          title="Edit bio"
                        >
                          <FontAwesomeIcon icon={faEdit} size="sm" />
                        </button>
                      </div>
                    )}
                    
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#D29501]">
                      {profile._count?.reviews || 0}
                    </p>
                    <p className="text-gray-600">Reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#D29501]">
                      {profile._count?.favorites || 0}
                    </p>
                    <p className="text-gray-600">Favorites</p>
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

              {/* Tabs Navigation */}
              <div className="flex mb-6 border-b border-gray-200">
                <button
                  className={`px-6 py-3 font-medium text-lg ${
                    activeTab === "reviews"
                      ? "text-[#D29501] border-b-2 border-[#D29501]"
                      : "text-gray-600"
                  }`}
                  onClick={() => handleTabChange("reviews")}
                >
                  <FontAwesomeIcon icon={faStar} className="mr-2" />
                  My Reviews
                </button>
                <button
                  className={`px-6 py-3 font-medium text-lg ${
                    activeTab === "favorites"
                      ? "text-[#D29501] border-b-2 border-[#D29501]"
                      : "text-gray-600"
                  }`}
                  onClick={() => handleTabChange("favorites")}
                >
                  <FontAwesomeIcon icon={faBookmark} className="mr-2" />
                  My Favorites
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "reviews" && (
                <div className="reviews-tab">
                  <h2 className="text-xl font-bold mb-4">Your Reviews</h2>
                  
                  {reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-[#D29501]">{review.restaurant.title}</h3>
                            <div className="flex items-center">
                              <span className="text-gray-600 mr-1">👍</span>
                              <span>{review.upvotes}</span>
                            </div>
                          </div>
                          {renderStars(review.rating)}
                          <p className="mt-2 text-gray-700 line-clamp-3">{review.content}</p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                            <span className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                            <Link
                              href={`/review/edit/${review.id}`}
                              className="text-[#A90D3C] hover:underline text-sm"
                            >
                              Edit Review
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                      <p className="text-gray-600 mb-4">You haven't written any reviews yet.</p>
                      <Link
                        href="/patron-search"
                        className="px-4 py-2 bg-[#D29501] text-white rounded-lg inline-block"
                      >
                        Find Restaurants to Review
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "favorites" && (
                <div className="favorites-tab">
                  <h2 className="text-xl font-bold mb-4">Your Favorites</h2>
                  
                  {favorites && favorites.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favorites.map((favorite) => (
                        <div key={favorite.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                          {favorite.restaurant ? (
                            // Restaurant favorite
                            <>
                              <h3 className="font-semibold text-[#D29501] mb-2">
                                {favorite.restaurant.title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                {favorite.restaurant.location || "No location specified"}
                              </p>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {favorite.restaurant.category && favorite.restaurant.category.map((cat, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-[#FFF5E1] rounded-full text-xs"
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </div>
                              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                                <span className="text-sm text-gray-500">
                                  Saved on {formatDate(favorite.createdAt)}
                                </span>
                                <Link
                                  href={`/restaurants/${favorite.restaurant.id}`}
                                  className="text-[#A90D3C] hover:underline text-sm"
                                >
                                  View Restaurant
                                </Link>
                              </div>
                            </>
                          ) : favorite.review ? (
                            // Review favorite
                            <>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-[#D29501]">
                                  {favorite.review.restaurant.title}
                                </h3>
                              </div>
                              {renderStars(favorite.review.rating)}
                              <p className="mt-2 text-gray-700 line-clamp-3">{favorite.review.content}</p>
                              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                                <span className="text-sm text-gray-500">
                                  Saved on {formatDate(favorite.createdAt)}
                                </span>
                                <button
                                  className="text-[#A90D3C] hover:underline text-sm"
                                  onClick={() => {
                                    // TODO: Implement view review details
                                  }}
                                >
                                  View Review
                                </button>
                              </div>
                            </>
                          ) : (
                            <p className="text-gray-600">Invalid favorite item</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                      <p className="text-gray-600 mb-4">You don't have any favorites yet.</p>
                      <Link
                        href="/patron-search"
                        className="px-4 py-2 bg-[#D29501] text-white rounded-lg inline-block"
                      >
                        Explore Restaurants
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}