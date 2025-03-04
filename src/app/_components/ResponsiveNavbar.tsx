"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// Define the navbar props type
interface ResponsiveNavbarProps {
  currentPage?: "home" | "browse" | "search" | "why";
  location?: string;
}

const ResponsiveNavbar: React.FC<ResponsiveNavbarProps> = ({ 
  currentPage = "home",
  location = "London" 
}) => {
  const [isScrolledPastHero, setIsScrolledPastHero] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Initialize window size detection
  useEffect(() => {
    // Set initial value
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle scroll to determine when to show the burger menu
  useEffect(() => {
    const handleScroll = () => {
      // Change this threshold based on your hero section height
      if (window.scrollY > 700) {
        setIsScrolledPastHero(true);
      } else {
        setIsScrolledPastHero(false);
        // Close mobile menu when scrolling back to hero
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (mobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.burger-button')) {
        setMobileMenuOpen(false);
      }
      if (locationDropdownOpen && !target.closest('.location-dropdown')) {
        setLocationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen, locationDropdownOpen]);

  // Toggle mobile menu
  const toggleMobileMenu = (): void => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Toggle location dropdown
  const toggleLocationDropdown = (): void => {
    setLocationDropdownOpen(!locationDropdownOpen);
  };

  return (
    <nav className={`fixed top-0 left-0 w-full flex justify-between items-center px-4 md:px-8 py-3 z-50 transition-all duration-300 ${
      isScrolledPastHero ? 'bg-white shadow-md' : 'bg-transparent'
    }`}>
      {/* Left: Logo */}
      <div className="flex items-center">
        <Link href="/">
          <Image src="/assets/cyd_fullLogo.png" alt="Chow You Doing Logo" width={100} height={35} />
        </Link>
      </div>

      {/* Center: Navigation Links - Only visible on desktop when not scrolled past hero */}
      {!isScrolledPastHero && (
        <div className="hidden md:flex gap-8 text-[#5A5A5A] text-lg font-medium">
          <Link 
            href="/browse" 
            className={`hover:text-[#A90D3C] transition ${
              currentPage === "browse" ? "text-[#A90D3C] font-semibold relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-[#A90D3C]" : ""
            }`}
          >
            Browse
          </Link>
          <Link 
            href="/search" 
            className={`hover:text-[#A90D3C] transition ${
              currentPage === "search" ? "text-[#A90D3C] font-semibold relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-[#A90D3C]" : ""
            }`}
          >
            Search
          </Link>
          <Link 
            href="/why" 
            className={`hover:text-[#A90D3C] transition ${
              currentPage === "why" ? "text-[#A90D3C] font-semibold relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-[#A90D3C]" : ""
            }`}
          >
            Why?
          </Link>
        </div>
      )}

      {/* Right: Location & Menu Icon */}
      <div className="flex items-center gap-2 md:gap-6">
        {/* Location dropdown */}
        <div className="relative location-dropdown">
          <div 
            className={`flex items-center gap-1 text-lg cursor-pointer ${
              isScrolledPastHero ? 'text-[#5A5A5A]' : 'text-[#5A5A5A]'
            }`}
            onClick={toggleLocationDropdown}
          >
            <span>{location}</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`w-4 h-4 transition-transform ${
                locationDropdownOpen ? 'rotate-180' : ''
              }`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Location Dropdown Menu */}
          {locationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">London</button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Birmingham</button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Manchester</button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Leicester</button>
                <div className="border-t border-gray-100 my-1"></div>
                <button className="w-full text-left px-4 py-2 text-sm text-[#A90D3C] hover:bg-gray-100">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Use my location
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hamburger Menu Button for Mobile or when scrolled past hero */}
        {(isScrolledPastHero || isMobile) && (
          <button 
            className="burger-button p-1 hover:bg-gray-100 rounded-md transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-8 h-8 text-[#5A5A5A]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        )}

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-menu fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleMobileMenu}>
            <div 
              className="absolute top-0 right-0 w-64 h-screen bg-white shadow-lg transform transition-transform duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <Image src="/assets/cyd_emblem.png" alt="Chow You Doing Logo" width={40} height={40} />
                  <button 
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={toggleMobileMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#5A5A5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col gap-4 text-[#5A5A5A] text-lg">
                  <Link 
                    href="/" 
                    className={`py-2 border-b border-gray-100 ${
                      currentPage === "home" ? "text-[#A90D3C] font-medium" : ""
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/browse" 
                    className={`py-2 border-b border-gray-100 ${
                      currentPage === "browse" ? "text-[#A90D3C] font-medium" : ""
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    Browse
                  </Link>
                  <Link 
                    href="/search" 
                    className={`py-2 border-b border-gray-100 ${
                      currentPage === "search" ? "text-[#A90D3C] font-medium" : ""
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    Search
                  </Link>
                  <Link 
                    href="/why" 
                    className={`py-2 border-b border-gray-100 ${
                      currentPage === "why" ? "text-[#A90D3C] font-medium" : ""
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    Why?
                  </Link>
                </div>

                <div className="mt-auto">
                  <div className="flex gap-4 mb-4">
                    <Link href="/login" className="flex-1">
                      <button 
                        className="w-full py-2 bg-white text-[#A90D3C] border border-[#A90D3C] rounded-md text-center"
                        onClick={toggleMobileMenu}
                      >
                        Login
                      </button>
                    </Link>
                    <Link href="/register" className="flex-1">
                      <button 
                        className="w-full py-2 bg-[#A90D3C] text-white rounded-md text-center"
                        onClick={toggleMobileMenu}
                      >
                        Sign Up
                      </button>
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Discover, rate, and recommend the best meals around you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default ResponsiveNavbar;