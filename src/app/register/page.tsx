"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaApple } from "react-icons/fa";
import FloatingFoodEmojis from '@/app/_components/FloatingFoodEmojis';

// Define interest options
const interestOptions: string[] = [
  "Pizza", "Japanese", "Chinese", "Fish & Chips", "Italian",
  "Greek", "Caribbean", "American", "Sushi", "Sandwiches",
  "Dessert", "Vegan/Vegetarian", "Lebanese", "Mexican",
  "Burgers", "Indian", "Mediterranean", "Steak", "Breakfast",
  "Salads", "Tacos", "Chicken", "Boba/Juice"
];

interface RegisterResponse {
  error?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  interests: string[];
}

export default function RegisterPage(): JSX.Element {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    interests: [],
  });
  
  const [step, setStep] = useState<number>(1);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Handle interest selection
  const handleInterestToggle = (interest: string): void => {
    setFormData((prevData) => {
      const interests = prevData.interests.includes(interest)
        ? prevData.interests.filter((item) => item !== interest)  // Remove if already selected
        : [...prevData.interests, interest];  // Add if not selected
      return { ...prevData, interests };
    });
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContinue = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!form.checkValidity()) {
      setError("Please fill in all required fields correctly.");
      return;
    }

    // Additional validation for step 2
    if (step === 2) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    }

    setError("");
    setStep((prev) => prev + 1);
  };

  const handlePrevious = (): void => {
    setStep((prev) => prev - 1);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    
    const payload = {
      ...formData,
      interests: formData.interests || [],  // Ensure it's always an array
    };
  
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = (await response.json()) as RegisterResponse;
  
      if (!response.ok) {
        setError(data.error ?? "An unexpected error occurred.");
      } else {
        router.push("/login");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
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
            CREATE YOUR FOODIE ACCOUNT
          </p>
          
          {/* Step Indicator */}
          {renderStepIndicator()}
          
          {/* Step text */}
          <h3 className="text-center text-[#dbbaf8] font-medium mb-6">
            {step === 1 ? "PERSONAL INFORMATION" : 
             step === 2 ? "SECURE YOUR ACCOUNT" : 
             "FOOD PREFERENCES (OPTIONAL)"}
          </h3>
          
          {/* Form */}
          <form
            onSubmit={step === 3 ? handleRegister : handleContinue}
            className="space-y-6"
            noValidate
          >
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="firstName" className="block text-[#dbbaf8] font-medium mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Your first name"
                    required
                    className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                             focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-[#dbbaf8] font-medium mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Your last name"
                    required
                    className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                             focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-[#dbbaf8] font-medium mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                             focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label htmlFor="password" className="block text-[#dbbaf8] font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Choose a secure password"
                      required
                      minLength={6}
                      className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                              focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-3">
                    At least 6 characters required
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-[#dbbaf8] font-medium mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
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
                </div>
              </>
            )}

            {step === 3 && (
              <div>
                <p className="text-gray-600 mb-4">
                  Select your favorite food categories to help us recommend restaurants you'll love.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2">
                  {interestOptions.map((interest) => {
                    const isSelected = formData.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleInterestToggle(interest)}
                        className={`p-2 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-[#dbbaf8] text-white"
                            : "bg-white/80 border border-[#FFD879]/50 text-gray-700 hover:bg-[#FFD879]/20"
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-600 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className={`flex ${step === 1 ? 'justify-center' : 'justify-between'} mt-6`}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 ${
                  step === 3 ? 'bg-[#dbbaf8]' : 'bg-[#f2d36f]'
                } text-white font-medium rounded-full 
                           hover:opacity-90 focus:outline-none disabled:opacity-70 ${
                  step === 1 ? 'w-3/4' : 'w-auto'
                }`}
              >
                {isLoading 
                  ? "Processing..." 
                  : step === 3 
                    ? "Create Account" 
                    : "Continue"}
              </button>
            </div>
          </form>
          
          {step === 1 && (
            <>
              <div className="flex items-center justify-between my-6">
                <hr className="w-full border-gray-300" />
                <p className="mx-4 text-gray-500">OR</p>
                <hr className="w-full border-gray-300" />
              </div>

              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/patron-dashboard" })}
                className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 
                         rounded-full bg-white hover:bg-gray-50"
              >
                <FcGoogle size={20} />
                <span>Continue with Google</span>
              </button>
            </>
          )}
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