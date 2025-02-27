/*eslint-disable*/

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Kufam, Pacifico } from "next/font/google";
import Link from "next/link";

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

  // Track scroll position to conditionally render search bars
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
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
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-8 py-1 bg-transparent z-50">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href="/">
            <Image src="/assets/cyd_fullLogo.png" alt="Chow You Doing Logo" width={100} height={35} />
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex gap-8 text-[#5A5A5A] text-lg font-medium">
          <Link href="/browse" className="hover:text-[#A90D3C] transition">Browse</Link>
          <Link href="/search" className="relative text-[#A90D3C] font-semibold after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-[#A90D3C]">
            Search
          </Link>
          <Link href="/why" className="hover:text-[#A90D3C] transition">Why?</Link>
        </div>

        {/* Right: Location & Menu Icon */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 text-lg text-[#5A5A5A] cursor-pointer">
            <span>London</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#5A5A5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Hamburger Menu for Mobile */}
          <button className="md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#5A5A5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </nav>

      {/* First Background (home_layer1.svg) */}
      <motion.div
        className="fixed inset-0 layer1 spacer transition-all duration-1000 ease-in-out"
        style={{ opacity: fadeOutFirstHero }}
      />

      {/* Second Background (Blurred Food) */}
      <motion.div
        className="fixed inset-0 transition-all duration-1000 ease-in-out"
        style={{ opacity: fadeInSecondHero }}
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
        style={{ opacity: fadeInSecondHero }}
      />

      {/* First Section (Before Scroll) */}
      <motion.section
        className="fixed flex items-center justify-between w-full min-h-screen px-16"
        style={{ opacity: fadeOutFirstHero, pointerEvents: isScrolled ? "none" : "auto" }}
      >
        {/* Left Content: Heading & Search Bar */}
        <div className="flex flex-col w-1/2 items-center text-center">
          <h1
            className={`relative z-10 text-[96px] font-bold text-[#FFB400] drop-shadow-[5px_5px_10px_rgba(0,0,0,0.5)] leading-tight ${kufam.className}`}
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
        <div className="flex flex-col items-center w-1/2 pl-12"> {/* Added left padding for spacing */}
          <Image src="/assets/eat.png" alt="Eat Illustration" width={500} height={500} />
          <p className={`mt-6 text-[24px] text-[#FFB400] opacity-100 text-center ${kufam.className}`}>
            Discover, rate, and recommend <br />
            the best meals around you—one bite at a time.
          </p>
        </div>
      </motion.section>

      {/* Second Section (After Scroll) */}
      <motion.section
        className="fixed flex flex-col items-center justify-center w-full min-h-screen text-center"
        style={{ opacity: fadeInSecondHero, pointerEvents: isScrolled ? "auto" : "none" }}
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

      {/* Dummy scroll space to allow scrolling */}
      <div className="h-[200vh]" />
    </main>
  );
}