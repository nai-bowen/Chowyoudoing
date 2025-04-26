/*eslint-disable*/
// src/app/_components/ReferralCodeInput.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faTag, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";

interface ReferralCodeInputProps {
  onCodeChange: (code: string, isValid: boolean) => void;
  initialCode?: string;
  className?: string;
}

const ReferralCodeInput: React.FC<ReferralCodeInputProps> = ({ 
  onCodeChange, 
  initialCode = "", 
  className = "" 
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [validationStatus, setValidationStatus] = useState<"unchecked" | "valid" | "invalid">("unchecked");
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Check if the referral code is valid
  const checkReferralCode = async (codeToCheck: string): Promise<void> => {
    if (!codeToCheck.trim()) {
      setValidationStatus("unchecked");
      onCodeChange("", false);
      return;
    }

    setIsChecking(true);

    try {
      const response = await fetch(`/api/restaurateur/validate-referral?code=${encodeURIComponent(codeToCheck)}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setValidationStatus("valid");
        onCodeChange(codeToCheck, true);
      } else {
        setValidationStatus("invalid");
        onCodeChange(codeToCheck, false);
      }
    } catch (error) {
      console.error("Error validating referral code:", error);
      setValidationStatus("invalid");
      onCodeChange(codeToCheck, false);
    } finally {
      setIsChecking(false);
    }
  };

  // Debounce the validation check
  useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Skip empty codes
    if (!code.trim()) {
      setValidationStatus("unchecked");
      onCodeChange("", false);
      return;
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      checkReferralCode(code);
    }, 500); // Debounce for 500ms

    setDebounceTimeout(timeout);

    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [code]);

  // Format the input to be uppercase
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newCode = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
    setCode(newCode);
  };

  // Choose the right icon based on validation status
  const getStatusIcon = (): JSX.Element | null => {
    if (isChecking) {
      return <FontAwesomeIcon icon={faSpinner} spin className="text-gray-400" />;
    }
    
    if (!code) {
      return null;
    }
    
    switch (validationStatus) {
      case "valid":
        return <FontAwesomeIcon icon={faCheck} className="text-green-500" />;
      case "invalid":
        return <FontAwesomeIcon icon={faTimes} className="text-red-500" />;
      default:
        return null;
    }
  };

  // Get message text based on validation status
  const getMessage = (): JSX.Element | null => {
    if (!code || isChecking) {
      return null;
    }
    
    switch (validationStatus) {
      case "valid":
        return <p className="text-xs text-green-600 mt-1">Valid referral code</p>;
      case "invalid":
        return <p className="text-xs text-red-600 mt-1">Invalid referral code</p>;
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <label htmlFor="referralCode" className="block text-[#dbbaf8] font-medium mb-1">
        Referral Code (Optional)
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FontAwesomeIcon icon={faTag} className="text-gray-400" />
        </div>
        <input
          type="text"
          id="referralCode"
          value={code}
          onChange={handleInputChange}
          placeholder="Enter referral code (8 characters)"
          className={`w-full p-3 pl-10 pr-10 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                     focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8] ${
                       validationStatus === "valid" 
                         ? "border-green-300" 
                         : validationStatus === "invalid" 
                           ? "border-red-300" 
                           : ""
                     }`}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {getStatusIcon()}
        </div>
      </div>
      {getMessage()}
    </div>
  );
};

export default ReferralCodeInput;