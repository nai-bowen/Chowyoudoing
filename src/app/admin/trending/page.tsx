/*eslint-disable*/
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingResponse } from "@/app/api/trending/route";

interface TrendingData {
  trending: {
    category: string;
    count: number;
    score: number;
    lastUpdated: string;
    reviewCount: number;
    isActive: boolean;
  } | null;
  recentCategories: Array<{
    category: string;
    count: number;
  }>;
}

interface AdminTrendingState {
  password: string;
  isAuthenticated: boolean;
  trendingData: TrendingData | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  updateLoading: boolean;
}

export default function AdminTrendingPage(): JSX.Element {
  const [state, setState] = useState<AdminTrendingState>({
    password: "",
    isAuthenticated: false,
    trendingData: null,
    loading: false,
    error: null,
    success: null,
    updateLoading: false
  });
  
  const router = useRouter();

  // Fetch trending data when authenticated
  const fetchTrendingData = useCallback(async (authToken: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch("/api/trending");

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
        throw new Error(`Failed to fetch trending data: ${response.statusText}`);
      }

      const data = await response.json() as TrendingResponse;
      
      // Transform the data to our internal format
      const transformedData: TrendingData = {
        trending: data.trending ? {
          ...data.trending,
          isActive: true
        } : null,
        recentCategories: data.recentCategories || []
      };
      
      setState(prev => ({ 
        ...prev, 
        trendingData: transformedData, 
        loading: false 
      }));
    } catch (err) {
      console.error("Error fetching trending data:", err);
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
      fetchTrendingData(storedToken);
    }
  }, [fetchTrendingData]);

  // Handle login
  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!state.password.trim()) return;
    
    // Store password in localStorage
    localStorage.setItem("adminToken", state.password);
    setState(prev => ({ ...prev, isAuthenticated: true }));
    fetchTrendingData(state.password);
  };

  // Handle logout
  const handleLogout = (): void => {
    localStorage.removeItem("adminToken");
    setState(prev => ({ 
      ...prev, 
      isAuthenticated: false, 
      trendingData: null 
    }));
  };

  // Handle triggering trending update
  const handleUpdateTrending = async (): Promise<void> => {
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
      const response = await fetch("/api/cron/update-trending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
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
        throw new Error(`Failed to update trending: ${response.statusText}`);
      }

      const data = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        success: "Trending data updated successfully!", 
        updateLoading: false 
      }));
      
      // Refresh trending data after successful update
      setTimeout(() => {
        fetchTrendingData(authToken);
      }, 1000);
      
    } catch (err) {
      console.error("Error updating trending data:", err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : "An unknown error occurred", 
        updateLoading: false 
      }));
    }
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
            Trending Categories Management
          </h1>
          
          <div className="flex items-center space-x-4">
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
          <h2 className="text-lg font-semibold mb-4">Update Trending Categories</h2>
          <p className="text-gray-600 mb-4">
            This will trigger the trending categories calculation job. This process normally runs once a day via a scheduled task,
            but you can manually trigger it here if needed.
          </p>
          <button
            onClick={handleUpdateTrending}
            disabled={state.updateLoading}
            className="px-4 py-2 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2] focus:outline-none disabled:opacity-50 transition-colors"
          >
            {state.updateLoading ? (
              <div className="flex items-center">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Updating...
              </div>
            ) : "Update Trending Categories"}
          </button>
        </div>

        {/* Current Trending Data */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Current Trending Data</h2>
          </div>
          
          {state.loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#dab9f8]"></div>
              <p className="mt-2 text-gray-600">Loading trending data...</p>
            </div>
          ) : !state.trendingData ? (
            <div className="p-8 text-center text-gray-500">
              No trending data available.
            </div>
          ) : (
            <div className="p-6">
              {/* Main Trending Category */}
              {state.trendingData.trending ? (
                <div className="mb-8">
                  <div className="bg-[#faf2e5] p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-[#f2d36e] mb-2">Active Trending Category</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <span className="text-sm text-gray-500">Category</span>
                        <p className="text-lg font-medium">{state.trendingData.trending.category}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Score</span>
                        <p className="text-lg font-medium">{state.trendingData.trending.score.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Count</span>
                        <p className="text-lg font-medium">{state.trendingData.trending.count}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">Last Updated</span>
                      <p className="text-md">{formatDate(state.trendingData.trending.lastUpdated)}</p>
                    </div>
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Reviews Analyzed</span>
                      <p className="text-md">{state.trendingData.trending.reviewCount}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-700">No active trending category found.</p>
                </div>
              )}

              {/* Recent Categories */}
              <h3 className="text-lg font-semibold mb-4">Recent Categories</h3>
              {state.trendingData.recentCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.trendingData.recentCategories.map((category, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{category.category}</p>
                        <span className="text-sm text-gray-500">Count: {category.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No recent categories found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}