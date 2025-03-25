"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Kufam, Londrina_Solid } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

// Importing fonts
const kufam = Kufam({ subsets: ["latin"], weight: ["400", "500", "700"] });
const londrinaSolid = Londrina_Solid({ subsets: ["latin"], weight: ["400"] });

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
  
  // If registration was successful, show a success message
  if (success) {
    return (
      <div className="flex min-h-screen overflow-hidden relative">
        {/* Left sidebar */}
        <div className="w-1/2 bg-[#FFD879] flex flex-col justify-between p-8 relative">
          <h1 className={`${londrinaSolid.className} text-[35px] text-white absolute top-8 left-8`}>
            Chow You Doing?
          </h1>
          
          <div className="flex justify-start items-end h-full">
            <Image
              src="/assets/eat.png"
              alt="Illustration"
              width={662}
              height={669}
              className="object-contain max-w-full h-auto ml-[-4.5rem] mb-[-5rem]"
            />
          </div>
        </div>
        
        {/* Success message */}
        <div className="w-1/2 bg-white flex flex-col justify-center items-center px-12">
          <div className="w-full max-w-md text-center">
            <h2 className={`${kufam.className} text-2xl font-bold text-[#D29501] mb-6`}>
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
            <p className="text-gray-600 mb-4">
              You will be redirected to the login page in a few seconds...
            </p>
            <Link 
              href="/login" 
              className={`${kufam.className} text-[15px] text-[#D29501] font-bold hover:underline`}
            >
              Click here if you are not redirected
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen overflow-hidden relative">
      {/* Left sidebar */}
      <div className="w-1/2 bg-[#FFD879] flex flex-col justify-between p-8 relative">
        <h1 className={`${londrinaSolid.className} text-[35px] text-white absolute top-8 left-8`}>
          Chow You Doing?
        </h1>
        
        <div className="flex justify-start items-end h-full">
          <Image
            src="/assets/eat.png"
            alt="Illustration"
            width={662}
            height={669}
            className="object-contain max-w-full h-auto ml-[-4.5rem] mb-[-5rem]"
          />
        </div>
      </div>
      
      {/* Form section */}
      <div className="w-1/2 bg-white flex flex-col justify-center items-center px-12 py-8 overflow-y-auto">
        <h1 className={`${kufam.className} text-[32px] font-bold text-[#D29501]`}>
          Restaurant Registration
        </h1>
        
        <h3 className={`${kufam.className} text-[12px] text-[#B1B1B1] font-semibold text-center mb-4`}>
          {step === 1
            ? "Create your restaurant owner account"
            : step === 2
            ? "Tell us about your restaurant"
            : "Upload verification documents"}
        </h3>
        
        {/* Progress Bar */}
        <div className="w-full flex justify-center mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 w-20 mx-2 rounded-full ${
                step >= s ? "bg-[#FFB400]" : "bg-[#D9D9D9]"
              }`}
            ></div>
          ))}
        </div>
        
        {/* Error message */}
        {error && (
          <div className="w-full max-w-md bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-700">
            {error}
          </div>
        )}
        
        {/* Form */}
        <form
          onSubmit={step === 3 ? handleSubmit : handleContinue}
          className="w-full max-w-md space-y-4"
        >
          {/* Step 1: Account Information */}
          {step === 1 && (
            <>
              <div>
                <label
                  htmlFor="email"
                  className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                >
                  Business Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="restaurant@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                />
              </div>
              
              <div>
                <label
                  htmlFor="password"
                  className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                >
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 8 characters
                </p>
              </div>
              
              <div>
                <label
                  htmlFor="confirmPassword"
                  className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                >
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                />
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-[#FFC1B5] text-white rounded-md shadow-md hover:bg-[#FFB4A3] transition-all"
              >
                Continue
              </button>
            </>
          )}
          
          {/* Step 2: Restaurant Information */}
          {step === 2 && (
            <>
              <div>
                <label
                  htmlFor="restaurantName"
                  className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                >
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  placeholder="Your restaurant's name"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                />
              </div>
              
              <div>
                <label
                  htmlFor="businessRegNumber"
                  className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                >
                  Business Registration Number
                </label>
                <input
                  type="text"
                  id="businessRegNumber"
                  name="businessRegNumber"
                  placeholder="Companies House number"
                  value={formData.businessRegNumber}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                />
              </div>
              
              <div>
                <label
                  htmlFor="vatNumber"
                  className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                >
                  VAT Number (if applicable)
                </label>
                <input
                  type="text"
                  id="vatNumber"
                  name="vatNumber"
                  placeholder="Your VAT registration number"
                  value={formData.vatNumber}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                />
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h4 className={`${kufam.className} font-medium text-gray-700 mb-2`}>
                  Registered Business Address
                </h4>
                
                <div>
                  <label
                    htmlFor="addressLine1"
                    className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                  >
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    id="addressLine1"
                    name="addressLine1"
                    placeholder="Street address"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                  />
                </div>
                
                <div className="mt-2">
                  <label
                    htmlFor="addressLine2"
                    className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                  >
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    id="addressLine2"
                    name="addressLine2"
                    placeholder="Apt, suite, unit, etc. (optional)"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                  />
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="city"
                      className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                    >
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                    />
                  </div>
                  
                  <div>
                    <label
                      htmlFor="postalCode"
                      className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                    >
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      placeholder="Postal code"
                      value={formData.postalCode}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                    />
                  </div>
                </div>
                
                <div className="mt-2">
                  <label
                    htmlFor="country"
                    className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                  >
                    Country *
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
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
              
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#FFC1B5] text-white rounded-md shadow-md hover:bg-[#FFB4A3]"
                >
                  Continue
                </button>
              </div>
            </>
          )}
          
          {/* Step 3: Contact Person & Verification Documents */}
          {step === 3 && (
            <>
              <div className="mb-4">
                <h4 className={`${kufam.className} font-medium text-gray-700 mb-2`}>
                  Contact Person Details
                </h4>
                
                <div>
                  <label
                    htmlFor="contactPersonName"
                    className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="contactPersonName"
                    name="contactPersonName"
                    placeholder="Full name"
                    value={formData.contactPersonName}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                  />
                </div>
                
                <div className="mt-2">
                  <label
                    htmlFor="contactPersonPhone"
                    className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="contactPersonPhone"
                    name="contactPersonPhone"
                    placeholder="Phone number"
                    value={formData.contactPersonPhone}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                  />
                </div>
                
                <div className="mt-2">
                  <label
                    htmlFor="contactPersonEmail"
                    className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="contactPersonEmail"
                    name="contactPersonEmail"
                    placeholder="Contact email"
                    value={formData.contactPersonEmail}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                  />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className={`${kufam.className} font-medium text-gray-700 mb-2`}>
                  Verification Documents
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Please upload at least one of the following documents to verify your business.
                  All files must be less than 5MB.
                </p>
                
                <div className="space-y-4">
                  {/* Utility Bill */}
                  <div className="border rounded-md p-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`${kufam.className} text-sm text-gray-700`}>
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
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
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
                  <div className="border rounded-md p-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`${kufam.className} text-sm text-gray-700`}>
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
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
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
                  <div className="border rounded-md p-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`${kufam.className} text-sm text-gray-700`}>
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
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
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
                  <div className="border rounded-md p-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`${kufam.className} text-sm text-gray-700`}>
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
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
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
                  <div className="border rounded-md p-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`${kufam.className} text-sm text-gray-700`}>
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
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
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
              
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 bg-[#FFC1B5] text-white rounded-md shadow-md hover:bg-[#FFB4A3] ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                </button>
              </div>
            </>
          )}
        </form>
        
        {/* Login link */}
        <p className="mt-6 text-center">
          <span className={`${kufam.className} text-[15px] text-[#B1B1B1]`}>
            Already have an account?{" "}
          </span>
          <Link
            href="/login"
            className={`${kufam.className} text-[15px] text-[#D29501] font-bold hover:underline`}
          >
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}