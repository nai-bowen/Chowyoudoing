/*eslint-disable*/

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Kufam, Pacifico } from "next/font/google";
import Link from "next/link";
import ResponsiveNavbar from "@/app/_components/ResponsiveNavbar";


// Import Google Fonts Correctly
const kufam = Kufam({
  weight: "700",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
});

// Define the Type for Search Results
type SearchResult = {
  id: string;
  name: string;
  url: string;
  type: "Restaurant" | "Food Item" | "Category";
  restaurant?: string;
};

// Define filters type
type Filters = {
  restaurants: boolean;
  meals: boolean;
  categories: boolean;
  locations: boolean;
};

// Define a type for the API response
type SearchResponse = {
  results: SearchResult[];
};

// Define types for reviews section
type ReviewRatings = {
  taste: number;
  value: number;
  service: number;
};

type Review = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  location: string;
  content: string;
  imageUrl: string;
  ratings: ReviewRatings;
  reviewer: {
    name: string;
    id: string;
  };
};

// Define the response type for review fetching
type ReviewsResponse = {
  reviews: Review[];
  hasLocalReviews: boolean;
};

export default function Home() {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [placeholder, setPlaceholder] = useState<string>("Search for an interesting meal or restaurant!");
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const secondDropdownRef = useRef<HTMLDivElement | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSecondFilters, setShowSecondFilters] = useState<boolean>(false);
  const filterRef = useRef<HTMLDivElement | null>(null);
  const secondFilterRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState<Filters>({
    restaurants: true,
    meals: true,
    categories: true,
    locations: true,
  });

  const { scrollY } = useScroll();

  // Scroll-based animations for emblem
  const rotateEmblem = useTransform(scrollY, [0, 500], [0, 360]); // Full rotation
  const scaleEmblem = useTransform(scrollY, [0, 500], [1, 2]); // Doubles in size
  const fadeOutEmblem = useTransform(scrollY, [300, 500], [1, 0]); // Fades out at the end

  const fadeOutFirstHero = useTransform(scrollY, [300, 500], [1, 0]);
  const fadeInSecondHero = useTransform(scrollY, [300, 500], [0, 1]);
  const fadeOutSecondHero = useTransform(scrollY, [500, 700], [1, 0]);
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeReview, setActiveReview] = useState<number>(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<string>("");
  const [hasLocalReviews, setHasLocalReviews] = useState<boolean>(false);
    
  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
      if (secondFilterRef.current && !secondFilterRef.current.contains(event.target as Node)) {
        setShowSecondFilters(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function adjustDropdownHeight() {
      if (dropdownRef.current) {
        const bounding = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - bounding.top;

        // Set max height dynamically based on available space
        dropdownRef.current.style.maxHeight = `${Math.min(spaceBelow - 20, 300)}px`;
      }
    }

    adjustDropdownHeight();
    window.addEventListener("resize", adjustDropdownHeight);
    return () => window.removeEventListener("resize", adjustDropdownHeight);
  }, [results]);

  // Adjust height for second dropdown
  useEffect(() => {
    function adjustSecondDropdownHeight() {
      if (secondDropdownRef.current) {
        const bounding = secondDropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - bounding.top;

        // Dynamically set max height
        secondDropdownRef.current.style.maxHeight = `${Math.min(spaceBelow - 20, 300)}px`;
      }
    }

    adjustSecondDropdownHeight();
    window.addEventListener("resize", adjustSecondDropdownHeight);
    return () => window.removeEventListener("resize", adjustSecondDropdownHeight);
  }, [results]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      
      // This condition already exists, which is good
      if (window.scrollY > 700) {
        setIsScrolledPastHero(true);
      } else {
        setIsScrolledPastHero(false);
      }
    };
  
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    const fetchResults = async () => {
      try {
        // Build query string with filters
        let queryString = `q=${encodeURIComponent(query)}`;
        queryString += `&restaurants=${filters.restaurants}`;
        queryString += `&meals=${filters.meals}`;
        queryString += `&categories=${filters.categories}`;
        queryString += `&locations=${filters.locations}`;
  
        const res = await fetch(`/api/search?${queryString}`);
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        const data = await res.json() as SearchResponse;
        setResults(data.results);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setResults([]);
      }
    };
  
    const timeoutId = setTimeout(() => {
      void fetchResults(); // ✅ Ensure fetchResults is called without returning a Promise
    }, 300);
  
    return () => clearTimeout(timeoutId);
  }, [query, filters]);
  
  // Fetch user's location and reviews
  useEffect(() => {
    // Get user's location (using browser geolocation API or IP geolocation service)
    const getUserLocation = async (): Promise<void> => {
      try {
        // For this example, we'll just use a default value
        // In a real implementation, you would use geolocation or get it from user preferences
        setUserLocation("London");
        
        await fetchReviews("London");
      } catch (error) {
        console.error("Error getting user location:", error);
        // Fall back to default reviews if location can't be determined
        await fetchReviews("");
      }
    };
    
    void getUserLocation();
  }, []);

  // Function to fetch reviews based on location
  const fetchReviews = async (location: string): Promise<void> => {
    setIsLoadingReviews(true);
    try {
      // Call the API to get reviews, with location as a parameter
      const res = await fetch(`/api/reviews?location=${encodeURIComponent(location)}`);
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      
      const data = await res.json() as ReviewsResponse;
      setReviews(data.reviews);
      setHasLocalReviews(data.hasLocalReviews);
      setIsLoadingReviews(false);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Set some dummy reviews for demo purposes
      setReviews([
        {
          id: "1",
          restaurantId: "popeyes1",
          restaurantName: "Popeyes",
          location: "London",
          content: "The chicken sandwich was incredible! Crispy on the outside, juicy on the inside. Perfect amount of spice and the bread was fresh. I'll definitely be back for more.",
          imageUrl: "/assets/popeyes.jpg",
          ratings: { taste: 4, value: 5, service: 5 },
          reviewer: { name: "Lisa B.", id: "user1" }
        },
        {
          id: "2",
          restaurantId: "&kith1",
          restaurantName: "&Kith - Leicester",
          location: "Leicester",
          content: "Their avocado toast is a game-changer! The bread was perfectly toasted and the toppings were fresh. Great spot for brunch with friends.",
          imageUrl: "/assets/&kith.jpg",
          ratings: { taste: 4, value: 5, service: 5 },
          reviewer: { name: "Mark T.", id: "user2" }
        },
        {
          id: "3",
          restaurantId: "chickanos1",
          restaurantName: "Chickanos",
          location: "Birmingham",
          content: "The chicken burger was amazing! Juicy chicken with the perfect crunch. Their fries are also exceptional - crispy and well-seasoned.",
          imageUrl: "/assets/chickanos.jpg",
          ratings: { taste: 4, value: 5, service: 5 },
          reviewer: { name: "Ricky H.", id: "user3" }
        }
      ]);
      setIsLoadingReviews(false);
      setHasLocalReviews(false);
    }
  };

  // Auto-rotate through reviews every 5 seconds
  useEffect(() => {
    if (reviews.length === 0) return;
    
    const interval = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % reviews.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [reviews]);

  // Handle navigation between reviews
  function navigateReviews(direction: 'prev' | 'next'): void {
    if (direction === 'prev') {
      setActiveReview((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
    } else {
      setActiveReview((prev) => (prev + 1) % reviews.length);
    }
  }

  // Handler for updating the query state
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // Toggle a filter
  const toggleFilter = (filter: keyof Filters) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(filters).filter(Boolean).length;
  };

  // Render search result items with proper typing and error handling
  const renderSearchResultItem = (result: SearchResult) => {
    // Determine if URL is external or internal
    const isExternal = result.url && result.url.startsWith("http");
    
    // For restaurant types, ensure we're using the ID correctly
    let link: string;
    if (result.type === "Restaurant") {
      link = `/restaurants/${result.id}`;
    } else if (isExternal) {
      link = result.url;
    } else {
      // Default for other types or when URL isn't provided
      link = result.url || `/search?q=${encodeURIComponent(result.name)}`;
    }

    return (
      <Link 
        key={result.id} 
        href={link} 
        target={isExternal ? "_blank" : "_self"} 
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="flex items-center px-4 py-2 hover:bg-gray-100"
      >
        <div className="flex-1">
          <p className="text-gray-800 font-medium">{result.name}</p>
          <div className="flex items-center">
            {result.restaurant && (
              <p className="text-gray-500 text-sm">{result.restaurant}</p>
            )}
            <span className="ml-auto text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {result.type}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
{/* Replace your existing nav element with this line */}
<ResponsiveNavbar currentPage="search" location={userLocation} />

      {/* First Background (home_layer1.svg) */}
      <motion.div
        className="fixed inset-0 layer1 spacer transition-all duration-1000 ease-in-out"
        style={{ opacity: fadeOutFirstHero }}
      />

      {/* Second Background (Blurred Food) */}
      <motion.div
        className="fixed inset-0 transition-all duration-1000 ease-in-out"
        style={{ 
          opacity: isScrolledPastHero ? 0 : fadeInSecondHero, 
          pointerEvents: isScrolledPastHero ? "none" : "auto" 
        }}
      >
        <Image
          src="/assets/background_3blur.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="transition-opacity duration-1000"
        />
      </motion.div>

    {/* Layer 2 (SVG Overlay) - FADES IN WITH SECOND PAGE */}
    <motion.div
      className="fixed inset-0 layer2 transition-all duration-1000 ease-in-out"
      style={{ 
        opacity: isScrolledPastHero ? 0 : fadeInSecondHero, 
        pointerEvents: isScrolledPastHero ? "none" : "auto"
      }}
    />
      {/* First Section (Before Scroll) */}
      <motion.section
        className="fixed flex flex-col md:flex-row items-center justify-between w-full min-h-screen px-4 md:px-16"
        style={{ opacity: fadeOutFirstHero, pointerEvents: isScrolled ? "none" : "auto" }}
      >
        {/* Left Content: Heading & Search Bar */}
        <div className="flex flex-col w-full md:w-1/2 items-center text-center">
                    <h1
              className={`relative z-10 text-5xl md:text-[96px] font-bold text-[#FFB400] drop-shadow-[5px_5px_10px_rgba(0,0,0,0.5)] leading-tight ${kufam.className}`}
            >
            Where{" "}
            <span className="relative inline-block">
              {/* Emblem with Scaling & Rotation Effect */}
              <motion.div
                className="absolute inset-0 -translate-x-1/2 left-1/2 -top-4 z-0"
                style={{
                  rotate: rotateEmblem,
                  scale: scaleEmblem,
                  opacity: fadeOutEmblem,
                  width: "150px",
                  height: "150px",
                }}
              >
                <Image src="/assets/cyd_emblem.png" alt="Rotating Emblem" layout="fill" />
              </motion.div>
              <span className={`${pacifico.className} text-[#A90D3C] relative z-10`}>taste</span>
            </span>{" "}
            speaks,
            <br />
            and meals shine
          </h1>

          {/* Search Bar - First Section */}
          <div className="relative w-full max-w-2xl mx-auto mt-6 z-20">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleQueryChange}
                onFocus={() => setPlaceholder("")}
                onBlur={() => query === "" && setPlaceholder("Search for an interesting meal or restaurant!")}
                className="w-full p-4 pr-20 rounded-full shadow-lg text-gray-800 border border-gray-300 focus:outline-none focus:ring-0 focus:border-[#FFB400] cursor-text"
              />
              
              {/* Filter Button */}
              <div className="absolute right-14 top-1/2 transform -translate-y-1/2" ref={filterRef}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    setShowFilters(!showFilters);
                  }}
                  className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {getActiveFilterCount() < 4 && (
                    <span className="absolute -top-1 -right-1 bg-[#A90D3C] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </button>
                
                {/* Filter Dropdown */}
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-gray-700 mb-2 border-b pb-1">Filter Results</h3>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={filters.restaurants} 
                            onChange={() => toggleFilter('restaurants')}
                            className="form-checkbox h-4 w-4 text-[#A90D3C] rounded focus:ring-[#A90D3C]" 
                          />
                          <span className="text-sm text-gray-700">Restaurants</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={filters.meals} 
                            onChange={() => toggleFilter('meals')}
                            className="form-checkbox h-4 w-4 text-[#A90D3C] rounded focus:ring-[#A90D3C]" 
                          />
                          <span className="text-sm text-gray-700">Meals</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={filters.categories} 
                            onChange={() => toggleFilter('categories')}
                            className="form-checkbox h-4 w-4 text-[#A90D3C] rounded focus:ring-[#A90D3C]" 
                          />
                          <span className="text-sm text-gray-700">Categories</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={filters.locations} 
                            onChange={() => toggleFilter('locations')}
                            className="form-checkbox h-4 w-4 text-[#A90D3C] rounded focus:ring-[#A90D3C]" 
                          />
                          <span className="text-sm text-gray-700">Locations</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Search Icon */}
              <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 17l5-5m0 0l-5-5m5 5H3" />
                </svg>
              </div>
            </div>

            {/* Search Results Dropdown */}
            {!isScrolled && results.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute left-0 mt-2 w-full bg-white shadow-lg rounded-lg border border-gray-300 z-40 overflow-y-auto"
              >
                {results.map(renderSearchResultItem)}
              </div>
            )}
          </div>
        </div>

        {/* Right Content: Illustration & Subtitle */}
        <div className="flex flex-col items-center w-full md:w-1/2 md:pl-12 mt-8 md:mt-0">
          <Image src="/assets/eat.png" alt="Eat Illustration" width={500} height={500} className="max-w-full h-auto" />
          <p className={`mt-6 text-lg md:text-[24px] text-[#FFB400] opacity-100 text-center ${kufam.className}`}>
            Discover, rate, and recommend <br />
            the best meals around you—one bite at a time.
          </p>
        </div>
      </motion.section>

      {/* Second Section (After Scroll) */}
      <motion.section
        className="fixed flex flex-col items-center justify-center w-full min-h-screen px-4 md:px-16 text-center"
        style={{ opacity: fadeInSecondHero }}
      >
        <h1
          className={`text-[128px] font-bold text-white drop-shadow-lg leading-tight ${kufam.className}`}
        >
          Where{" "}
          <span className="relative inline-block">
            {/* Emblem with Scaling & Rotation Effect in the second section */}
            <motion.div
              className="absolute inset-0 -translate-x-1/2 left-1/2 -top-10 z-0"
              style={{
                rotate: rotateEmblem,
                scale: scaleEmblem,
                opacity: fadeOutEmblem,
                width: "150px",
                height: "150px",
              }}
            >
              <Image src="/assets/cyd_emblem.png" alt="Rotating Emblem" layout="fill" />
            </motion.div>
            <span className={`${pacifico.className} text-white relative z-10`}>taste</span>
          </span>{" "}
          speaks,
          <br />
          and meals shine
        </h1>

        {/* Search Bar - Second Section */}
        <div className="mt-6 relative w-full max-w-2xl z-20">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={handleQueryChange}
              onFocus={() => setPlaceholder("")}
              onBlur={() => query === "" && setPlaceholder("Search for an interesting meal or restaurant!")}
              className="w-full p-4 pr-20 rounded-full shadow-lg text-gray-800 border border-gray-300 focus:outline-none focus:ring-0 focus:border-[#FFB400] cursor-text"
            />
            
            {/* Filter Button for Second Search Bar */}
            <div className="absolute right-14 top-1/2 transform -translate-y-1/2" ref={secondFilterRef}>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  setShowSecondFilters(!showSecondFilters);
                }}
                className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {getActiveFilterCount() < 4 && (
                  <span className="absolute -top-1 -right-1 bg-[#A90D3C] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
              
              {/* Filter Dropdown for Second Search Bar */}
              {showSecondFilters && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-gray-700 mb-2 border-b pb-1">Filter Results</h3>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.restaurants} 
                          onChange={() => toggleFilter('restaurants')}
                          className="form-checkbox h-4 w-4 text-[#A90D3C] rounded focus:ring-[#A90D3C]" 
                        />
                        <span className="text-sm text-gray-700">Restaurants</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.meals} 
                          onChange={() => toggleFilter('meals')}
                          className="form-checkbox h-4 w-4 text-[#A90D3C] rounded focus:ring-[#A90D3C]" 
                        />
                        <span className="text-sm text-gray-700">Meals</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.categories} 
                          onChange={() => toggleFilter('categories')}
                          className="form-checkbox h-4 w-4 text-[#A90D3C] rounded focus:ring-[#A90D3C]" 
                        />
                        <span className="text-sm text-gray-700">Categories</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.locations} 
                          onChange={() => toggleFilter('locations')}
                          className="form-checkbox h-4 w-4 text-[#A90D3C] rounded focus:ring-[#A90D3C]" 
                        />
                        <span className="text-sm text-gray-700">Locations</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Search Icon */}
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 17l5-5m0 0l-5-5m5 5H3"
                />
              </svg>
            </div>
          </div>
          
          {/* Search Results Dropdown for Second Search Bar */}
          {isScrolled && results.length > 0 && (
            <div
              ref={secondDropdownRef}
              className="absolute left-0 w-full bg-white shadow-lg rounded-lg border border-gray-300 z-40 overflow-y-auto"
              style={{ top: "100%", marginTop: "8px" }}
            >
              {results.map(renderSearchResultItem)}
            </div>
          )}
        </div>

        <p className={`mt-6 text-lg text-white ${kufam.className}`}>
          Discover, rate, and recommend the best meals around you—one bite at a time.
        </p>
      </motion.section>

<div className="h-[200vh]"></div>
{/* Reviews Section - Updated with SVG background */}
<section className="relative pt-20 pb-20" style={{ 
  backgroundImage: "url('/assets/background_ssr.svg')", 
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat" 
}}>
  {/* Add a negative margin to account for the fixed height spacer */}
  <div className="container mx-auto px-4 md:px-8 max-w-6xl mt-8">
    {/* Short & Sweet Reviews Title - Improved spacing */}
    <div className="flex flex-col md:flex-row items-start justify-between mb-16">
      <h2 className={`text-5xl font-bold text-[#D29501] ${kufam.className} mb-6 md:mb-0`}>
        Short <span className="text-[#F8A5A5]">&</span> Sweet<br /> 
        <span className={`${kufam.className}`}>Reviews</span>
      </h2>
      <div className="md:w-1/2">
        <p className="text-[#5A5A5A] leading-relaxed">
          At Chow You Doing?, we take food reviews seriously—well, as seriously as you can when drooling over crispy fries and gooey desserts! Whether you're hunting for the best bites in town or warning others about a "never again" meal, our reviews have got you covered. Plus, we've handpicked some top-notch recommendations just for you—because we know a good meal when we see one! So go ahead, explore, rate, and let your taste buds lead the way.
        </p>
      </div>
    </div>
    
    {/* Reviews Carousel */}
    <div className="relative">
      {isLoadingReviews ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D29501]"></div>
        </div>
      ) : reviews.length > 0 ? (
        <>
          {/* Location Notice */}
          {hasLocalReviews && (
            <div className="mb-8 text-center">
              <span className="bg-[#A90D3C] text-white px-4 py-1 rounded-full text-sm">
                Reviews from {userLocation}
              </span>
            </div>
          )}
          
          {/* Navigation Arrows */}
          <button 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition-colors"
            onClick={() => navigateReviews('prev')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#D29501]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition-colors"
            onClick={() => navigateReviews('next')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#D29501]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Reviews Slider */}
          <div className="flex overflow-hidden">
            {reviews.map((review, index) => (
              <div 
                key={review.id} 
                className={`transition-all duration-500 flex-shrink-0 w-full flex justify-center ${
                  index === activeReview ? 'opacity-100 transform-none' : 'opacity-0 absolute'
                }`}
                style={{ display: index === activeReview ? 'flex' : 'none' }}
              >
                <div className="w-full max-w-4xl">
                  <div className="relative flex flex-col items-center">
                    {/* Star Icon */}
                    <div className="text-[#FFB400] text-5xl mb-2">★</div>
                    
                    {/* Review Content - Improved padding */}
                    <div className="relative z-10 bg-white rounded-lg shadow-lg p-6 md:p-8 min-h-[12rem] flex flex-col md:flex-row mb-8">
                      {/* Review Image */}
                      <div className="md:w-1/3 flex justify-center mb-6 md:mb-0">
                        <div className="w-56 h-56 md:w-64 md:h-64 relative rounded-lg overflow-hidden">
                          <Image 
                            src={review.imageUrl || '/assets/placeholder-food.jpg'} 
                            alt={`Food at ${review.restaurantName}`} 
                            layout="fill"
                            objectFit="cover"
                            className="rounded-lg"
                          />
                        </div>
                      </div>
                      
                      {/* Review Text */}
                      <div className="md:w-2/3 md:pl-6 flex flex-col justify-between">
                        <p className="text-[#5A5A5A] text-lg italic mb-4">{review.content}</p>
                        <div>
                          <div className="flex justify-end mb-4">
                            <p className="text-[#A90D3C] font-medium">-{review.reviewer.name}</p>
                          </div>
                          
                          {/* Ratings - Better spacing */}
                          <div className="flex flex-wrap justify-center mt-2 gap-6">
                            <div className="flex items-center">
                              <span className="text-[#FFB400] mr-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className={i < review.ratings.taste ? 'text-[#FFB400]' : 'text-gray-300'}>★</span>
                                ))}
                              </span>
                              <span className="text-xs text-[#5A5A5A]">Taste</span>
                            </div>
                            
                            <div className="flex items-center">
                              <span className="text-[#FFB400] mr-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className={i < review.ratings.value ? 'text-[#FFB400]' : 'text-gray-300'}>★</span>
                                ))}
                              </span>
                              <span className="text-xs text-[#5A5A5A]">Value</span>
                            </div>
                            
                            <div className="flex items-center">
                              <span className="text-[#FFB400] mr-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className={i < review.ratings.service ? 'text-[#FFB400]' : 'text-gray-300'}>★</span>
                                ))}
                              </span>
                              <span className="text-xs text-[#5A5A5A]">Service</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Restaurant Name */}
                    <Link 
                      href={`/restaurants/${review.restaurantId}`} 
                      className="bg-[#F8A5A5] text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-[#A90D3C] transition-colors"
                    >
                      {review.restaurantName}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Dots - Added more margin */}
          <div className="flex justify-center mt-10">
            {reviews.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full mx-1.5 ${
                  index === activeReview ? 'bg-[#A90D3C]' : 'bg-[#F8A5A5]'
                }`}
                onClick={() => setActiveReview(index)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-96">
          <p className="text-[#5A5A5A] text-xl">No reviews available yet. Be the first to write one!</p>
        </div>
      )}
    </div>
  </div>
{/* Call to Action Section */}
<div 
  className="relative py-16 md:py-20"
  style={{ 
    backgroundImage: "url('/assets/background_cta.svg')", 
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat" 
  }}
>
  <div className="container mx-auto px-4 md:px-8 max-w-6xl">
    <h2 className={`text-4xl md:text-5xl font-bold text-[#D29501] text-center mb-12 ${kufam.className}`}>
      First time here?
    </h2>
    
    {/* Instructions Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Step 1 */}
      <div className="relative bg-white/90 rounded-lg shadow-md p-6 text-center flex flex-col items-center border-t-4 border-[#F8A5A5]">
        <div className="absolute -top-5 left-4 bg-[#F8A5A5] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
          1
        </div>
        <div className="w-24 h-24 bg-[#F8A5A5] rounded-full flex items-center justify-center mb-4">
          <Image 
            src="/assets/fast-food.png" 
            alt="Find food icon" 
            width={60} 
            height={60}
          />
        </div>
        <h3 className={`text-lg font-semibold mb-3 text-[#5A5A5A] ${kufam.className}`}>
          Find delicious meals and restaurants near you.
        </h3>
      </div>
      
      {/* Step 2 */}
      <div className="relative bg-white/90 rounded-lg shadow-md p-6 text-center flex flex-col items-center border-t-4 border-[#F8A5A5]">
        <div className="absolute -top-5 left-4 bg-[#F8A5A5] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
          2
        </div>
        <div className="w-24 h-24 bg-[#F8A5A5] rounded-full flex items-center justify-center mb-4">
          <Image 
            src="/assets/good-review.png" 
            alt="Review icon" 
            width={60} 
            height={60}
          />
        </div>
        <h3 className={`text-lg font-semibold mb-3 text-[#5A5A5A] ${kufam.className}`}>
          Rate portions, leave reviews, and share your recommendations.
        </h3>
      </div>
      
      {/* Step 3 */}
      <div className="relative bg-white/90 rounded-lg shadow-md p-6 text-center flex flex-col items-center border-t-4 border-[#F8A5A5]">
        <div className="absolute -top-5 left-4 bg-[#F8A5A5] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
          3
        </div>
        <div className="w-24 h-24 bg-[#F8A5A5] rounded-full flex items-center justify-center mb-4">
          <Image 
            src="/assets/rating.png" 
            alt="Discover icon" 
            width={60} 
            height={60}
          />
        </div>
        <h3 className={`text-lg font-semibold mb-3 text-[#5A5A5A] ${kufam.className}`}>
          Follow food lovers and discover new favourites!
        </h3>
      </div>
    </div>
    
    {/* CTA Text */}
    <div className="text-center mb-8">
      <h3 className={`text-2xl font-semibold text-[#A90D3C] ${kufam.className}`}>
        Join now to start reviewing!
      </h3>
    </div>
    
    {/* CTA Buttons */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      <Link href="/register">
        <button
          className="w-44 py-3 px-6 bg-[#F8A5A5] text-white rounded-full font-medium text-lg hover:bg-[#A90D3C] transition-colors shadow-md"
        >
          Sign Up
        </button>
      </Link>
      
      <Link href="/login">
        <button
          className="w-44 py-3 px-6 bg-white text-[#A90D3C] border border-[#A90D3C] rounded-full font-medium text-lg hover:bg-[#FFF5E1] transition-colors shadow-md"
        >
          Login
        </button>
      </Link>
    </div>
  </div>
  </div>
</section>
  

    </main>
  );
}