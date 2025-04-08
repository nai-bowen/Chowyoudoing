"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import FloatingFoodEmojis from '@/app/_components/FloatingFoodEmojis';

interface RestaurantRegisterResponse {
  success?: boolean;
  error?: string;
}

export default function RestaurantRegisterPage(): JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  
  // File input refs
  const utilityBillRef = useRef<HTMLInputElement>(null);
  const businessLicenseRef = useRef<HTMLInputElement>(null);
  const foodHygieneCertRef = useRef<HTMLInputElement>(null);
  const storefrontPhotoRef = useRef<HTMLInputElement>(null);
  const receiptPhotoRef = useRef<HTMLInputElement>(null);
  
  // Form data state
  const [formData, setFormData] = useState<{
    // Account details
    email: string;
    password: string;
    confirmPassword: string;
    
    // Restaurant details
    restaurantName: string;
    businessRegNumber: string;
    vatNumber: string;
    
    // Address
    addressLine1: string;
    addressLine2: string;
    city: string;
    postalCode: string;
    country: string;
    
    // Contact person
    contactPersonName: string;
    contactPersonPhone: string;
    contactPersonEmail: string;
    
    // Proof documents (will store file objects)
    utilityBillFile: File | null;
    businessLicenseFile: File | null;
    foodHygieneCertFile: File | null;
    storefrontPhotoFile: File | null;
    receiptPhotoFile: File | null;
  }>({
    // Account details
    email: "",
    password: "",
    confirmPassword: "",
    
    // Restaurant details
    restaurantName: "",
    businessRegNumber: "",
    vatNumber: "",
    
    // Address
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "",
    
    // Contact person
    contactPersonName: "",
    contactPersonPhone: "",
    contactPersonEmail: "",
    
    // Proof documents
    utilityBillFile: null,
    businessLicenseFile: null,
    foodHygieneCertFile: null,
    storefrontPhotoFile: null,
    receiptPhotoFile: null,
  });
  
  // Handle text input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: string): void => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size is 5MB.`);
        e.target.value = "";
        return;
      }
      
      // Update form data with the file
      setFormData((prev) => ({
        ...prev,
        [`${fileType}File`]: file,
      }));
      
      // Clear error if there was one
      if (error) setError("");
    }
  };
  
  // Handle form navigation
  const handleContinue = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    // Validate current step
    if (step === 1) {
      // Validate email
      if (!formData.email) {
        setError("Email is required");
        return;
      }
      
      // Validate password
      if (!formData.password) {
        setError("Password is required");
        return;
      }
      
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }
      
      // Validate password confirmation
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    } else if (step === 2) {
      // Validate restaurant details
      if (!formData.restaurantName) {
        setError("Restaurant name is required");
        return;
      }
      
      // Business reg number is optional
      
      // Validate address fields
      if (!formData.addressLine1 || !formData.city || !formData.postalCode || !formData.country) {
        setError("Address details are required");
        return;
      }
    }
    
    // Clear error and proceed to next step
    setError("");
    setStep((prev) => prev + 1);
  };
  
  // Handle form submission (final step)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    // Validate contact person details
    if (!formData.contactPersonName || !formData.contactPersonPhone || !formData.contactPersonEmail) {
      setError("Contact person details are required");
      setIsSubmitting(false);
      return;
    }
    
    // Validate that at least one proof document is provided
    if (
      !formData.utilityBillFile && 
      !formData.businessLicenseFile && 
      !formData.foodHygieneCertFile && 
      !formData.storefrontPhotoFile && 
      !formData.receiptPhotoFile
    ) {
      setError("At least one proof document is required");
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Create FormData object for file uploads
      const submitData = new FormData();
      
      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        // Skip file fields and confirmPassword
        if (!key.includes('File') && key !== 'confirmPassword' && value !== null) {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          submitData.append(key, value.toString());
        }
      });
      
      // Add file fields
      if (formData.utilityBillFile) {
        submitData.append('utilityBill', formData.utilityBillFile);
      }
      
      if (formData.businessLicenseFile) {
        submitData.append('businessLicense', formData.businessLicenseFile);
      }
      
      if (formData.foodHygieneCertFile) {
        submitData.append('foodHygieneCert', formData.foodHygieneCertFile);
      }
      
      if (formData.storefrontPhotoFile) {
        submitData.append('storefrontPhoto', formData.storefrontPhotoFile);
      }
      
      if (formData.receiptPhotoFile) {
        submitData.append('receiptPhoto', formData.receiptPhotoFile);
      }
      
      // Send the request
      const response = await fetch('/api/auth/restaurant-register', {
        method: 'POST',
        body: submitData,
      });
      
      const data = await response.json() as RestaurantRegisterResponse;
      
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to register restaurant');
      }
      
      // Registration successful
      setSuccess(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle back button
  const handleBack = (): void => {
    setStep((prev) => prev - 1);
    setError("");
  };
  
  // Render step indicator with only circles
  const renderStepIndicator = (): JSX.Element => {
    return (
      <div className="flex justify-center mb-6 gap-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div 
              className={`h-4 w-4 rounded-full ${
                s < step ? "bg-[#f2d36f]" : 
                s === step ? "bg-[#dbbaf8]" : 
                "bg-gray-300"
              }`}
            />
          </div>
        ))}
      </div>
    );
  };
  
  // If registration was successful, show a success message
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#f9ebc2] via-[#faf0f6] to-white">
        <FloatingFoodEmojis />
        <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-3xl border border-white/30 
                      shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl p-8">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-[#dab9f8] to-[#f2d36f] bg-clip-text text-transparent">
            CHOW YOU DOING
          </h1>
          
          <h2 className="text-2xl font-bold text-[#D29501] mb-6 text-center">
            Registration Successful!
          </h2>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="text-green-800 mb-2">
              Your restaurant registration has been submitted successfully!
            </p>
            <p className="text-green-600">
              Our team will review your application and get back to you soon.
            </p>
          </div>
          
          <p className="text-gray-600 mb-4 text-center">
            You will be redirected to the login page in a few seconds...
          </p>
          
          <div className="text-center">
            <Link 
              href="/login" 
              className="text-[15px] text-[#D29501] font-bold hover:underline"
            >
              Click here if you are not redirected
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#f9ebc2] via-[#faf0f6] to-white">
      {/* Blob decorations */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-[#FFD879]/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 w-64 h-64 bg-[#FFC1B5]/20 rounded-full blur-3xl"></div>
      <FloatingFoodEmojis />
      
      {/* Registration Card */}
      <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-3xl border border-white/30 
                    shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
        <div className="p-8">
          {/* Title with gradient */}
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-[#dab9f8] to-[#f2d36f] bg-clip-text text-transparent">
            CHOW YOU DOING
          </h1>

          <p className="text-center text-[#f2d36f] mb-6">
            RESTAURANT REGISTRATION
          </p>
          
          {/* Step Indicator */}
          {renderStepIndicator()}
          
          {/* Step text */}
          <h3 className="text-center text-[#dbbaf8] font-medium mb-6">
            {step === 1 ? "ACCOUNT INFORMATION" : 
             step === 2 ? "RESTAURANT DETAILS" : 
             "VERIFICATION DOCUMENTS"}
          </h3>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-200 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {/* Form */}
          <form
            onSubmit={step === 3 ? handleSubmit : handleContinue}
            className="space-y-6"
            noValidate
          >
            {/* Step 1: Account Information */}
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="email" className="block text-[#dbbaf8] font-medium mb-1">
                    Business Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="restaurant@example.com"
                    required
                    className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                             focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-[#dbbaf8] font-medium mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a secure password"
                    required
                    minLength={8}
                    className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                             focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                  />
                  <p className="text-xs text-gray-500 mt-1 ml-3">
                    Minimum 8 characters
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-[#dbbaf8] font-medium mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                             focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                  />
                </div>
              </>
            )}
            
            {/* Step 2: Restaurant Information */}
            {step === 2 && (
              <>
                <div>
                  <label htmlFor="restaurantName" className="block text-[#dbbaf8] font-medium mb-1">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    id="restaurantName"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    placeholder="Your restaurant's name"
                    required
                    className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                             focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                  />
                </div>
                
                <div>
                  <label htmlFor="businessRegNumber" className="block text-[#dbbaf8] font-medium mb-1">
                    Business Registration Number
                  </label>
                  <input
                    type="text"
                    id="businessRegNumber"
                    name="businessRegNumber"
                    value={formData.businessRegNumber}
                    onChange={handleChange}
                    placeholder="Companies House number"
                    className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                             focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                  />
                </div>
                
                <div>
                  <label htmlFor="vatNumber" className="block text-[#dbbaf8] font-medium mb-1">
                    VAT Number (if applicable)
                  </label>
                  <input
                    type="text"
                    id="vatNumber"
                    name="vatNumber"
                    value={formData.vatNumber}
                    onChange={handleChange}
                    placeholder="Your VAT registration number"
                    className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                             focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                  />
                </div>
                
                <div className="pt-2">
                  <h4 className="font-medium text-[#dbbaf8] mb-2">
                    Registered Business Address
                  </h4>
                  
                  <div>
                    <label htmlFor="addressLine1" className="block text-[#dbbaf8] font-medium mb-1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      id="addressLine1"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      placeholder="Street address"
                      required
                      className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                               focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                    />
                  </div>
                  
                  <div className="mt-2">
                    <label htmlFor="addressLine2" className="block text-[#dbbaf8] font-medium mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      id="addressLine2"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                      placeholder="Apt, suite, unit, etc. (optional)"
                      className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                               focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                    />
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="city" className="block text-[#dbbaf8] font-medium mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        required
                        className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                                 focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="postalCode" className="block text-[#dbbaf8] font-medium mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="Postal code"
                        required
                        className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                                 focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <label htmlFor="country" className="block text-[#dbbaf8] font-medium mb-1">
                      Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                               focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                    >
                      <option value="">Select a country</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Ireland">Ireland</option>
                      <option value="France">France</option>
                      <option value="Germany">Germany</option>
                      <option value="Spain">Spain</option>
                      <option value="Italy">Italy</option>
                      {/* Add more countries as needed */}
                    </select>
                  </div>
                </div>
              </>
            )}
            
            {/* Step 3: Contact Person & Verification Documents */}
            {step === 3 && (
              <>
                <div className="mb-4">
                  <h4 className="font-medium text-[#dbbaf8] mb-2">
                    Contact Person Details
                  </h4>
                  
                  <div>
                    <label htmlFor="contactPersonName" className="block text-[#dbbaf8] font-medium mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="contactPersonName"
                      name="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={handleChange}
                      placeholder="Full name"
                      required
                      className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                               focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                    />
                  </div>
                  
                  <div className="mt-2">
                    <label htmlFor="contactPersonPhone" className="block text-[#dbbaf8] font-medium mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="contactPersonPhone"
                      name="contactPersonPhone"
                      value={formData.contactPersonPhone}
                      onChange={handleChange}
                      placeholder="Phone number"
                      required
                      className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                               focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                    />
                  </div>
                  
                  <div className="mt-2">
                    <label htmlFor="contactPersonEmail" className="block text-[#dbbaf8] font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="contactPersonEmail"
                      name="contactPersonEmail"
                      value={formData.contactPersonEmail}
                      onChange={handleChange}
                      placeholder="Contact email"
                      required
                      className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                               focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <h4 className="font-medium text-[#dbbaf8] mb-2">
                    Verification Documents
                  </h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Please upload at least one of the following documents to verify your business.
                    All files must be less than 5MB.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Utility Bill */}
                    <div className="rounded-xl bg-white/80 p-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">
                          Utility Bill
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          ref={utilityBillRef}
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'utilityBill')}
                        />
                        <button
                          type="button"
                          onClick={() => utilityBillRef.current?.click()}
                          className="px-4 py-2 bg-[#f2d36f] text-white rounded-full text-sm hover:bg-opacity-90"
                        >
                          {formData.utilityBillFile ? 'Change' : 'Upload'}
                        </button>
                      </label>
                      {formData.utilityBillFile && (
                        <p className="text-xs text-green-600 mt-1">
                          {formData.utilityBillFile.name} uploaded successfully
                        </p>
                      )}
                    </div>
                    
                    {/* Business License */}
                    <div className="rounded-xl bg-white/80 p-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">
                          Business License
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          ref={businessLicenseRef}
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'businessLicense')}
                        />
                        <button
                          type="button"
                          onClick={() => businessLicenseRef.current?.click()}
                          className="px-4 py-2 bg-[#f2d36f] text-white rounded-full text-sm hover:bg-opacity-90"
                        >
                          {formData.businessLicenseFile ? 'Change' : 'Upload'}
                        </button>
                      </label>
                      {formData.businessLicenseFile && (
                        <p className="text-xs text-green-600 mt-1">
                          {formData.businessLicenseFile.name} uploaded successfully
                        </p>
                      )}
                    </div>
                    
                    {/* Food Hygiene Certificate */}
                    <div className="rounded-xl bg-white/80 p-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">
                          Food Hygiene Certificate
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          ref={foodHygieneCertRef}
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'foodHygieneCert')}
                        />
                        <button
                          type="button"
                          onClick={() => foodHygieneCertRef.current?.click()}
                          className="px-4 py-2 bg-[#f2d36f] text-white rounded-full text-sm hover:bg-opacity-90"
                        >
                          {formData.foodHygieneCertFile ? 'Change' : 'Upload'}
                        </button>
                      </label>
                      {formData.foodHygieneCertFile && (
                        <p className="text-xs text-green-600 mt-1">
                          {formData.foodHygieneCertFile.name} uploaded successfully
                        </p>
                      )}
                    </div>
                    
                    {/* Storefront Photo */}
                    <div className="rounded-xl bg-white/80 p-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">
                          Storefront Photo
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          ref={storefrontPhotoRef}
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'storefrontPhoto')}
                        />
                        <button
                          type="button"
                          onClick={() => storefrontPhotoRef.current?.click()}
                          className="px-4 py-2 bg-[#f2d36f] text-white rounded-full text-sm hover:bg-opacity-90"
                        >
                          {formData.storefrontPhotoFile ? 'Change' : 'Upload'}
                        </button>
                      </label>
                      {formData.storefrontPhotoFile && (
                        <p className="text-xs text-green-600 mt-1">
                          {formData.storefrontPhotoFile.name} uploaded successfully
                        </p>
                      )}
                    </div>
                    
                    {/* Receipt Photo */}
                    <div className="rounded-xl bg-white/80 p-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-700">
                          Receipt Photo
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          ref={receiptPhotoRef}
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'receiptPhoto')}
                        />
                        <button
                          type="button"
                          onClick={() => receiptPhotoRef.current?.click()}
                          className="px-4 py-2 bg-[#f2d36f] text-white rounded-full text-sm hover:bg-opacity-90"
                        >
                          {formData.receiptPhotoFile ? 'Change' : 'Upload'}
                        </button>
                      </label>
                      {formData.receiptPhotoFile && (
                        <p className="text-xs text-green-600 mt-1">
                          {formData.receiptPhotoFile.name} uploaded successfully
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Navigation Buttons */}
            <div className={`flex ${step === 1 ? 'justify-center' : 'justify-between'} mt-6`}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 ${
                  step === 3 ? 'bg-[#dbbaf8]' : 'bg-[#f2d36f]'
                } text-white font-medium rounded-full 
                         hover:opacity-90 focus:outline-none disabled:opacity-70 ${
                step === 1 ? 'w-3/4' : 'w-auto'
              }`}
              >
                {isSubmitting 
                  ? "Processing..." 
                  : step === 3 
                    ? "Submit Registration" 
                    : "Continue"}
              </button>
            </div>
          </form>
        </div>
        
        <div className="py-4 text-center border-t border-gray-200 bg-white/30">
          <p className="text-gray-400">
            ALREADY HAVE AN ACCOUNT?{" "}
            <Link href="/login" className="font-bold text-[#f2d36f] hover:text-[#dbbaf8]">
              SIGN IN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}