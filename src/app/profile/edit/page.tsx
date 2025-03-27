/*eslint-disable*/
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "../../_components/navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes, faCamera } from "@fortawesome/free-solid-svg-icons";

interface Patron {
  id: string;
  firstName: string;
  lastName: string;
  username: string | null;
  email: string;
  profileImage: string | null;
  bio: string | null;
  interests: string[];
}

export default function EditProfilePage(): JSX.Element {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Form state
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
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
        const response = await fetch("/api/profile");
        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }
        
        const data = await response.json();
        const profile = data.patron as Patron;
        
        // Set form state with profile data
        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
        setUsername(profile.username || "");
        setBio(profile.bio || "");
        setInterests(profile.interests || []);
        setProfileImage(profile.profileImage || null);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [session, status]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          bio,
          interests,
          profileImage
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      
      setSaveSuccess(true);
      
      // Redirect back to profile page after short delay
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle interest tags
  const addInterest = () => {
    if (!newInterest.trim()) return;
    if (!interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
    }
    setNewInterest("");
  };
  
  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };
  
  // Handle key press in interest input
  const handleInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterest();
    }
  };
  
  // Handle image upload (simplified version - would need a proper upload endpoint)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In a real implementation, you would upload the file to a server or cloud storage
    // For this example, we'll create a placeholder using a data URL
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="with-navbar">
        <Navbar />
        <div className="page-content">
          <div className="flex justify-center items-center min-h-screen">
            <p className="text-xl">Loading profile data...</p>
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
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-[#D29501] mb-6">Edit Profile</h1>
            
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            {saveSuccess && (
              <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
                Profile updated successfully!
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-2">
                  <Image
                    src={profileImage || "/assets/default-profile.png"}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                  />
                  <label htmlFor="profile-image-upload" className="absolute -bottom-2 -right-2 bg-[#D29501] text-white p-2 rounded-full cursor-pointer">
                    <FontAwesomeIcon icon={faCamera} />
                  </label>
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500">Upload a new profile picture</p>
              </div>
              
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D29501]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D29501]"
                    required
                  />
                </div>
              </div>
              
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                    @
                  </span>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#D29501]"
                    required
                  />
                </div>
              </div>
              
              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D29501]"
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              {/* Interests */}
              <div>
                <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">
                  Food Interests
                </label>
                <div className="mb-2">
                  <div className="flex">
                    <input
                      type="text"
                      id="interests"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={handleInterestKeyPress}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#D29501]"
                      placeholder="Add food interests (e.g., Italian, Vegan, Spicy)"
                    />
                    <button
                      type="button"
                      onClick={addInterest}
                      className="px-4 py-2 bg-[#D29501] text-white rounded-r-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {interests.map((interest, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 bg-[#FFF5E1] rounded-full text-sm flex items-center"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="ml-2 text-gray-500 hover:text-red-500 focus:outline-none"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ))}
                  {interests.length === 0 && (
                    <p className="text-gray-500 text-sm">No interests added yet</p>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D29501] text-white rounded-lg hover:bg-[#b37e01] disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}