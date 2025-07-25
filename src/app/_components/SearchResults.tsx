/*eslint-disable*/
"use client";

import React from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";

// Define the SearchResult type
export type SearchResult = {
  id: string;
  name: string;
  type: "Restaurant" | "Food Item" | "Category" | "Location" | "Action";
  url?: string;
  restaurant?: string;
  restaurantId?: string; // Add this field for Food Item results
};

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  onResultClick?: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  results, 
  isLoading,
  onResultClick
}) => {
  // Get auth status from next-auth
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  
  // Loading state
  if (isLoading) {
    return (
      <div className="absolute left-0 mt-2 w-full bg-white rounded-lg border border-gray-300 z-40 overflow-hidden">
        <div className="p-4 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-[#FFB400] rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-[#FFB400] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 bg-[#FFB400] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // No results
  if (results.length === 0) {
    return null;
  }

  // Define colors for each result type
  const typeColors: Record<string, string> = {
    "Restaurant": "#f9e690",
    "Food Item": "#f9b79f",
    "Category": "#f4a4e0",
    "Location": "#d7a6f2",
    "Action": "#e2e8f0"
  };

  // Render results
  return (
    <div className="absolute left-0 mt-2 w-full bg-white shadow-lg rounded-lg border border-gray-300 z-40 overflow-hidden">
      <div className="max-h-72 overflow-y-auto">
        {results.map((result) => {
          // Determine the correct link based on authentication status and result type
          let href: string;
          
          if (result.id === 'request-menu') {
            // Special case for request menu action
            href = '#request-menu';
          } else if (result.type === "Food Item" && result.restaurantId) {
            // For Food Items...
            if (isAuthenticated) {
              // If authenticated, link to patron-search
              href = `/patron-search?id=${encodeURIComponent(result.restaurantId)}`;
            } else {
              // If not authenticated, link to restaurants page
              href = `/restaurants/${result.restaurantId}`;
            }
          } else {
            // For all other result types...
            if (isAuthenticated) {
              // If authenticated, link to patron-search
              href = `/patron-search?id=${encodeURIComponent(result.id)}`;
            } else {
              // If not authenticated, link to restaurants page
              href = `/restaurants/${result.id}`;
            }
          }
            
          return (
            <Link
              key={result.id}
              href={href}
              onClick={onResultClick}
              className="flex items-center px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <p className="text-gray-800 font-medium">{result.name}</p>
                <div className="flex items-center justify-between mt-1">
                  {result.restaurant && (
                    <p className="text-sm text-gray-500">{result.restaurant}</p>
                  )}
                  <span
                    className="ml-auto text-xs px-2 py-1 rounded-full font-medium"
                    style={{ 
                      backgroundColor: typeColors[result.type] || "#e2e8f0", 
                      color: "#4B2B10" 
                    }}
                  >
                    {result.type}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;