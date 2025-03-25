/*eslint-disable*/
"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faBookmark, faStar, faUsers, faUserPlus, faCamera, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import HomeNavbar from "../_components/Home-Navbar";
import AnimatedBackground from "../_components/AnimatedBackground";


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
          throw new Error(`Failed to fetch profile data: ${profileResponse.status} ${profileResponse.statusText}`);
        }
        
        // Log the raw response for debugging
        const responseText = await profileResponse.text();
        console.log("Raw profile API response:", responseText);
        
        // Try to parse the response as JSON
        let profileData;
        try {
          profileData = JSON.parse(responseText);
          console.log("Parsed profile data:", profileData);
        } catch (parseError) {
          console.error("Error parsing profile data:", parseError);
          throw new Error("Invalid JSON response from server");
        }
        
        // Create a default patron object if data is missing or incomplete
        const patron: Patron = {
          id: profileData?.patron?.id || profileData?.id || "unknown",
          firstName: profileData?.patron?.firstName || profileData?.firstName || "User",
          lastName: profileData?.patron?.lastName || profileData?.lastName || "",
          username: profileData?.patron?.username || profileData?.username || null,
          email: profileData?.patron?.email || profileData?.email || "unknown@example.com",
          profileImage: profileData?.patron?.profileImage || profileData?.profileImage || null,
          bio: profileData?.patron?.bio || profileData?.bio || null,
          interests: profileData?.patron?.interests || profileData?.interests || [],
          _count: profileData?.patron?._count || profileData?._count || {
            followers: 0,
            following: 0,
            reviews: 0,
            favorites: 0
          }
        };
        
        console.log("Constructed patron object:", patron);
        setProfile(patron);
        
        // Only set form states with safe defaults
        setTempUsername(patron.username ?? "");
        setTempBio(patron.bio ?? "");

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

  // Modified to work with any API response structure
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

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
        const errorText = await uploadResponse.text();
        console.error("Error response:", errorText);
        
        let errorMessage = "Failed to upload image";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }
      
      // Log the raw response for debugging
      const uploadResponseText = await uploadResponse.text();
      console.log("Raw upload response:", uploadResponseText);
      
      // Try to parse the response as JSON
      let uploadData;
      try {
        uploadData = JSON.parse(uploadResponseText);
        console.log("Parsed upload data:", uploadData);
      } catch (parseError) {
        console.error("Error parsing upload response:", parseError);
        throw new Error("Invalid JSON response from server");
      }
      
      // Update profile with new image URL
      if (uploadData?.url) {
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
          const errorText = await updateResponse.text();
          console.error("Error updating profile:", errorText);
          throw new Error("Failed to update profile with new image");
        }
        
        // Log the raw response for debugging
        const responseText = await updateResponse.text();
        console.log("Raw profile update response:", responseText);
        
        // Try to parse the response as JSON
        let updatedData;
        try {
          updatedData = JSON.parse(responseText);
          console.log("Parsed profile update data:", updatedData);
        } catch (parseError) {
          console.error("Error parsing profile update response:", parseError);
          throw new Error("Invalid JSON response from server");
        }
        
        // Update the profile with the response data or keep existing data
        const updatedPatron: Patron = {
          id: updatedData?.patron?.id || updatedData?.id || profile.id,
          firstName: updatedData?.patron?.firstName || updatedData?.firstName || profile.firstName,
          lastName: updatedData?.patron?.lastName || updatedData?.lastName || profile.lastName,
          username: updatedData?.patron?.username || updatedData?.username || profile.username,
          email: updatedData?.patron?.email || updatedData?.email || profile.email,
          profileImage: updatedData?.patron?.profileImage || updatedData?.profileImage || uploadData.url, // Use the uploaded URL if response doesn't include it
          bio: updatedData?.patron?.bio || updatedData?.bio || profile.bio,
          interests: updatedData?.patron?.interests || updatedData?.interests || profile.interests,
          _count: updatedData?.patron?._count || updatedData?._count || profile._count
        };
        
        console.log("Constructed updated patron:", updatedPatron);
        setProfile(updatedPatron);
        setSuccessMessage("Profile picture updated successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error("No image URL in upload response");
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
    setTempUsername(profile?.username ?? "");
    setIsEditingUsername(true);
  };

  // Modified to work with any API response structure
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
        const errorText = await response.text();
        console.error("Error response:", errorText);
        
        let errorMessage = "Failed to update username";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }
      
      // Log the raw response for debugging
      const responseText = await response.text();
      console.log("Raw username update response:", responseText);
      
      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed username update data:", data);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Invalid JSON response from server");
      }
      
      // Update the profile with the response data or keep existing data
      const updatedPatron: Patron = {
        id: data?.patron?.id || data?.id || profile.id,
        firstName: data?.patron?.firstName || data?.firstName || profile.firstName,
        lastName: data?.patron?.lastName || data?.lastName || profile.lastName,
        username: data?.patron?.username || data?.username || null,
        email: data?.patron?.email || data?.email || profile.email,
        profileImage: data?.patron?.profileImage || data?.profileImage || profile.profileImage,
        bio: data?.patron?.bio || data?.bio || profile.bio,
        interests: data?.patron?.interests || data?.interests || profile.interests,
        _count: data?.patron?._count || data?._count || profile._count
      };
      
      console.log("Constructed updated patron:", updatedPatron);
      setProfile(updatedPatron);
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
    setTempUsername(profile?.username ?? "");
    setIsEditingUsername(false);
  };

  // Handle inline editing of bio
  const startEditingBio = () => {
    setTempBio(profile?.bio ?? "");
    setIsEditingBio(true);
  };

  // Modified to work with any API response structure
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
        const errorText = await response.text();
        console.error("Error response:", errorText);
        
        let errorMessage = "Failed to update bio";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }
      
      // Log the raw response for debugging
      const responseText = await response.text();
      console.log("Raw bio update response:", responseText);
      
      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed bio update data:", data);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Invalid JSON response from server");
      }
      
      // Update the profile with the response data or keep existing data
      const updatedPatron: Patron = {
        id: data?.patron?.id || data?.id || profile.id,
        firstName: data?.patron?.firstName || data?.firstName || profile.firstName,
        lastName: data?.patron?.lastName || data?.lastName || profile.lastName,
        username: data?.patron?.username || data?.username || profile.username,
        email: data?.patron?.email || data?.email || profile.email,
        profileImage: data?.patron?.profileImage || data?.profileImage || profile.profileImage,
        bio: data?.patron?.bio || data?.bio || null,
        interests: data?.patron?.interests || data?.interests || profile.interests,
        _count: data?.patron?._count || data?._count || profile._count
      };
      
      console.log("Constructed updated patron:", updatedPatron);
      setProfile(updatedPatron);
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
    setTempBio(profile?.bio ?? "");
    setIsEditingBio(false);
  };


  return (
    <div className="with-navbar">
      <HomeNavbar />
      {/* Add significant padding between navbar and content - at least 100px */}
      <div className="page-content relative pt-32"> {/* Increased padding-top */}
        <AnimatedBackground />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          {/* Top navigation row with back button and certified foodie button */}
          <div className="flex justify-between items-center mb-8">
            <Link href="/patron-dashboard" className="inline-flex items-center text-gray-600 hover:text-[#D29501] transition">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back to Dashboard
            </Link>
            
            {/* Certified Foodie Button */}
            <button className="inline-flex items-center bg-[#fbdade] text-gray-60 px-4 py-2 rounded-md hover:bg-[#FFD6D9] transition">
              <FontAwesomeIcon icon={faStar} className="mr-2" />
              Become a Certified Foodie
            </button>
          </div>
          
          {profile && (
            <>
              {/* Success message */}
              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                  <span className="block sm:inline">{successMessage}</span>
                </div>
              )}

              
              <div className="flex flex-col md:flex-row gap-6">
            {/* Left sidebar - Profile card */}
            <div className="md:w-1/3">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-[#fdedf6] to-[#f1eafe] p-6 text-center">
                  <div className="relative w-32 h-32 mx-auto group cursor-pointer" onClick={handleProfilePictureClick}>
                    <div className="w-32 h-32 rounded-full bg-white border-4 border-white flex items-center justify-center overflow-hidden">
                      {profile.profileImage ? (
                        <Image
                          src={profile.profileImage}
                          alt="Profile"
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-[#fdf9f5]/50 text-gray-400 text-3xl font-bold">
                          {profile.firstName && profile.lastName ? 
                            `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}` : 'U'}
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <FontAwesomeIcon icon={faCamera} className="text-white text-xl" />
                    </div>
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                      </div>
                    )}
                    
                    {/* Purple badge in the bottom corner */}
                    <div className="absolute bottom-0 right-0 bg-purple-400 rounded-full w-8 h-8 flex items-center justify-center">
                      <FontAwesomeIcon icon={faCamera} className="text-white text-xs" />
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-800 mt-4">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  
                  <p className="text-gray-700">Food Explorer</p>
                </div>
                
                <div className="p-4 space-y-3">
                  {/* Member since card */}
                  <div className="bg-[#fdf9f5] rounded-lg p-3">
                    <p className="text-gray-600 text-sm font-medium mb-1">Member since</p>
                    <p className="text-gray-800">June 2023</p>
                  </div>
                  
                  {/* Reviews card */}
                  <div className="bg-[#fdedf6] rounded-lg p-3">
                    <p className="text-gray-600 text-sm font-medium mb-1">Reviews</p>
                    <p className="text-gray-800">{profile._count?.reviews || 0} restaurants</p>
                  </div>
                  
                  {/* Favorite cuisines card */}
                  <div className="bg-[#f1eafe] rounded-lg p-3">
                    <p className="text-gray-600 text-sm font-medium mb-1">Favorite cuisines</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.interests && profile.interests.length > 0 ? (
                        <p className="text-gray-800">{profile.interests.join(", ")}</p>
                      ) : (
                        <span className="text-gray-500">No favorites yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
                
          {/* Right content - Edit profile form */}
          <div className="md:w-2/3">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-[#f2d36e] rounded-full flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#f2d36e]">Edit Profile</h2>
              </div>
              
              <p className="text-gray-600 mb-6">Update your profile information and food preferences</p>
              
              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={`${profile.firstName} ${profile.lastName}`}
                    disabled
                    className="w-full p-3 bg-white border border-[#fdf9f5] rounded-md text-gray-700 focus:outline-none focus:border-2 focus:border-[#fdf9f5]"
                  />
                </div>
                
                {/* Email */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full p-3 bg-white border border-[#fdf9f5] rounded-md text-gray-700 focus:outline-none focus:border-2 focus:border-[#fdf9f5]"
                  />
                </div>
                
                {/* Location */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Location</label>
                  <div className="relative">
                    <select className="w-full p-3 appearance-none bg-white border border-[#fdedf6] rounded-md text-gray-700 focus:outline-none focus:border-2 focus:border-[#fdedf6]">
                      <option>New York, NY</option>
                      <option>Los Angeles, CA</option>
                      <option>Chicago, IL</option>
                      <option>Houston, TX</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Username */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Username</label>
                  {isEditingUsername ? (
                    <div className="flex">
                      <input
                        type="text"
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        className="flex-1 p-3 bg-white border border-[#f1eafe] rounded-l-md focus:outline-none focus:border-2 focus:border-[#f1eafe]"
                        placeholder="Choose a username"
                      />
                      <button 
                        onClick={saveUsername}
                        className="p-3 bg-green-500 text-white hover:bg-green-600"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button 
                        onClick={cancelEditingUsername}
                        className="p-3 bg-red-500 text-white rounded-r-md hover:bg-red-600"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex">
                      <input
                        type="text"
                        value={profile.username || ""}
                        disabled
                        placeholder="No username set"
                        className="flex-1 p-3 bg-white border border-[#f1eafe] rounded-l-md text-gray-700 focus:outline-none focus:border-2 focus:border-[#f1eafe]"
                      />
                      <button 
                        onClick={startEditingUsername}
                        className="p-3 bg-[#f2d36e] text-white rounded-r-md hover:bg-[#f2d36e]/90"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Bio */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Bio</label>
                  {isEditingBio ? (
                    <div>
                      <textarea
                        value={tempBio}
                        onChange={(e) => setTempBio(e.target.value)}
                        className="w-full p-3 bg-white border border-[#fbe9fc] rounded-md focus:outline-none focus:border-2 focus:border-[#fbe9fc]"
                        placeholder="Tell us about yourself..."
                        rows={4}
                      ></textarea>
                      <div className="flex justify-end mt-2 space-x-2">
                        <button 
                          onClick={saveBio}
                          className="px-4 py-2 bg-[#f2d36e] text-white rounded-md hover:bg-[#f2d36e]/90"
                        >
                          <FontAwesomeIcon icon={faCheck} className="mr-1" /> Save
                        </button>
                        <button 
                          onClick={cancelEditingBio}
                          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                        >
                          <FontAwesomeIcon icon={faTimes} className="mr-1" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={profile.bio || ""}
                        disabled
                        placeholder="No bio available"
                        className="w-full p-3 bg-white border border-[#fbe9fc] rounded-md text-gray-700 focus:outline-none focus:border-2 focus:border-[#fbe9fc]"
                        rows={4}
                      ></textarea>
                      <div className="flex justify-end mt-2">
                        <button 
                          onClick={startEditingBio}
                          className="px-4 py-2 bg-[#f2d36e] text-white rounded-md hover:bg-[#f2d36e]/90"
                        >
                          <FontAwesomeIcon icon={faEdit} className="mr-1" /> Edit Bio
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">This will be displayed on your public profile</p>
                </div>
                
                {/* Dietary Preferences */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Dietary Preferences</label>
                  <input
                    type="text"
                    defaultValue="Vegetarian options, low-carb meals"
                    className="w-full p-3 bg-white border border-[#fdf9f5] rounded-md text-gray-700 focus:outline-none focus:border-2 focus:border-[#fdf9f5]"
                  />
                  <p className="text-xs text-gray-500 mt-1">This helps us recommend restaurants that match your preferences</p>
                </div>
                
                {/* Favorite Foods */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Favorite Foods</label>
                  <input
                    type="text"
                    defaultValue="Italian pasta, Japanese sushi"
                    className="w-full p-3 bg-white border border-[#fdedf6] rounded-md text-gray-700 focus:outline-none focus:border-2 focus:border-[#fdedf6]"
                  />
                </div>
                
                {/* Save/Cancel buttons */}
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#f2d36e] text-white rounded-md hover:bg-[#f2d36e]/90 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}