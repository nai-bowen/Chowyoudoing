"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SearchResults from './SearchResults';

type SearchResult = {
  id: string;
  name: string;
  type: "Restaurant" | "Food Item" | "Category" | "Location";
  url?: string;
  restaurant?: string;
};

type Filters = {
  restaurants: boolean;
  meals: boolean;
  categories: boolean;
  locations: boolean;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
};

const foodEmojis = ["🍕", "🍔", "🍣", "🍜", "🍩", "🌮", "🥗", "🍦", "🍗", "🧁", "🍹", "🥪"];

const Hero: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [placeholder, setPlaceholder] = useState<string>("Search for an interesting meal or restaurant!");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({
    restaurants: true,
    meals: true,
    categories: true,
    locations: true,
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [dropdownVisible, setDropdownVisible] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Handle scroll to control dropdown visibility
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const isInView = rect.bottom > 100 && rect.top < window.innerHeight;
        setDropdownVisible(isInView);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search results
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const fetchResults = async (): Promise<void> => {
      setIsSearching(true);
      try {
        // Build query string with filters
        let queryString = `q=${encodeURIComponent(query)}`;
        queryString += `&restaurants=${filters.restaurants}`;
        queryString += `&meals=${filters.meals}`;
        queryString += `&categories=${filters.categories}`;
        queryString += `&locations=${filters.locations}`;

        const res = await fetch(`/api/search?${queryString}`);
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json() as { results: SearchResult[] };
        setResults(data.results);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      void fetchResults();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, filters]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setQuery(e.target.value);
  };

  // Function to handle popular search term clicks
  const handlePopularTermClick = (term: string): void => {
    setQuery(term);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleFilter = (filter: keyof Filters): void => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  const getActiveFilterCount = (): number => {
    return Object.values(filters).filter(Boolean).length;
  };

  // Handle closing dropdown when a result is clicked
  const handleResultClick = (): void => {
    setQuery("");
    setResults([]);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // Memoize particles for better performance
  const memoizedParticles = useMemo(() => {
    const particleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 15 : 30;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 2,
        speed: Math.random() * 5 + 3,
      });
    }

    return newParticles.map(particle => (
      <div
        key={particle.id}
        className="absolute rounded-full bg-gradient-to-r from-[#FFB400]/30 to-[#F8A5A5]/30 pointer-events-none"
        style={{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          opacity: particle.size < 5 ? 0.3 : 0.5,
          animation: `float ${particle.speed}s ease-in-out infinite alternate`,
        }}
      />
    ));
  }, []);

  // Memoize emoji animations for better performance
  const memoizedEmojis = useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return null;

    return foodEmojis.slice(0, 14).map((emoji, index) => {
      const randomX = Math.random() * 100;
      const randomY = Math.random() * 100;
      const randomDelay = Math.random() * 5;
      const randomDuration = 5 + Math.random() * 5;

      return (
        <div
          key={index}
          className="food-emoji absolute select-none pointer-events-none"
          style={{
            top: `${randomY}%`,
            left: `${randomX}%`,
            animation: `float ${randomDuration}s ease-in-out infinite`,
            animationDelay: `${randomDelay}s`,
            opacity: 0.6,
            zIndex: 1,
            fontSize: '2rem',
          }}
        >
          {emoji}
        </div>
      );
    });
  }, []);

  return (
    <section ref={heroRef} className="relative pt-16 pb-[9.375rem] md:pt-24 md:pb-[9.375rem] bg-gradient-to-b from-[#FFF9E9] to-white overflow-x-hidden">
      {/* Background elements */}
      <div className="absolute top-20 right-10 w-24 h-24 bg-[#FFB400]/10 rounded-full -z-10"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-[#F8A5A5]/10 rounded-full -z-10"></div>

      {/* Animated particles and emojis */}
      {memoizedParticles}
      {memoizedEmojis}

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-[#F1C84B]">
            Where <span className="text-[#F9B79F]">taste</span> speaks,<br />
            and meals shine
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Discover, rate, and recommend the best meals around you—one bite at a time.
          </p>

          {/* Search bar */}
          <div className="relative w-full max-w-xl">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleQueryChange}
                onFocus={() => setPlaceholder("")}
                onBlur={() => query === "" && setPlaceholder("Search for an interesting meal or restaurant!")}
                className="w-full p-4 pr-20 rounded-full shadow-md text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FFB400]/50 focus:border-[#FFB400]"
                aria-label="Search"
              />
              
              {/* Filter button */}
              <div className="absolute right-14 top-1/2 transform -translate-y-1/2" ref={filterRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilters(!showFilters);
                  }}
                  className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Filter search results"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {getActiveFilterCount() < 4 && (
                    <span className="absolute -top-1 -right-1 bg-[#F1C84B] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </button>
                
                {/* Filter dropdown */}
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-gray-700 mb-2 border-b pb-1">Filter Results</h3>
                      <div className="space-y-2">
                        {Object.keys(filters).map((key) => (
                          <label key={key} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters[key as keyof Filters]}
                              onChange={() => toggleFilter(key as keyof Filters)}
                              className="form-checkbox h-4 w-4 text-[#F1C84B] rounded focus:ring-[#F1C84B]"
                            />
                            <span className="text-sm text-gray-700 capitalize">{key}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Search icon or loading spinner */}
              <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-[#FFB400] border-t-[#F1C84B] rounded-full animate-spin"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-[#F1C84B]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
              </div>
            </div>
            
            {/* Search results dropdown */}
            {results.length > 0 && dropdownVisible && (
              <SearchResults 
                results={results} 
                isLoading={isSearching} 
                onResultClick={handleResultClick}
              />
            )}

            {/* Popular search terms - updated to set search query instead of navigating */}
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm text-gray-500">
              <span>Popular:</span>
              <button 
                onClick={() => handlePopularTermClick("Pizza")} 
                className="text-[#F1C84B] hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit"
              >
                Pizza
              </button>
              <button 
                onClick={() => handlePopularTermClick("Sushi")} 
                className="text-[#F1C84B] hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit"
              >
                Sushi
              </button>
              <button 
                onClick={() => handlePopularTermClick("Burgers")} 
                className="text-[#F1C84B] hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit"
              >
                Burgers
              </button>
              <button 
                onClick={() => handlePopularTermClick("Vegetarian")} 
                className="text-[#F1C84B] hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit"
              >
                Vegetarian
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </section>
  );
};

export default Hero;