import React from 'react';
import { Receipt, Check } from 'lucide-react';

interface VerificationBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  placement?: 'inline' | 'corner';
}

/**
 * A badge component to indicate that a review has been verified with a receipt
 */
const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  size = 'md', 
  showText = true,
  placement = 'inline'
}) => {
  // Size mappings
  const sizeClasses = {
    sm: {
      badge: "px-1.5 py-0.5 text-xs",
      icon: "w-3 h-3 mr-0.5",
      cornerBadge: "p-1 rounded-full",
      cornerIcon: "w-3 h-3"
    },
    md: {
      badge: "px-2 py-1 text-sm",
      icon: "w-3.5 h-3.5 mr-1",
      cornerBadge: "p-1.5 rounded-full",
      cornerIcon: "w-4 h-4"
    },
    lg: {
      badge: "px-2.5 py-1.5 text-sm",
      icon: "w-4 h-4 mr-1.5",
      cornerBadge: "p-2 rounded-full",
      cornerIcon: "w-5 h-5"
    }
  };

  // For corner placement (absolute positioned on parent)
  if (placement === 'corner') {
    return (
      <div className={`absolute top-2 right-2 z-10 bg-green-500 text-white ${sizeClasses[size].cornerBadge}`}>
        <Check className={sizeClasses[size].cornerIcon} />
      </div>
    );
  }

  // For inline placement (within text flow)
  return (
    <span className={`inline-flex items-center rounded-full bg-green-100 text-green-800 ${sizeClasses[size].badge}`}>
      <Receipt className={sizeClasses[size].icon} />
      {showText && <span>Verified</span>}
    </span>
  );
};

export default VerificationBadge;