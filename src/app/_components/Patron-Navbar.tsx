/*eslint-disable*/
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faSearch, 
  faTimes, 
  faBars,
  faUtensils,
  faSignOutAlt,
  faExchangeAlt,
  faClipboardList,
  faHome // Added home icon
} from "@fortawesome/free-solid-svg-icons";
import ProfileImage from "./ProfileImage";
import RequestMenuModal from "@/app/_components/RequestMenuModal";
import SearchResults, { SearchResult } from "./SearchResults"; // Import the SearchResults component
import Image from "next/image";
// Define the props for the component
interface PatronNavProps {
  className?: string;
}

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string | null;
  profileImage: string | null;
  bio: string | null;
  interests: string[];
}

const PatronNav: React.FC<PatronNavProps> = ({ className = "" }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  // Scroll state
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Profile dropdown state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfileData = async (): Promise<void> => {
      // Only fetch if user is authenticated
      if (status !== "authenticated") return;

      setIsLoadingProfile(true);
      setProfileError(null);
      
      try {
        const response = await fetch("/api/profile");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Profile data fetched:", data);
        setProfileData(data);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setProfileError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    fetchProfileData();
  }, [status]); // Only re-fetch when auth status changes

  // Brand colors for hover effects
  const colorScheme = {
    card1: "#fdf9f5",
    card2: "#fdedf6",
    card3: "#fbe9fc",
    card4: "#f1eafe",
    accent: "#faf2e5"
  };
  
  // Add scroll listener for glassmorphic effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Focus search input when search is opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);
  
  // Handle click outside of search container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Handle click outside of profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        profileDropdownRef.current && 
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  // Handle search query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true);
        try {
          // Changed meals=false to meals=true to include meal results in search
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&restaurants=true&meals=true&categories=false&locations=false`);
          if (!response.ok) throw new Error("Search failed");
          
          const data = await response.json();
          
          // Transform the data to match the SearchResult interface
          const formattedResults: SearchResult[] = [
            ...((data.results || []).map((result: any) => ({
              id: result.id,
              name: result.name,
              type: result.type,
              url: result.url || `/patron-search?q=${encodeURIComponent(result.name)}`,
              restaurant: result.restaurant,
              restaurantId: result.restaurantId // Make sure this is included for Food Items
            }))),
            {
              id: 'request-menu',
              name: 'Request a menu',
              type: 'Action' as any,
              url: '#request-menu',
              restaurant: undefined
            }
          ];
          
          setSearchResults(formattedResults);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);
  
  // Toggle search input visibility
  const toggleSearch = (): void => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchTerm("");
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const openRequestModal = () => setIsRequestModalOpen(true);
    window.addEventListener("open-request-menu-modal", openRequestModal);
    return () => window.removeEventListener("open-request-menu-modal", openRequestModal);
  }, []);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  // Handle search result selection
  const handleSearchResultSelect = (result: SearchResult): void => {
    if (result.id === 'request-menu') {
      setIsRequestModalOpen(true);
      setIsSearchOpen(false);
      return;
    }
    
    // Special handling for Food Items - route to patron-search with their restaurantId
    if (result.type === "Food Item" && result.restaurantId) {
      const itemAnchor = result.name.replace(/\s+/g, "-").toLowerCase();
      router.push(`/patron-search/${result.restaurantId}#${itemAnchor}`);
    } else {
      // For all other result types, route to patron-search with id parameter
      router.push(`/patron-search?id=${encodeURIComponent(result.id)}`);
    }
    
    setIsSearchOpen(false);
    setSearchTerm("");
    setSearchResults([]);
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Toggle profile dropdown
  const toggleProfileDropdown = (): void => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };
  
  // Handle logout
  const handleLogout = (): void => {
    signOut({ callbackUrl: "/login" });
  };
  
  // Check if a path is active
  const isActivePath = (path: string): boolean => {
    return pathname === path;
  };
  
  // Get hover styles for paths
  const getHoverStyle = (path: string): string => {
    switch(path) {
      case '/patron-dashboard':
        return `hover:bg-[${colorScheme.card1}]`;
      case '/discover':
        return `hover:bg-[${colorScheme.card2}]`;
      case '/patron-search':
        return `hover:bg-[${colorScheme.card3}]`;
      default:
        return `hover:bg-[${colorScheme.card4}]`;
    }
  };
  
  return (
    <>
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-6 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
    } ${className}`}>
      <div className="container mx-auto flex items-center justify-between">
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
            
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            href="/patron-dashboard" 
            className={`text-gray-700 py-2 px-3 rounded-md transition-colors ${
              isActivePath('/patron-dashboard') 
                ? 'bg-[#fdf9f5] font-medium' 
                : 'hover:bg-[#fdf9f5]'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/discover" 
            className={`text-gray-700 py-2 px-3 rounded-md transition-colors ${
              isActivePath('/discover') 
                ? 'bg-[#fdedf6] font-medium' 
                : 'hover:bg-[#fdedf6]'
            }`}
          >
            Discover
          </Link>
        </nav>
        
        {/* Search & Profile */}
        <div className="flex items-center space-x-4">
          {/* Search Button & Input */}
          <div className="relative" ref={searchContainerRef}>
            {isSearchOpen ? (
              <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full border border-gray-200 px-3 py-1 shadow-md">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search restaurants or meals..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-36 sm:w-48 md:w-64 p-1 border-none focus:outline-none bg-transparent"
                />
                <button 
                  onClick={toggleSearch}
                  className="ml-2 text-gray-500 hover:text-[#f3b4eb]"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            ) : (
              <button 
                onClick={toggleSearch} 
                className="text-gray-600 hover:text-[#f3b4eb] p-2"
              >
                <FontAwesomeIcon icon={faSearch} />
              </button>
            )}
            
            {/* Search Results Dropdown */}
            {isSearchOpen && (
              <SearchResults 
                results={searchResults}
                isLoading={isSearching}
                onResultClick={() => setIsSearchOpen(false)}
              />
            )}
          </div>
          
          {/* Home Icon - Added new link to homepage */}
          <Link 
            href="/"
            className="text-gray-600 hover:text-[#f3b4eb] p-2"
            title="Go to Homepage"
          >
            <FontAwesomeIcon icon={faHome} />
          </Link>
          
          {/* Request Menu Icon */}
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="text-gray-600 hover:text-[#f3b4eb] p-2"
            title="Request a Menu"
          >
            <FontAwesomeIcon icon={faClipboardList} />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button 
              onClick={toggleProfileDropdown}
              className="overflow-hidden"
            >
              {isLoadingProfile ? (
                // Show a loading indicator while fetching profile
                <div className="h-10 w-10 bg-[#f2d36e] rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-white text-xs">...</span>
                </div>
              ) : (
                <ProfileImage
                  profileImage={profileData?.profileImage || null}
                  name={profileData ? `${profileData.firstName} ${profileData.lastName}` : (session?.user?.name || "User")}
                  size={40}
                />
              )}
            </button>
            
            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-2">
                  {profileData ? (
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium">{`${profileData.firstName} ${profileData.lastName}`}</p>
                      <p className="text-sm text-gray-500">{profileData.email}</p>
                    </div>
                  ) : session?.user?.name ? (
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-sm text-gray-500">{session.user.email}</p>
                    </div>
                  ) : null}
                  <div className="py-1">
                    <Link 
                      href="/profile" 
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-[#fdedf6] rounded transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </Link>
                    <button 
                      onClick={() => router.push('/login')}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-[#f1eafe] rounded transition-colors flex items-center"
                    >
                      <FontAwesomeIcon icon={faExchangeAlt} className="mr-2 text-gray-500" />
                      Switch Account
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-[#fdedf6] rounded transition-colors flex items-center"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 text-gray-500" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden text-gray-600 hover:text-[#f3b4eb] p-2"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div 
        className={`md:hidden fixed inset-0 z-50 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } transition-opacity duration-300 ease-in-out`}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={toggleMobileMenu}></div>
        <div 
          className={`absolute right-0 top-0 h-full w-64 bg-white/90 backdrop-blur-sm shadow-xl transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Menu</h2>
              <button 
                onClick={toggleMobileMenu}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <nav className="flex flex-col space-y-3">
              {/* Add Home link to mobile menu too */}
              <Link 
                href="/" 
                className={`px-4 py-2 rounded ${
                  isActivePath('/') 
                    ? 'bg-[#faf2e5]' 
                    : 'hover:bg-[#faf2e5]'
                }`}
              >
                <FontAwesomeIcon icon={faHome} className="mr-2" />
                Home
              </Link>
              <Link 
                href="/patron-dashboard" 
                className={`px-4 py-2 rounded ${
                  isActivePath('/patron-dashboard') 
                    ? 'bg-[#fdf9f5]' 
                    : 'hover:bg-[#fdf9f5]'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/discover" 
                className={`px-4 py-2 rounded ${
                  isActivePath('/discover') 
                    ? 'bg-[#fdedf6]' 
                    : 'hover:bg-[#fdedf6]'
                }`}
              >
                Discover
              </Link>
              <div className="border-t border-gray-100 mt-4 pt-4">
                <button 
                  onClick={() => router.push('/login')}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-[#f1eafe] rounded"
                >
                  Switch Account
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-[#fdedf6] rounded"
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
    <RequestMenuModal 
      isOpen={isRequestModalOpen} 
      onClose={() => setIsRequestModalOpen(false)} 
    />
    </>
  );
};

export default PatronNav;