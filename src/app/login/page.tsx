"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaApple } from "react-icons/fa";
import { Kufam, Londrina_Solid } from "next/font/google";
import Image from "next/image";

// Importing fonts
const kufam = Kufam({ subsets: ["latin"], weight: ["400", "500", "700"] });
const londrinaSolid = Londrina_Solid({ subsets: ["latin"], weight: ["400"] });

interface LoginResponse {
  message?: string;
  token?: string;
  error?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
  
    try {
      const signInResponse = await signIn("credentials", {
        email,
        password,
        redirect: false, // Prevent NextAuth from redirecting automatically
      });
  
      if (signInResponse?.error) {
        setError(signInResponse.error);
      } else {
        router.replace("/patron-dashboard"); // Redirect after successful login
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen overflow-hidden relative">
      {/* Sidebar */}
      <div className="w-1/2 bg-[#FFD879] flex flex-col justify-between p-8 relative">
        {/* Logo in top-left */}
        <h1
          className={`${londrinaSolid.className} text-[35px] text-white absolute top-8 left-8`}
        >
          Chow You Doing?
        </h1>

        {/* Image */}
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

      {/* Form Section */}
      <div className="w-1/2 bg-white flex flex-col justify-center items-center px-12">
        <h1 className={`${kufam.className} text-[32px] font-bold text-[#D29501]`}>
          Login
        </h1>
        <p className={`${kufam.className} text-[#B1B1B1] text-sm text-center mb-6`}>
          Read unlimited reviews and write your own <br /> with Chow You Doing?.
        </p>

        <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
          <div>
            <label htmlFor="email" className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}>
              Username
            </label>
            <input
              type="email"
              id="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
            />
          </div>

          <div>
            <label htmlFor="password" className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}>
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="form-checkbox text-[#FFB400]" />
              <span className={`${kufam.className} text-[#B1B1B1]`}>Remember Me</span>
            </label>
            <a href="/forgot-password" className={`${kufam.className} text-[#FFA02B] font-medium hover:underline`}>
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 bg-[#FFC1B5] text-white rounded-[100px] shadow-md ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#FFB4A3]'
            } transition-all`}
          >
            {isLoading ? 'Loading...' : 'Login'}
          </button>
        </form>

        {error && <p className="mt-3 text-red-600">{error}</p>}

        <div className="flex items-center w-full max-w-md my-6">
          <div className="flex-grow border-t border-gray-400"></div>
          <span className="mx-4 text-gray-600">or</span>
          <div className="flex-grow border-t border-gray-400"></div>
        </div>

        {/* Social Signup Buttons */}
        <div className="w-full max-w-md space-y-3">
          <button
            onClick={() => signIn("google", { callbackUrl: "/patron-dashboard" })}
            className="w-full flex items-center justify-center p-3 border rounded-[1rem] shadow hover:bg-gray-100 transition"
            disabled={isLoading}
          >
            <FcGoogle size={24} className="mr-2" /> Sign in with Google
          </button>
          <button 
            className="w-full flex items-center justify-center p-3 border rounded-[1rem] shadow hover:bg-gray-100 transition"
            disabled={isLoading}
          >
            <FaFacebookF size={24} className="text-blue-600 mr-2" /> Sign in with Facebook
          </button>
          <button 
            className="w-full flex items-center justify-center p-3 border rounded-[1rem] shadow hover:bg-gray-100 transition"
            disabled={isLoading}
          >
            <FaApple size={24} className="mr-2" /> Sign in with Apple
          </button>
        </div>

        {/* Register Here Link */}
        <p className="mt-6 text-center">
          <span className={`${kufam.className} text-[15px] text-[#B1B1B1]`}>
            Dont have an account?{" "}
          </span>
          <a
            href="/register"
            className={`${kufam.className} text-[15px] text-[#FFA02B] font-bold hover:underline`}
          >
            Register Here
          </a>
        </p>
      </div>
    </div>
  );
}