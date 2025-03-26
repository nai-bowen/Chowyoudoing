/*eslint-disable*/
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/app/_components/Home-Navbar";
import EditReviewModal from "@/app/_components/EditReviewModal";

/**
 * This page is a fallback for direct URL access to /review/edit/[id]
 * Normal edit operations should happen through the modal in the dashboard
 */
export default function EditReviewPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const reviewId = params.id as string;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);
  const [hasModalBeenShown, setHasModalBeenShown] = useState<boolean>(false);

  // Set modal as shown when it's first rendered
  useEffect(() => {
    if (isModalOpen && !hasModalBeenShown) {
      setHasModalBeenShown(true);
    }
  }, [isModalOpen, hasModalBeenShown]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Handle modal close
  const handleModalClose = (): void => {
    setIsModalOpen(false);
    // Redirect back to dashboard after modal is closed
    router.push("/patron-dashboard");
  };

  // Handle successful edit
  const handleEditSuccess = (): void => {
    // This will be called when the edit is successful
    // The modal component itself will handle the messaging and closing
    setTimeout(() => {
      router.push("/patron-dashboard");
    }, 1500);
  };

  return (
    <div className="with-navbar">
      <Navbar />
      <div className="page-content">
        <div className="min-h-screen bg-[#FFF5E1] p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-[#D29501] mb-6">Edit Review</h1>
            <p className="text-gray-600">
              {status === "loading" 
                ? "Loading..." 
                : hasModalBeenShown && !isModalOpen
                  ? "Redirecting to dashboard..."
                  : "Use the form below to edit your review."
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* Modal for editing review */}
      {status === "authenticated" && (
        <EditReviewModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          reviewId={reviewId}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}