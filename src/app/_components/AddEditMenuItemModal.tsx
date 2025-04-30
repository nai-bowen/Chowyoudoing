// src/app/_components/AddEditMenuItemModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faSpinner, 
  faPlus, 
  faTrash, 
  faImage, 
  faExclamationCircle 
} from "@fortawesome/free-solid-svg-icons";
import PremiumSubscriptionModal from "./PremiumSubscriptionModal";

interface Interest {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  img_url: string | null;
  interestId: string | null;
}

interface AddEditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: {
    name: string;
    description: string | null;
    price: string;
    interestId: string | null;
    img_url?: string | null;
  }) => Promise<void>;
  item: MenuItem | null;
  interests: Interest[];
}

export default function AddEditMenuItemModal({
  isOpen,
  onClose,
  onSave,
  item,
  interests
}: AddEditMenuItemModalProps): JSX.Element | null {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [interestId, setInterestId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageUploadStatus, setImageUploadStatus] = useState<{
    isPremium: boolean;
    canUpload: boolean;
    remainingUploads: number | string;
    totalImagesUsed?: number;
    maxImagesAllowed?: number;
  } | null>(null);
  
  // Premium modal state
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);

  // Reference to file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form state when modal opens
      setErrors({});
      setUploadError(null);
      setIsSubmitting(false);
      setIsUploading(false);
      
      // Set initial values if editing an item
      if (item) {
        setName(item.name || "");
        setDescription(item.description || "");
        setPrice(item.price || "");
        setInterestId(item.interestId || "");
        setImageUrl(item.img_url || null);
      } else {
        // Reset form for new item
        setName("");
        setDescription("");
        setPrice("");
        setInterestId("");
        setImageUrl(null);
      }
      
      // Fetch image upload status
      fetchImageUploadStatus();
    }
  }, [isOpen, item]);

  const fetchImageUploadStatus = async (): Promise<void> => {
    try {
      const response = await fetch("/api/restaurateur/menu-image-check");
      if (response.ok) {
        const data = await response.json();
        setImageUploadStatus(data);
      } else {
        console.error("Failed to check image upload status");
      }
    } catch (error) {
      console.error("Error checking image upload status:", error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!price.trim()) {
      newErrors.price = "Price is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSave({
        name,
        description: description || null,
        price,
        interestId: interestId || null,
        img_url: imageUrl
      });
      
      // Close modal after successful save
      onClose();
    } catch (error) {
      console.error("Error saving menu item:", error);
      
      // Check if this is a premium-required error
      if (error instanceof Error && error.message.includes("premium")) {
        setIsPremiumModalOpen(true);
      } else {
        setErrors({ submit: error instanceof Error ? error.message : "An error occurred" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadClick = (): void => {
    // Check if user can upload images
    if (!imageUploadStatus?.canUpload && !imageUploadStatus?.isPremium) {
      setIsPremiumModalOpen(true);
      return;
    }
    
    // Trigger file input click
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }
      
      const data = await response.json();
      setImageUrl(data.url);
      
      // Refresh upload status
      fetchImageUploadStatus();
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadError(error instanceof Error ? error.message : "Error uploading image");
    } finally {
      setIsUploading(false);
      // Clear input value to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (): void => {
    setImageUrl(null);
  };

  const handlePremiumModalClose = (): void => {
    setIsPremiumModalOpen(false);
  };

  const handlePremiumSubscribed = async (): Promise<void> => {
    // Refresh premium status after subscribing
    await fetchImageUploadStatus();
    setIsPremiumModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-[#faf2e5] px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {item ? "Edit Menu Item" : "Add Menu Item"}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {/* Name Field */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter item name"
                  className={`w-full px-3 py-2 border ${
                    errors.name ? "border-red-300" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              
              {/* Description Field */}
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter item description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                />
              </div>
              
              {/* Price Field */}
              <div className="mb-4">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="text"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price (e.g. £9.99)"
                  className={`w-full px-3 py-2 border ${
                    errors.price ? "border-red-300" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                )}
              </div>
              
              {/* Interest Field */}
              <div className="mb-4">
                <label htmlFor="interest" className="block text-sm font-medium text-gray-700 mb-1">
                  Food Category
                </label>
                <select
                  id="interest"
                  value={interestId}
                  onChange={(e) => setInterestId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                >
                  <option value="">None</option>
                  {interests.map((interest) => (
                    <option key={interest.id} value={interest.id}>
                      {interest.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Image Upload Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Image
                </label>
                
                {/* Image upload status for non-premium users */}
                {imageUploadStatus && !imageUploadStatus.isPremium && (
                  <div className="mb-2 text-sm bg-[#faf2e5] p-2 rounded-md flex items-start">
                    <FontAwesomeIcon icon={faImage} className="text-[#f2d36e] mt-1 mr-2" />
                    <div>
                      <p>
                        <strong>Free account:</strong> {imageUploadStatus.remainingUploads} of {imageUploadStatus.maxImagesAllowed} image uploads remaining.
                      </p>
                      <p>Upgrade to premium for unlimited images.</p>
                    </div>
                  </div>
                )}
                
                {/* Image Preview */}
                {imageUrl ? (
                  <div className="relative mb-3 border rounded-lg overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt="Menu item preview" 
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <FontAwesomeIcon icon={faTrash} size="sm" />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 mb-3"
                    onClick={handleUploadClick}
                  >
                    <FontAwesomeIcon icon={faImage} className="text-gray-400 text-3xl mb-2" />
                    <p className="text-gray-500">Click to upload an image</p>
                    {imageUploadStatus && !imageUploadStatus.canUpload && !imageUploadStatus.isPremium && (
                      <p className="text-red-500 text-sm mt-1">Upgrade to premium for more images</p>
                    )}
                  </div>
                )}
                
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                
                {isUploading && (
                  <div className="flex items-center text-blue-500 text-sm">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Uploading image...
                  </div>
                )}
                
                {uploadError && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                    {uploadError}
                  </p>
                )}
              </div>
              
              {/* Form Submission Error */}
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {errors.submit}
                </div>
              )}
              
              {/* Form Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#dab9f8] text-white rounded-lg hover:bg-[#c9a2f2] disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : item ? "Update Item" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Premium Subscription Modal */}
      <PremiumSubscriptionModal
        isOpen={isPremiumModalOpen}
        onClose={handlePremiumModalClose}
        onSubscribe={handlePremiumSubscribed}
        feature="image_upload"
      />
    </>
  );
}