"use client";

import React from 'react';
import { Link } from 'react-router-dom';

type SearchResult = {
  id: string;
  name: string;
  url: string;
  type: string;
  restaurant?: string;
};

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, isLoading }) => {
  if (isLoading) {
    return (
      <div className="absolute left-0 mt-2 w-full glass rounded-lg border border-white/30 z-40 overflow-hidden">
        <div className="p-4 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-yellow-200 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-yellow-200 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 bg-yellow-200 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-0 mt-2 w-full glass rounded-lg border border-white/30 z-40 overflow-hidden animate-fade-in">
      <div className="max-h-72 overflow-y-auto">
        {results.map((result) => (
          <Link
            key={result.id}
            to={result.url}
            className="flex items-center p-4 hover:bg-white/50 transition-colors border-b border-gray-100/50 last:border-0"
          >
            <div className="flex-1">
              <p className="text-gray-800 font-medium">{result.name}</p>
              <div className="flex items-center justify-between mt-1">
                {result.restaurant && (
                  <p className="text-gray-500 text-sm">{result.restaurant}</p>
                )}
                <span className="ml-auto text-xs px-2 py-1 bg-yellow-100/50 text-yellow-700 rounded-full">
                  {result.type}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;