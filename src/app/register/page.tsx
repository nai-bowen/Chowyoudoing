"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaApple } from "react-icons/fa";
import { Kufam, Londrina_Solid } from "next/font/google";  // Correct import
import Image from "next/image";

// Importing fonts
const kufam = Kufam({ subsets: ["latin"], weight: ["400", "500", "700"] });
const londrinaSolid = Londrina_Solid({ subsets: ["latin"], weight: ["400"] });
const interestOptions = [
  "Pizza", "Japanese", "Chinese", "Fish & Chips", "Italian",
  "Greek", "Caribbean", "American", "Sushi", "Sandwiches",
  "Dessert", "Vegan/Vegetarian", "Lebanese", "Mexican",
  "Burgers", "Indian", "Mediterranean", "Steak", "Breakfast",
  "Salads", "Tacos", "Chicken", "Boba/Juice"
];

interface RegisterResponse {
  error?: string;
}


export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    interests: string[];
  }>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    interests: [],  // Initialized as an empty array
  });
  
  
  // Handle interest selection
  const handleInterestToggle = (interest: string) => {
    setFormData((prevData) => {
      const interests = prevData.interests.includes(interest)
        ? prevData.interests.filter((item) => item !== interest)  // Remove if already selected
        : [...prevData.interests, interest];  // Add if not selected
      return { ...prevData, interests };
    });
  };
  
  
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContinue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!form.checkValidity()) {
      setError("Please fill in all required fields correctly.");
      return;
    }

    setError("");
    setStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setStep((prev) => prev - 1);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
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

        {/* Image with updated margin */}
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
        <h1
          className={`${kufam.className} text-[32px] font-bold text-[#D29501]`}
        >
          Registration
        </h1>
        <h3
          className={`${kufam.className} text-[12px] text-[#B1B1B1] font-semibold text-center mb-4`}
        >
          {step === 1
            ? "First, we need to ask some General Information"
            : step === 2
            ? "Let's focus on security... Choose a Password"
            : "What types of food do you like?"}
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

        {/* Form */}
        <form
          onSubmit={step === 3 ? handleRegister : handleContinue}
          className="w-full max-w-md space-y-4"
          noValidate
        >
          {step === 1 && (
            <>
              <div>
                <label
                  htmlFor="firstName"
                  className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                >
                  First name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="your name"
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                >
                  Surname
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="your last name"
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                >
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="name@domain.com"
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                />
              </div>

              {/* Updated Continue Button */}
              <button
                type="submit"
                className="w-[60%] py-2 bg-[#FFC1B5] text-white rounded-[100px] shadow-md hover:bg-[#FFB4A3] transition-all mx-auto block"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label
                  htmlFor="password"
                  className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter password"
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className={`${kufam.className} text-sm text-[#B1B1B1] mb-1 block`}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFB400]"
                />
              </div>

              {/* Buttons for step 2 */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 border rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Previous
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

          {step === 3 && (
            <>
              <h3 className={`${kufam.className} text-[12px] text-[#B1B1B1] font-semibold text-center mb-4`}>
                What types of food do you like? Tell us a bit about your interests if you want! (Optional)
              </h3>

              <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                {interestOptions.map((interest) => {
                  const isSelected = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-2 rounded-md text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-[#FFB686] text-white relative"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {interest}
                      {isSelected && (
                        <span className="absolute top-1 right-2 text-white font-bold text-lg">
                          ×
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Buttons */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 border rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#FFC1B5] text-white rounded-md shadow-md hover:bg-[#FFB4A3]"
                >
                  Done
                </button>
              </div>
            </>
          )}

        </form>

        {error && <p className="mt-3 text-red-600">{error}</p>}

        <div className="flex items-center w-full max-w-md my-6">
          <div className="flex-grow border-t border-gray-400"></div>
          <span className="mx-4 text-gray-600">or</span>
          <div className="flex-grow border-t border-gray-400"></div>
        </div>

        {/* Social Signup Buttons with lighter shadows and rounded corners */}
        <div className="w-full max-w-md space-y-3">
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center p-3 border rounded-[1rem] shadow hover:bg-gray-100 transition"
          >
            <FcGoogle size={24} className="mr-2" /> Sign up with Google
          </button>
          <button className="w-full flex items-center justify-center p-3 border rounded-[1rem] shadow hover:bg-gray-100 transition">
            <FaFacebookF size={24} className="text-blue-600 mr-2" /> Sign up with Facebook
          </button>
          <button className="w-full flex items-center justify-center p-3 border rounded-[1rem] shadow hover:bg-gray-100 transition">
            <FaApple size={24} className="mr-2" /> Sign up with Apple
          </button>
        </div>

        {/* Already have an account */}
        <p className="mt-6 text-center">
          <span
            className={`${kufam.className} text-[15px] text-[#FFA02B] font-medium`}
          >
            Already have an account?{" "}
          </span>
          <a
            href="/login"
            className={`${kufam.className} text-[15px] text-[#D29501] font-bold hover:underline`}
          >
            Log in Here
          </a>
        </p>
      </div>
    </div>
  );
}
