/*eslint-disable*/
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ScrapePayload {
  url: string;
  widerAreas: string[];
  type: "category" | "restaurant";
}

export default function ScraperInputPage(): JSX.Element {
  const router = useRouter();
  const [password, setPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form data for category scraping
  const [categoryUrl, setCategoryUrl] = useState<string>("");
  const [widerAreaInput, setWiderAreaInput] = useState<string>("");
  const [widerAreas, setWiderAreas] = useState<string[]>([]);
  
  // Form data for single restaurant scraping
  const [restaurantUrl, setRestaurantUrl] = useState<string>("");
  const [restaurantWiderAreaInput, setRestaurantWiderAreaInput] = useState<string>("");
  const [restaurantWiderAreas, setRestaurantWiderAreas] = useState<string[]>([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"category" | "restaurant">("category");

  // Attempt to authenticate with stored token on page load
  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken");
    if (storedToken) {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle login
  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!password.trim()) return;
    
    // Store password in localStorage
    localStorage.setItem("adminToken", password);
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = (): void => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
  };

  // Handle adding a wider area for category scraping
  const handleAddWiderArea = (): void => {
    if (!widerAreaInput.trim()) return;
    
    if (!widerAreas.includes(widerAreaInput.trim())) {
      setWiderAreas([...widerAreas, widerAreaInput.trim()]);
    }
    
    setWiderAreaInput("");
  };

  // Handle removing a wider area for category scraping
  const handleRemoveWiderArea = (area: string): void => {
    setWiderAreas(widerAreas.filter(a => a !== area));
  };

  // Handle adding a wider area for restaurant scraping
  const handleAddRestaurantWiderArea = (): void => {
    if (!restaurantWiderAreaInput.trim()) return;
    
    if (!restaurantWiderAreas.includes(restaurantWiderAreaInput.trim())) {
      setRestaurantWiderAreas([...restaurantWiderAreas, restaurantWiderAreaInput.trim()]);
    }
    
    setRestaurantWiderAreaInput("");
  };

  // Handle removing a wider area for restaurant scraping
  const handleRemoveRestaurantWiderArea = (area: string): void => {
    setRestaurantWiderAreas(restaurantWiderAreas.filter(a => a !== area));
  };

  // Handle wider area input with Enter key for category scraping
  const handleWiderAreaKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddWiderArea();
    }
  };

  // Handle wider area input with Enter key for restaurant scraping
  const handleRestaurantWiderAreaKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRestaurantWiderArea();
    }
  };

  // Handle scrape form submission
  const handleScrapeSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    let url: string;
    let selectedWiderAreas: string[];
    
    if (activeTab === "category") {
      if (!categoryUrl.trim()) {
        setError("Please enter a valid category URL");
        return;
      }
      url = categoryUrl;
      selectedWiderAreas = widerAreas;
    } else {
      if (!restaurantUrl.trim()) {
        setError("Please enter a valid restaurant URL");
        return;
      }
      url = restaurantUrl;
      selectedWiderAreas = restaurantWiderAreas;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const payload: ScrapePayload = {
        url,
        widerAreas: selectedWiderAreas,
        type: activeTab
      };
      
      const response = await fetch("/api/scraper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem("adminToken");
          throw new Error("Invalid admin password");
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to scrape data");
      }
      
      const data = await response.json();
      setSuccessMessage(data.message || "Scraping completed successfully");
      
      // Clear form after successful submission
      if (activeTab === "category") {
        setCategoryUrl("");
      } else {
        setRestaurantUrl("");
      }
    } catch (err) {
      console.error("Error scraping data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-[#dab9f8]">
            Admin Authentication
          </h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#dab9f8] focus:border-[#dab9f8]"
                placeholder="Enter admin password"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-2 px-4 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2] focus:outline-none focus:ring-2 focus:ring-[#dab9f8] focus:ring-offset-2"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#dab9f8]">
            Restaurant Scraper
          </h1>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className="text-gray-600 hover:text-gray-900"
            >
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button 
              onClick={() => setError(null)}
              className="float-right"
            >
              &times;
            </button>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
            <button 
              onClick={() => setSuccessMessage(null)}
              className="float-right"
            >
              &times;
            </button>
          </div>
        )}
        
        {/* Tabs */}
        <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-sm p-1 mb-6 max-w-md">
          <div className="flex">
            <button 
              className={`py-3 px-4 font-medium rounded-lg transition-all ${
                activeTab === 'category' 
                ? 'bg-[#faf2e8] text-black' 
                : 'text-gray-600 hover:bg-white/50'
              }`}
              onClick={() => setActiveTab('category')}
            >
              Category Scraper
            </button>
            <button 
              className={`py-3 px-4 font-medium rounded-lg transition-all ${
                activeTab === 'restaurant' 
                ? 'bg-[#fad9ea] text-black' 
                : 'text-gray-600 hover:bg-white/50'
              }`}
              onClick={() => setActiveTab('restaurant')}
            >
              Single Restaurant
            </button>
          </div>
        </div>
        
        {/* Category Scraper Form */}
        {activeTab === "category" && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Scrape Multiple Restaurants</h2>
            
            <form onSubmit={handleScrapeSubmit} className="space-y-6">
              <div>
                <label htmlFor="categoryUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Uber Eats Category URL
                </label>
                <input
                  id="categoryUrl"
                  type="text"
                  value={categoryUrl}
                  onChange={(e) => setCategoryUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#dab9f8] focus:border-[#dab9f8]"
                  placeholder="e.g., https://www.ubereats.com/gb/category/london"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter a URL for a city category page from Uber Eats
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wider Areas (Optional)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={widerAreaInput}
                    onChange={(e) => setWiderAreaInput(e.target.value)}
                    onKeyDown={handleWiderAreaKeyDown}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#dab9f8] focus:border-[#dab9f8]"
                    placeholder="Add a wider area (e.g., Greater London, West Midlands)"
                  />
                  <button
                    type="button"
                    onClick={handleAddWiderArea}
                    className="px-4 py-2 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2] focus:outline-none focus:ring-2 focus:ring-[#dab9f8] focus:ring-offset-2"
                  >
                    Add
                  </button>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {widerAreas.map((area, index) => (
                    <div 
                      key={index} 
                      className="bg-[#f5eeff] px-3 py-1 rounded-full flex items-center"
                    >
                      <span className="text-[#6b3fa0] text-sm">{area}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWiderArea(area)}
                        className="ml-2 text-[#6b3fa0] hover:text-[#4b2b70] focus:outline-none"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                
                <p className="mt-1 text-sm text-gray-500">
                  Add wider geographical areas that these restaurants belong to (helps with searching)
                </p>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2] focus:outline-none focus:ring-2 focus:ring-[#dab9f8] focus:ring-offset-2 disabled:opacity-70 flex justify-center items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      <span>Scraping Category...</span>
                    </>
                  ) : (
                    "Scrape Category"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Single Restaurant Scraper Form */}
        {activeTab === "restaurant" && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Scrape Single Restaurant</h2>
            
            <form onSubmit={handleScrapeSubmit} className="space-y-6">
              <div>
                <label htmlFor="restaurantUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Uber Eats Restaurant URL
                </label>
                <input
                  id="restaurantUrl"
                  type="text"
                  value={restaurantUrl}
                  onChange={(e) => setRestaurantUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#dab9f8] focus:border-[#dab9f8]"
                  placeholder="e.g., https://www.ubereats.com/gb/store/restaurant-name/..."
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter a direct URL to a restaurant page on Uber Eats
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wider Areas (Optional)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={restaurantWiderAreaInput}
                    onChange={(e) => setRestaurantWiderAreaInput(e.target.value)}
                    onKeyDown={handleRestaurantWiderAreaKeyDown}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#dab9f8] focus:border-[#dab9f8]"
                    placeholder="Add a wider area (e.g., Greater London, West Midlands)"
                  />
                  <button
                    type="button"
                    onClick={handleAddRestaurantWiderArea}
                    className="px-4 py-2 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2] focus:outline-none focus:ring-2 focus:ring-[#dab9f8] focus:ring-offset-2"
                  >
                    Add
                  </button>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {restaurantWiderAreas.map((area, index) => (
                    <div 
                      key={index} 
                      className="bg-[#f5eeff] px-3 py-1 rounded-full flex items-center"
                    >
                      <span className="text-[#6b3fa0] text-sm">{area}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRestaurantWiderArea(area)}
                        className="ml-2 text-[#6b3fa0] hover:text-[#4b2b70] focus:outline-none"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                
                <p className="mt-1 text-sm text-gray-500">
                  Add wider geographical areas that this restaurant belongs to (helps with searching)
                </p>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#f9c3c9] text-white rounded-md hover:bg-[#f7afb8] focus:outline-none focus:ring-2 focus:ring-[#f9c3c9] focus:ring-offset-2 disabled:opacity-70 flex justify-center items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      <span>Scraping Restaurant...</span>
                    </>
                  ) : (
                    "Scrape Restaurant"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}