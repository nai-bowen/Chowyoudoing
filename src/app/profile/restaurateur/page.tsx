/*eslint-disable*/
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSpinner,
  faStore,
  faCheck,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faBuilding,
  faIdCard,
  faFileAlt
} from "@fortawesome/free-solid-svg-icons";

interface RestaurateurProfile {
  id: string;
  email: string;
  restaurantName: string;
  businessRegNumber: string | null;
  vatNumber: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string;
  country: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  approvedAt: string | null;
  restaurantId: string | null;
}

export default function RestaurateurProfilePage(): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [profile, setProfile] = useState<RestaurateurProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<RestaurateurProfile>>({
    restaurantName: "",
    businessRegNumber: "",
    vatNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "",
    contactPersonName: "",
    contactPersonPhone: "",
    contactPersonEmail: ""
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      if (status !== "authenticated") return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch("/api/restaurateur/profile");
        
        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }
        
        const data = await response.json();
        setProfile(data);
        
        // Initialize form with profile data
        setFormData({
          restaurantName: data.restaurantName || "",
          businessRegNumber: data.businessRegNumber || "",
          vatNumber: data.vatNumber || "",
          addressLine1: data.addressLine1 || "",
          addressLine2: data.addressLine2 || "",
          city: data.city || "",
          postalCode: data.postalCode || "",
          country: data.country || "",
          contactPersonName: data.contactPersonName || "",
          contactPersonPhone: data.contactPersonPhone || "",
          contactPersonEmail: data.contactPersonEmail || ""
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError(error instanceof Error ? error.message : "Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [status]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!formData.restaurantName?.trim()) {
      errors.restaurantName = "Restaurant name is required";
    }
    
    if (!formData.contactPersonName?.trim()) {
      errors.contactPersonName = "Contact person name is required";
    }
    
    if (!formData.contactPersonEmail?.trim()) {
      errors.contactPersonEmail = "Contact email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.contactPersonEmail)) {
      errors.contactPersonEmail = "Please enter a valid email address";
    }
    
    if (!formData.contactPersonPhone?.trim()) {
      errors.contactPersonPhone = "Contact phone is required";
    }
    
    if (!formData.addressLine1?.trim()) {
      errors.addressLine1 = "Address is required";
    }
    
    if (!formData.city?.trim()) {
      errors.city = "City is required";
    }
    
    if (!formData.postalCode?.trim()) {
      errors.postalCode = "Postal/ZIP code is required";
    }
    
    if (!formData.country?.trim()) {
      errors.country = "Country is required";
    }
    
    // Update form errors
    setFormErrors(errors);
    
    // Return true if no errors
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch("/api/restaurateur/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setSuccessMessage("Profile updated successfully!");
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "An error occurred while updating your profile");
      
      // Scroll to top to show error message
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get verification status badge color
  const getVerificationStatusColor = (status: string): string => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border border-red-200";
      default: // PENDING
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    }
  };
  
  // Display loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
        </div>
      </div>
    );
  }
  
  // Display error state if failed to load profile
  if (error && !profile) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
          <p>There was an error loading your profile: {error}</p>
          <button 
            onClick={() => router.push("/restaurant-dashboard")}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.push("/restaurant-dashboard")}
          className="mr-4 p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Edit Restaurant Profile</h1>
          <p className="text-gray-600">Update your business information</p>
        </div>
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2" />
          <span>{successMessage}</span>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        {/* Verification Status Section */}
        {profile && (
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">Account Status</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {profile.verificationStatus === "APPROVED" 
                    ? "Your account is verified and active." 
                    : profile.verificationStatus === "PENDING" 
                      ? "Your account is pending verification. You'll be notified once reviewed." 
                      : "Your account verification was rejected. Please update your information and resubmit."}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${getVerificationStatusColor(profile.verificationStatus)}`}>
                {profile.verificationStatus}
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Submitted:</span> {new Date(profile.submittedAt).toLocaleDateString()}
              </div>
              {profile.approvedAt && (
                <div>
                  <span className="text-gray-500">Approved:</span> {new Date(profile.approvedAt).toLocaleDateString()}
                </div>
              )}
              <div>
                <span className="text-gray-500">Email:</span> {profile.email}
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Restaurant Information Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FontAwesomeIcon icon={faStore} className="text-[#f2d36e] mr-2" />
                Restaurant Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Restaurant Name */}
                <div>
                  <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant/Business Name *
                  </label>
                  <input
                    type="text"
                    id="restaurantName"
                    name="restaurantName"
                    value={formData.restaurantName || ""}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.restaurantName ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                  />
                  {formErrors.restaurantName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.restaurantName}</p>
                  )}
                </div>
                
                {/* Business Registration Number */}
                <div>
                  <label htmlFor="businessRegNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Registration Number
                  </label>
                  <input
                    type="text"
                    id="businessRegNumber"
                    name="businessRegNumber"
                    value={formData.businessRegNumber || ""}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.businessRegNumber ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                  />
                  {formErrors.businessRegNumber && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.businessRegNumber}</p>
                  )}
                </div>
                
                {/* VAT Number */}
                <div>
                  <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    id="vatNumber"
                    name="vatNumber"
                    value={formData.vatNumber || ""}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.vatNumber ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                  />
                  {formErrors.vatNumber && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.vatNumber}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Address Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#f9c3c9] mr-2" />
                Business Address
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Address Line 1 */}
                <div className="md:col-span-2">
                  <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    id="addressLine1"
                    name="addressLine1"
                    value={formData.addressLine1 || ""}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.addressLine1 ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                  />
                  {formErrors.addressLine1 && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.addressLine1}</p>
                  )}
                </div>
                
                {/* Address Line 2 */}
                <div className="md:col-span-2">
                  <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    id="addressLine2"
                    name="addressLine2"
                    value={formData.addressLine2 || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                  />
                </div>
                
                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city || ""}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.city ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                  />
                  {formErrors.city && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                  )}
                </div>
                
                {/* Postal Code */}
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal/ZIP Code *
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode || ""}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.postalCode ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                  />
                  {formErrors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.postalCode}</p>
                  )}
                </div>
                
                {/* Country */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country || ""}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.country ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                  />
                  {formErrors.country && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.country}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Contact Information Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FontAwesomeIcon icon={faUser} className="text-[#f5b7ee] mr-2" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Person Name */}
                <div>
                  <label htmlFor="contactPersonName" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    id="contactPersonName"
                    name="contactPersonName"
                    value={formData.contactPersonName || ""}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.contactPersonName ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                  />
                  {formErrors.contactPersonName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.contactPersonName}</p>
                  )}
                </div>
                
                {/* Contact Person Phone */}
                <div>
                  <label htmlFor="contactPersonPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    id="contactPersonPhone"
                    name="contactPersonPhone"
                    value={formData.contactPersonPhone || ""}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.contactPersonPhone ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                  />
                  {formErrors.contactPersonPhone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.contactPersonPhone}</p>
                  )}
                </div>
                
                {/* Contact Person Email */}
                <div>
                  <label htmlFor="contactPersonEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    id="contactPersonEmail"
                    name="contactPersonEmail"
                    value={formData.contactPersonEmail || ""}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${formErrors.contactPersonEmail ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                  />
                  {formErrors.contactPersonEmail && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.contactPersonEmail}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="pt-4 flex justify-end gap-4">
              <Link
                href="/restaurant-dashboard"
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2] disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
            
            {/* Note about verification */}
            {profile?.verificationStatus === "REJECTED" && (
              <div className="mt-4 bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800 border border-yellow-200">
                <p className="font-medium">Note:</p>
                <p>Your account verification was previously rejected. After updating your information, your account will be resubmitted for verification automatically.</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}