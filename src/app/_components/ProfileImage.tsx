import { useState } from 'react';
import Image from 'next/image';

interface ProfileImageProps {
  profileImage: string | null | undefined;
  name?: string;
  size?: number;
  className?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({ 
  profileImage, 
  name = "", 
  size = 64,
  className = ""
}) => {
  const [imageError, setImageError] = useState<boolean>(false);
  
  // Process the profile image URL
  const getValidImageUrl = (imageUrl: string | null | undefined): string => {
    // If no image provided or error loading, use fallback
    if (!imageUrl || imageUrl === "") {
      return "/assets/default-profile.png";
    }
    
    // Check if the URL is the default one without path
    if (imageUrl === "default-profile.jpg") {
      return "/assets/default-profile.png";
    }
    
    // Handle relative paths properly
    if (!imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
      return `/${imageUrl}`;
    }
    
    return imageUrl;
  };

  // Get initial for fallback
  const getInitial = (): string => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div 
      className={`bg-[#f2d36e] rounded-full flex items-center justify-center overflow-hidden ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {!imageError && profileImage ? (
        <Image
          src={getValidImageUrl(profileImage)}
          alt={`${name || 'User'}'s profile`}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onError={() => setImageError(true)}
          priority
        />
      ) : (
        <p className="text-white font-bold" style={{ fontSize: `${size/2.5}px` }}>
          {getInitial()}
        </p>
      )}
    </div>
  );
};

export default ProfileImage;