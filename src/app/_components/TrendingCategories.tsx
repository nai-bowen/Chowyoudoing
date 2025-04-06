// src/app/_components/TrendingCategories.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingResponse } from "../api/trending/route";

interface TrendingCategoriesProps {
  displayCount?: number; // Number of categories to display
  showHeader?: boolean;
}

export const TrendingCategories: React.FC<TrendingCategoriesProps> = ({ 
  displayCount = 4,
  showHeader = true
}) => {
  const router = useRouter();
  const [trendingData, setTrendingData] = useState<TrendingResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/trending");
        
        if (!response.ok) {
          throw new Error("Failed to fetch trending categories");
        }
        
        const data: TrendingResponse = await response.json();
        setTrendingData(data);
      } catch (err) {
        console.error("Error fetching trending categories:", err);
        setError("Unable to load trending categories");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrendingData();
  }, []);

  // Navigate to search results for a category
  const handleCategoryClick = (category: string): void => {
    router.push(`/patron-search?categories=${encodeURIComponent(category)}`);
  };

  // Format the last updated time
  const formatLastUpdated = (dateString: string | undefined): string => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Updated just now";
    if (diffHours === 1) return "Updated 1 hour ago";
    if (diffHours < 24) return `Updated ${diffHours} hours ago`;
    return `Updated ${Math.floor(diffHours / 24)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="trending-categories-container animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(displayCount)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !trendingData) {
    return null; // Don't show anything if there's an error
  }

  // Combine the trending category with other recent categories
  const allCategories = [
    ...(trendingData.trending ? [{ 
      category: trendingData.trending.category,
      count: trendingData.trending.count,
      trending: true
    }] : []),
    ...trendingData.recentCategories.map(cat => ({
      ...cat,
      trending: false
    }))
  ].slice(0, displayCount);

  return (
    <div className="trending-categories-container">
      {showHeader && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#A90D3C]">Trending</h3>
          {trendingData.trending && (
            <span className="text-xs text-gray-500">
              {formatLastUpdated(trendingData.trending.lastUpdated)}
            </span>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2">
        {allCategories.map((item, index) => (
          <button
            key={index}
            onClick={() => handleCategoryClick(item.category)}
            className={`px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
              item.trending 
                ? "bg-[#F8A5A5] text-white font-medium" 
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            <span className="truncate">{item.category}</span>
            {item.trending && (
              <span className="ml-1 flex-shrink-0 bg-white bg-opacity-30 text-white text-xs px-1.5 py-0.5 rounded-full">
                🔥
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendingCategories;