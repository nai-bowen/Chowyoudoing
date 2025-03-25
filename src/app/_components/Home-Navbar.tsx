"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Menu, X, Search, User } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const HomeNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const router = useRouter();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out py-4 px-6",
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F1C84B] rounded-full flex items-center justify-center">
            <MapPin size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-[#F1C84B]">Chow You Doing?</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/patron-search"
            className="text-gray-600 hover:text-[#F1C84B] transition-colors font-medium"
          >
            Restaurants
          </Link>
          <Link
            href="/review"
            className="text-gray-600 hover:text-[#F1C84B] transition-colors font-medium"
          >
            Write Review
          </Link>
          <Link
            href="/patron-dashboard"
            className="text-gray-600 hover:text-[#F1C84B] transition-colors font-medium"
          >
            Dashboard
          </Link>
        </nav>

        {/* CTA and Mobile Menu Button */}
        <div className="flex items-center gap-4">
          <button
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white-100 text-gray-600 hover:bg-gray-200 transition-colors"
            onClick={() => router.push("/patron-search")}
          >
            <Search size={18} />
          </button>

          {/* Profile Icon with Dropdown (Desktop) */}
          <div className="hidden md:block relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <User size={18} className="text-gray-600" />
            </button>
            
            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 animate-fadeIn">
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

      {/* Mobile Nav Menu */}
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
            <Link
              href="/patron-search"
              className="flex items-center gap-3 py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <Search size={18} />
              <span>Restaurants</span>
            </Link>
            <Link
              href="/review"
              className="flex items-center gap-3 py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="text-lg font-medium">📝</span>
              <span>Write Review</span>
            </Link>
            <Link
              href="/patron-dashboard"
              className="flex items-center gap-3 py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="text-lg font-medium">📊</span>
              <span>Dashboard</span>
            </Link>
            <hr className="my-2" />
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
          </nav>
        </div>
      )}
    </header>
  );
};

export default HomeNavbar;