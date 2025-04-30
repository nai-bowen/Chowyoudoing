/*eslint-disable*/
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faCrown, faStar, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";

interface Restaurateur {
  id: string;
  restaurantName: string;
  isPremium: boolean;
  premiumExpiresAt: string | null;
}

interface Restaurant {
  id: string;
  title: string;
  location?: string;
  category?: string[];
  restaurateurs?: Restaurateur[];
  isFeatured?: boolean;
}

interface AdminState {
  password: string;
  isAuthenticated: boolean;
  premiumRestaurants: Restaurant[];
  featuredRestaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  success: string | null;
  updateLoading: boolean;
  selectedRestaurants: string[];
}

export default function AdminPremiumRestaurantsPage(): JSX.Element {
  const [state, setState] = useState<AdminState>({
    password: "",
    isAuthenticated: false,
    premiumRestaurants: [],
    featuredRestaurants: [],
    loading: false,
    error: null,
    success: null,
    updateLoading: false,
    selectedRestaurants: []
  });
  
  const router = useRouter();

  // Fetch premium restaurants when authenticated
  const fetchPremiumRestaurants = useCallback(async (authToken: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch("/api/admin/premium-restaurants", {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setState(prev => ({ 
            ...prev, 
            isAuthenticated: false, 
            loading: false,
            error: "Authentication failed"
          }));
          localStorage.removeItem("adminToken");
          return;
        }
        throw new Error(`Failed to fetch premium restaurants: ${response.statusText}`);
      }

      const data = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        premiumRestaurants: data.premiumRestaurants || [],
        featuredRestaurants: data.featuredRestaurants || [],
        selectedRestaurants: data.featuredRestaurants?.map((r: Restaurant) => r.id) || [],
        loading: false 
      }));
    } catch (err) {
      console.error("Error fetching premium restaurants:", err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : "An unknown error occurred", 
        loading: false 
      }));
    }
  }, []);

  // Attempt to authenticate with stored token on page load
  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken");
    if (storedToken) {
      setState(prev => ({ ...prev, isAuthenticated: true }));
      fetchPremiumRestaurants(storedToken);
    }
  }, [fetchPremiumRestaurants]);

  // Handle login
  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!state.password.trim()) return;
    
    // Store password in localStorage
    localStorage.setItem("adminToken", state.password);
    setState(prev => ({ ...prev, isAuthenticated: true }));
    fetchPremiumRestaurants(state.password);
  };

  // Handle logout
  const handleLogout = (): void => {
    localStorage.removeItem("adminToken");
    setState(prev => ({ 
      ...prev, 
      isAuthenticated: false, 
      premiumRestaurants: [],
      featuredRestaurants: [],
      selectedRestaurants: []
    }));
  };

  // Toggle restaurant selection
  const toggleRestaurantSelection = (restaurantId: string): void => {
    setState(prev => {
      // Check if already selected
      if (prev.selectedRestaurants.includes(restaurantId)) {
        // Remove from selection
        return {
          ...prev,
          selectedRestaurants: prev.selectedRestaurants.filter(id => id !== restaurantId)
        };
      } else {
        // Add to selection
        return {
          ...prev,
          selectedRestaurants: [...prev.selectedRestaurants, restaurantId]
        };
      }
    });
  };

  // Handle updating featured restaurants
  const handleUpdateFeatured = async (): Promise<void> => {
    const authToken = localStorage.getItem("adminToken");
    if (!authToken) {
      setState(prev => ({ ...prev, isAuthenticated: false }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      updateLoading: true, 
      error: null, 
      success: null 
    }));

    try {
      const response = await fetch("/api/admin/premium-restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          restaurantIds: state.selectedRestaurants
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          setState(prev => ({ 
            ...prev, 
            isAuthenticated: false, 
            updateLoading: false,
            error: "Authentication failed"
          }));
          localStorage.removeItem("adminToken");
          return;
        }
        throw new Error(`Failed to update featured restaurants: ${response.statusText}`);
      }

      const data = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        success: "Featured restaurants updated successfully!", 
        updateLoading: false 
      }));
      
      // Refresh data after successful update
      setTimeout(() => {
        fetchPremiumRestaurants(authToken);
      }, 1000);
      
    } catch (err) {
      console.error("Error updating featured restaurants:", err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : "An unknown error occurred", 
        updateLoading: false 
      }));
    }
  };

  // Handle auto-selection of random restaurants
  const handleAutoSelect = (): void => {
    const { premiumRestaurants } = state;
    let selectedIds: string[] = [];
    
    // If we have 4 or more premium restaurants, select 4 random ones
    if (premiumRestaurants.length >= 4) {
      // Shuffle and take first 4
      const shuffled = [...premiumRestaurants].sort(() => 0.5 - Math.random());
      selectedIds = shuffled.slice(0, 4).map(r => r.id);
    } else {
      // Take all premium restaurants
      selectedIds = premiumRestaurants.map(r => r.id);
      
      // We need to fetch and add random non-premium restaurants to make up the difference
      // This is just a placeholder - in a real implementation, you would need to fetch
      // additional random restaurants from the backend
      alert("Not enough premium restaurants. Please implement fetching random restaurants.");
    }
    
    setState(prev => ({
      ...prev,
      selectedRestaurants: selectedIds
    }));
  };

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Login form
  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-[#dab9f8]">
            Admin Authentication
          </h1>
          
          {state.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {state.error}
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
                value={state.password}
                onChange={(e) => setState(prev => ({ ...prev, password: e.target.value }))}
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
            Featured Restaurants Management
          </h1>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/trending"
              className="text-gray-600 hover:text-gray-900"
            >
              Trending Categories
            </Link>
            <Link 
              href="/admin/certification-requests"
              className="text-gray-600 hover:text-gray-900"
            >
              Certification Requests
            </Link>
            <Link 
              href="/admin/restaurant-connection-requests"
              className="text-gray-600 hover:text-gray-900"
            >
              Connection Requests
            </Link>
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
        
        {state.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {state.error}
            <button 
              onClick={() => setState(prev => ({ ...prev, error: null }))}
              className="float-right"
            >
              &times;
            </button>
          </div>
        )}
        
        {state.success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {state.success}
            <button 
              onClick={() => setState(prev => ({ ...prev, success: null }))}
              className="float-right"
            >
              &times;
            </button>
          </div>
        )}

        {/* Action Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Featured Restaurants on Homepage</h2>
          <p className="text-gray-600 mb-4">
            Select up to 4 restaurants to feature on the homepage. If you select more than 4, only the first 4 will be displayed.
            If fewer than 4 premium restaurants are selected, random restaurants will fill the remaining slots.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={handleAutoSelect}
              className="px-4 py-2 bg-[#f2d36f] text-white rounded-md hover:bg-[#e2c35f] focus:outline-none transition-colors"
            >
              Auto-Select Random
            </button>
            
            <button
              onClick={handleUpdateFeatured}
              disabled={state.updateLoading}
              className="px-4 py-2 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2] focus:outline-none disabled:opacity-50 transition-colors"
            >
              {state.updateLoading ? (
                <div className="flex items-center">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : "Update Featured Restaurants"}
            </button>
          </div>
        </div>

        {/* Restaurants List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Premium Restaurants</h2>
            <div className="text-sm text-gray-500">
              Selected: {state.selectedRestaurants.length} / 4 recommended
            </div>
          </div>
          
          {state.loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#dab9f8]"></div>
              <p className="mt-2 text-gray-600">Loading restaurants...</p>
            </div>
          ) : state.premiumRestaurants.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No premium restaurants available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categories
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Premium Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.premiumRestaurants.map((restaurant) => {
                    const isSelected = state.selectedRestaurants.includes(restaurant.id);
                    return (
                      <tr 
                        key={restaurant.id}
                        className={isSelected ? "bg-[#faf2e5]" : "hover:bg-gray-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleRestaurantSelection(restaurant.id)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isSelected 
                                ? "bg-[#dab9f8] text-white" 
                                : "bg-white border border-gray-300 text-gray-400 hover:bg-gray-100"
                            }`}
                          >
                            {isSelected && <FontAwesomeIcon icon={faCheck} className="text-xs" />}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-[#faf2e5] w-10 h-10 rounded-full flex items-center justify-center mr-3">
                              <FontAwesomeIcon icon={faStore} className="text-[#f2d36e]" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {restaurant.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {restaurant.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {restaurant.location || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {restaurant.category?.map((cat, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {restaurant.restaurateurs?.some(r => r.isPremium) ? (
                            <div className="flex items-center text-sm">
                              <FontAwesomeIcon icon={faCrown} className="text-[#f2d36e] mr-1" />
                              <span className="text-green-600 font-medium">Premium</span>
                              {restaurant.restaurateurs?.find(r => r.isPremium)?.premiumExpiresAt && (
                                <span className="ml-2 text-xs text-gray-500">
                                  Expires: {formatDate(restaurant.restaurateurs?.find(r => r.isPremium)?.premiumExpiresAt || null)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">Non-premium</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Featured Restaurants Preview */}
        <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Currently Featured on Homepage</h2>
          </div>
          <div className="p-6">
            {state.featuredRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {state.featuredRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="bg-[#faf2e5] p-4 rounded-lg">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faStar} className="text-[#f2d36e] mr-2" />
                      <h3 className="font-medium text-gray-900">{restaurant.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      ID: {restaurant.id}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No restaurants are currently featured on the homepage.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}