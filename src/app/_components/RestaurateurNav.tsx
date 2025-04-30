"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faUtensils,
  faComment,
  faChartLine,
  faUser,
  faSignOutAlt,
  faBars,
  faTimes,
  faUsers,
  faReceipt,
  faShareNodes
} from "@fortawesome/free-solid-svg-icons";
import { signOut } from "next-auth/react";
import Image from "next/image";

interface RestaurateurNavProps {
  restaurateurName?: string;
  restaurantName?: string;
}

export default function RestaurateurNav({ 
  restaurateurName = "Restaurant Manager", 
  restaurantName = "Your Restaurant" 
}: RestaurateurNavProps): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async (): Promise<void> => {
    await signOut({ callbackUrl: "/" });
  };

  // Define nav links
  const navLinks = [
    { 
      href: "/restaurant-dashboard", 
      icon: faStore, 
      label: "Dashboard", 
      isActive: pathname === "/restaurant-dashboard"
    },
    { 
      href: "/restaurant-dashboard/reviews", 
      icon: faComment, 
      label: "Reviews", 
      isActive: pathname === "/restaurant-dashboard/reviews" 
    },
    { 
      href: "/restaurant-dashboard/menu", 
      icon: faUtensils, 
      label: "Menu", 
      isActive: pathname === "/restaurant-dashboard/menu" 
    },
    { 
      href: "/restaurant-dashboard/analytics", 
      icon: faChartLine, 
      label: "Analytics", 
      isActive: pathname === "/restaurant-dashboard/analytics" 
    },
    { 
      href: "/restaurant-dashboard/receipt-verifications", 
      icon: faReceipt, 
      label: "Verifications", 
      isActive: pathname === "/restaurant-dashboard/receipt-verifications" 
    },
    { 
      href: "/restaurant-dashboard/referrals", 
      icon: faShareNodes, 
      label: "Referrals", 
      isActive: pathname === "/restaurant-dashboard/referrals" 
    }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/restaurant-dashboard" className="flex-shrink-0 flex items-center">
    {/* Logo */}
    <div className="flex items-center">
            <div className="w-8 h-8 bg-[`#F1C84B`] rounded-full flex items-center justify-center"> 
              <Image 
                src="/assets/cyd_emblem.png" 
                alt="Chow You Doing Logo"
                width={100}
                height={100}
              /> 
            </div> 
      <h3 className="ml-3 text-xl font-bold md:text-xl text-base text-[#F1C84B]">Chow You Doing?</h3>
    </div>

            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  link.isActive
                    ? "text-[#dab9f8] bg-[#f9f5ff]"
                    : "text-gray-600 hover:text-[#dab9f8] hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={link.icon} className="mr-2" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Account Menu */}
          <div className="hidden md:flex md:items-center">
            <div className="relative ml-3">
              <div className="flex items-center">
                <Link
                  href="/restaurant-dashboard/profile"
                  className="text-gray-600 hover:text-[#dab9f8] px-3 py-2 rounded-md text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  {restaurateurName.split(' ')[0]}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-[#dab9f8] px-3 py-2 rounded-md text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-[#dab9f8] hover:bg-gray-50 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} className="block h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden bg-white ${isMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                link.isActive
                  ? "text-[#dab9f8] bg-[#f9f5ff]"
                  : "text-gray-600 hover:text-[#dab9f8] hover:bg-gray-50"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FontAwesomeIcon icon={link.icon} className="mr-2" />
              {link.label}
            </Link>
          ))}
          <Link
            href="/restaurant-dashboard/profile"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-[#dab9f8] hover:bg-gray-50"
            onClick={() => setIsMenuOpen(false)}
          >
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-[#dab9f8] hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}