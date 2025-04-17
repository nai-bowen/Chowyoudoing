"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Menu, X, Search, User, LogIn, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import Image from "next/image";

const HomeNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  // Add state for auth popup
  const [showAuthPopup, setShowAuthPopup] = useState<boolean>(false);
  
  const router = useRouter();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  // Get authentication status
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 10);
    };
    
    const handleClickOutside = (event: MouseEvent): void => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handler for protected links - updated to show popup instead of auto-redirecting
  const handleProtectedLink = (e: React.MouseEvent, path: string): void => {
    if (!isAuthenticated) {
      e.preventDefault();
      // Show auth popup instead of redirecting
      setShowAuthPopup(true);
    } else {
      router.push(path);
    }
  };
  
  // Handle popup actions
  const handleLoginClick = (): void => {
    setShowAuthPopup(false);
    router.push("/login");
  };
  
  const handleStayClick = (): void => {
    setShowAuthPopup(false);
    // User stays on current page by just closing the popup
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out py-4 px-6",
          isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
        )}
      >
        <div className="container mx-auto flex items-center justify-between"> 
          <Link href="/" className="flex items-center gap-2"> 
            <div className="w-8 h-8 bg-[`#F1C84B`] rounded-full flex items-center justify-center"> 
              <Image 
                src="/assets/cyd_emblem.png" 
                alt="Chow You Doing Logo"
                width={100}
                height={100}
              /> 
            </div> 
            <span className="font-bold text-xl text-[#F1C84B]">Chow You Doing?</span>         </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Restaurants/Discover link is now also protected */}
            <a
              href="#"
              onClick={(e) => handleProtectedLink(e, "/discover")}
              className="text-gray-600 hover:text-[#F1C84B] transition-colors font-medium cursor-pointer"
            >
              Restaurants
            </a>
            
            {/* Protected links that require authentication */}
            <a
              href="#"
              onClick={(e) => handleProtectedLink(e, "/patron-dashboard")}
              className="text-gray-600 hover:text-[#F1C84B] transition-colors font-medium cursor-pointer"
            >
              Write Review
            </a>
            <a
              href="#"
              onClick={(e) => handleProtectedLink(e, "/patron-dashboard")}
              className="text-gray-600 hover:text-[#F1C84B] transition-colors font-medium cursor-pointer"
            >
              Dashboard
            </a>
          </nav>

          {/* CTA and Mobile Menu Button */}
          <div className="flex items-center gap-4">
            <button
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white-100 text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={(e) => handleProtectedLink(e, "/discover")}
            >
              <Search size={18} />
            </button>

            {/* Profile Icon with Dropdown (Desktop) */}
            <div className="hidden md:block relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {isAuthenticated ? (
                  <User size={18} className="text-[#F1C84B]" />
                ) : (
                  <LogIn size={18} className="text-gray-600" />
                )}
              </button>
              
              {/* Profile Dropdown - Different options based on auth status */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 animate-fadeIn">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push("/profile");
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[#F1C84B]"
                      >
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push("/patron-dashboard");
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[#F1C84B]"
                      >
                        Write a Review
                      </button>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          // Handle logout - you'll need to implement this
                          router.push("/api/auth/signout");
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push("/login");
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[#F1C84B]"
                      >
                        Log in
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push("/register");
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[#F1C84B]"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Menu - Updated with conditional routes */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg animate-slideUp">
            <nav className="flex flex-col py-4 px-6 gap-4">
              <Link
                href="/"
                className="flex items-center gap-3 py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <MapPin size={18} />
                <span>Home</span>
              </Link>
              <a
                href="#"
                className="flex items-center gap-3 py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={(e) => {
                  setIsMenuOpen(false);
                  handleProtectedLink(e, "/discover");
                }}
              >
                <Search size={18} />
                <span>Restaurants</span>
              </a>
              
              {/* Protected mobile links */}
              <a
                href="#"
                className="flex items-center gap-3 py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={(e) => {
                  setIsMenuOpen(false);
                  handleProtectedLink(e, "/patron-dashboard");
                }}
              >
                <span className="text-lg font-medium">📝</span>
                <span>Write Review</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={(e) => {
                  setIsMenuOpen(false);
                  handleProtectedLink(e, "/patron-dashboard");
                }}
              >
                <span className="text-lg font-medium">📊</span>
                <span>Dashboard</span>
              </a>
              <hr className="my-2" />
              
              {/* Conditional auth buttons */}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/api/auth/signout");
                  }}
                  className="w-full py-3 text-center border border-red-500 text-red-500 rounded-full font-medium"
                >
                  Log out
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push("/login");
                    }}
                    className="w-full py-3 text-center border border-[#F1C84B] text-[#F1C84B] rounded-full font-medium"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push("/register");
                    }}
                    className="w-full py-3 text-center bg-[#FFB400] text-white rounded-full font-medium"
                  >
                    Sign up
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Auth Popup - shown when unauthenticated user tries to access protected routes */}
      {showAuthPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="text-[#F1C84B]" size={24} />
              <h3 className="text-lg font-semibold">Login Required</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Please log in to access this feature, or stay on the homepage to search for reviews.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleStayClick}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Stay on Homepage
              </button>
              <button
                onClick={handleLoginClick}
                className="px-4 py-2 bg-[#F1C84B] text-white rounded-md hover:bg-[#e5b945]"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomeNavbar;