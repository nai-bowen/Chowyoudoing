// src/app/_components/PremiumButton.tsx
"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown } from "@fortawesome/free-solid-svg-icons";
import PremiumSubscriptionModal from "./PremiumSubscriptionModal";

interface PremiumButtonProps {
  className?: string;
  feature?: "image_upload" | "review_response" | "analytics" | "visibility";
}

export default function PremiumButton({ 
  className = "", 
  feature 
}: PremiumButtonProps): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleOpenModal = (): void => {
    setIsModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
  };

  const handleSubscribe = (): void => {
    // This will be handled inside the modal component with the redirect
    console.log("Handling subscription");
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#dab9f8] to-[#f2d36f] text-white rounded-full hover:opacity-90 transition-all shadow-md ${className}`}
      >
        <FontAwesomeIcon icon={faCrown} className="text-white" />
        <span>Get Premium</span>
      </button>

      <PremiumSubscriptionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubscribe={handleSubscribe}
        feature={feature}
      />
    </>
  );
}