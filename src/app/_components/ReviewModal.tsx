// ReviewModal.tsx
"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

interface Patron {
  firstName: string;
  lastName: string;
}

interface Review {
  content: string;
  rating: number;
  imageUrl?: string;
  patron?: Patron;
  reviewStandards?: string;
  date?: string;
}

interface ReviewModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewModal({ review, isOpen, onClose }: ReviewModalProps): JSX.Element {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle click outside to close modal
    function handleClickOutside(event: MouseEvent): void {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Handle ESC key to close modal
    function handleEscKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return <></>;

  const renderStars = (rating: number): JSX.Element => {
    const stars: JSX.Element[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`text-2xl ${i <= rating ? "text-yellow-400" : "text-gray-300"}`}>
          ★
        </span>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#D29501]">Review Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            {renderStars(review.rating)}
            {review.date && (
              <p className="text-sm text-gray-500 mt-1">{review.date}</p>
            )}
          </div>

          <div className="mb-6">
            <p className="text-lg italic mb-4">"{review.content}"</p>
            <p className="text-right font-semibold text-[#A90D3C]">
              - {review.patron?.firstName || "Anonymous"} {review.patron?.lastName || ""}
            </p>
          </div>

          {review.imageUrl && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Photos</h3>
              <div className="relative h-64 w-full">
                <Image
                  src={review.imageUrl}
                  alt="Review image"
                  className="rounded-lg object-cover"
                  fill
                />
              </div>
            </div>
          )}

          {review.reviewStandards && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Review Standards</h3>
              <p className="text-gray-700">{review.reviewStandards}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}