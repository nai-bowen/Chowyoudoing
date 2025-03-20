// /src/app/_components/CertifiedFoodieBadge.tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward } from "@fortawesome/free-solid-svg-icons";

interface CertifiedFoodieBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const CertifiedFoodieBadge: React.FC<CertifiedFoodieBadgeProps> = ({
  size = "md",
  showText = true
}) => {
  // Define size classes based on the size prop
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };
  
  // Define icon sizes
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };
  
  // Define padding based on size
  const paddingClasses = {
    sm: showText ? "px-1.5 py-0.5" : "p-1",
    md: showText ? "px-2 py-1" : "p-1.5",
    lg: showText ? "px-3 py-1.5" : "p-2"
  };
  
  return (
    <span 
      className={`${paddingClasses[size]} bg-yellow-100 text-yellow-800 ${sizeClasses[size]} rounded-full flex items-center`}
      title="Certified Foodie"
    >
      <FontAwesomeIcon icon={faAward} className={`${iconSizes[size]} text-yellow-500 ${showText ? 'mr-1' : ''}`} />
      {showText && <span>Certified Foodie</span>}
    </span>
  );
};

export default CertifiedFoodieBadge;