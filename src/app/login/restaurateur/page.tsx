"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import FloatingFoodEmojis from '@/app/_components/FloatingFoodEmojis';

export default function RestaurantLoginPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [businessRegNumber, setBusinessRegNumber] = useState<string>("");
  const [vatNumber, setVatNumber] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!businessRegNumber.trim()) {
      setError("Business Registration Number is required");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/restaurant-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          businessRegNumber,
          vatNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Authentication failed");
      } else {
        // If login is successful, redirect to restaurant dashboard
        router.replace("/restaurant-dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#f9ebc2] via-[#faf0f6] to-white">
      {/* Blob decorations */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-[#FFD879]/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 w-64 h-64 bg-[#FFC1B5]/20 rounded-full blur-3xl"></div>
      <FloatingFoodEmojis />
      
      {/* Login Card */}
      <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-3xl border border-white/30 
                    shadow-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <div className="p-8">
          {/* Title with gradient */}
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-[#dab9f8] to-[#f2d36f] bg-clip-text text-transparent">
            CHOW YOU DOING
          </h1>

          <p className="text-center text-[#f2d36f] mb-8">
            RESTAURANT OWNER LOGIN
          </p>
          
          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[#dbbaf8] font-medium mb-1">
                Business Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
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
            </div>
            
            <div>
              <label htmlFor="businessRegNumber" className="block text-[#dbbaf8] font-medium mb-1">
                Business Registration Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="businessRegNumber"
                value={businessRegNumber}
                onChange={(e) => setBusinessRegNumber(e.target.value)}
                placeholder="Enter your business registration number"
                required
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
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="Enter your VAT number (optional)"
                className="w-full p-3 bg-white/80 border-2 border-[#FFD879]/50 rounded-full 
                         focus:outline-none focus:ring-2 focus:ring-[#dbbaf8] focus:border-[#dbbaf8]"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[#f2d36f]"
                />
                <span className="ml-2 text-sm text-[#dbbaf8]">Remember me</span>
              </label>
              
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#f2d36f] hover:text-[#D5561D]"
              >
                FORGOT PASSWORD?
              </Link>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-600 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#f2d36f] text-white font-medium rounded-full 
                       hover:bg-[#dbbaf8] focus:outline-none disabled:opacity-70"
            >
              {isLoading ? "Signing in..." : "SIGN IN"}
            </button>
          </form>
        </div>
        
        <div className="py-4 text-center border-t border-gray-200 bg-white/30">
          <p className="text-gray-400">
            CUSTOMER LOGGING IN?{" "}
            <Link href="/login" className="font-bold text-[#f2d36f] hover:text-[#dbbaf8]">
              PATRON LOGIN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}