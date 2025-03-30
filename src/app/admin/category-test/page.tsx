"use client";

import React, { useState } from "react";
import { enhanceCategory, enhanceInterest, getEmbeddings, cosineSimilarity } from "@/utils/embeddingUtils";

// Define predefined interests directly in this file to avoid client-side imports
export const PREDEFINED_INTERESTS = [
  "Pizza", "Japanese", "Chinese", "Fish & Chips", "Italian",
  "Greek", "Caribbean", "American", "Sushi", "Sandwiches",
  "Dessert", "Vegan/Vegetarian", "Lebanese", "Mexican",
  "Burgers", "Indian", "Mediterranean", "Steak", "Breakfast",
  "Salads", "Tacos", "Chicken", "Boba/Juice"
];

interface TestResult {
  category: string;
  topMatches: {
    interest: string;
    similarity: number;
  }[];
  mappedInterests: string[];
  scores: {
    interest: string;
    similarity: number;
  }[];
}

export default function CategoryTestPage(): JSX.Element {
  const [inputText, setInputText] = useState<string>("Belgian Food\nBubble tea\nCakes\nSweets\nCoffee & tea\nCuban Food\nMatcha");
  const [threshold, setThreshold] = useState<number>(0.75);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progressLog, setProgressLog] = useState<string[]>([]);

  const addLogEntry = (message: string) => {
    setProgressLog(prev => [...prev, message]);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setProgressLog([]);
      
      // Parse input text into categories
      const categories = inputText
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);
      
      if (categories.length === 0) {
        setError("Please enter at least one category");
        return;
      }
      
      addLogEntry(`Processing ${categories.length} categories`);
      
      // Use the category test API instead of doing calculations client-side
      addLogEntry("Sending request to category test API...");
      
      // Make a POST request to our simplified API endpoint
      const response = await fetch("/api/admin/category-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          categories,
          threshold
        }),
      });
      
      // Check if the response was successful
      if (!response.ok) {
        // Try to extract error message from the response
        let errorMessage = "Server error processing categories";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error as JSON, use the status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse the response data
      const data = await response.json();
      addLogEntry(`Received results for ${data.processedCount} categories`);
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid response format from server");
      }
      
      // Set the results
      setResults(data.results);
      addLogEntry("All categories processed successfully!");
      
    } catch (err) {
      console.error("Error testing categories:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      addLogEntry(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Category Interest Mapping Test</h1>
      <p className="text-gray-600 mb-6">
        Test how transformers.js embeddings would map restaurant categories to the predefined interests.
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label htmlFor="categories" className="block text-sm font-medium text-gray-700 mb-1">
            Enter categories (one per line)
          </label>
          <textarea
            id="categories"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Belgian Food&#10;Bubble tea&#10;Cakes&#10;Sweets"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Similarity Threshold: {threshold}
          </label>
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Higher values (closer to 1.0) require closer matches, lower values include more distant matches
          </p>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Categories"}
        </button>
      </form>
      
      {/* Progress Log */}
      {progressLog.length > 0 && (
        <div className="mb-8 p-4 bg-gray-100 rounded-lg max-h-64 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">Progress Log</h2>
          <div className="space-y-1 font-mono text-sm">
            {progressLog.map((log, i) => (
              <div key={i} className="border-b border-gray-200 pb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          <div className="space-y-6">
            {results.map((result) => (
              <div key={result.category} className="border p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{result.category}</h3>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-1">Mapped Interests (threshold: {threshold})</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.mappedInterests.length > 0 ? (
                      result.mappedInterests.map((interest) => (
                        <span
                          key={interest}
                          className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-red-500 text-sm">No interests matched at this threshold</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Top 5 Matches</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Interest
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Similarity
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Matched
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.topMatches.map((match) => (
                          <tr key={match.interest}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {match.interest}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {match.similarity.toFixed(4)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                              {match.similarity >= threshold ? (
                                <span className="text-green-600">✓</span>
                              ) : (
                                <span className="text-red-600">✗</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Visualization of all similarity scores */}
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-1">All Interests</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {PREDEFINED_INTERESTS.map((interest) => {
                      const score = result.scores.find(s => s.interest === interest)?.similarity || 0;
                      const isMatched = score >= threshold;
                      const scorePercentage = Math.round(score * 100);
                      
                      return (
                        <div 
                          key={interest}
                          className={`p-2 rounded-md text-xs ${
                            isMatched ? 'bg-green-100 border border-green-200' : 'bg-gray-50 border border-gray-100'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{interest}</span>
                            <span className={isMatched ? 'text-green-700' : 'text-gray-500'}>
                              {scorePercentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                isMatched ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${scorePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}