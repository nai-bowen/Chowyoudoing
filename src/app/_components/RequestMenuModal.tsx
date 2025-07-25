"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface RequestMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  restaurantName: string;
  location: string;
  link: string;
  details: string;
}

const RequestMenuModal: React.FC<RequestMenuModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    restaurantName: "",
    location: "",
    link: "",
    details: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!formData.restaurantName.trim()) {
      setSubmitStatus({ success: false, message: "Please enter a restaurant name" });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      // Formulate the email data
      const emailData = {
        to: "chowyd.business@gmail.com",
        subject: `New request: ${formData.restaurantName}`,
        body: `
          Restaurant Name: ${formData.restaurantName}
          Location: ${formData.location}
          Link: ${formData.link}
          Additional Details: ${formData.details}
        `,
      };
      
      // Send to your backend API
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send request");
      }
      
      setSubmitStatus({
        success: true,
        message: "Your request has been submitted successfully!",
      });
      
      // Reset form after successful submission
      setFormData({
        restaurantName: "",
        location: "",
        link: "",
        details: "",
      });
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSubmitStatus(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error submitting request:", error);
      setSubmitStatus({
        success: false,
        message: "Failed to submit request. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-[#f2d36e]">Request a Menu</h2>
            <button 
              onClick={onClose}
              className="text-gray-700 hover:text-black transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {submitStatus && (
            <div className={`p-3 mb-4 rounded-md ${
              submitStatus.success 
                ? 'bg-[#f9ebc3] border border-[#f2d36e] text-gray-700' 
                : 'bg-[#f9c3c9] border border-[#f9c3c9] text-gray-700'
            }`}>
              {submitStatus.message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name <span className="text-[#f9c3c9]">*</span>
              </label>
              <input
                type="text"
                id="restaurantName"
                name="restaurantName"
                value={formData.restaurantName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[#f9ebc3] rounded-md focus:outline-none focus:ring-[#dab9f8] focus:border-[#dab9f8] text-gray-700"
                placeholder="Enter restaurant name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[#f9ebc3] rounded-md focus:outline-none focus:ring-[#dab9f8] focus:border-[#dab9f8] text-gray-700"
                placeholder="City, State or Full Address"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Website or Social Media
              </label>
              <input
                type="text"
                id="link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[#f9ebc3] rounded-md focus:outline-none focus:ring-[#dab9f8] focus:border-[#dab9f8] text-gray-700"
                placeholder="https://..."
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Details
              </label>
              <textarea
                id="details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-[#f9ebc3] rounded-md focus:outline-none focus:ring-[#dab9f8] focus:border-[#dab9f8] text-gray-700"
                placeholder="Any additional information about the restaurant..."
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-[#f5b7ee] text-gray-700 rounded-md hover:bg-[#dab9f8] focus:outline-none focus:ring-2 focus:ring-[#dab9f8] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestMenuModal;