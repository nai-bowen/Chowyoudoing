"use client";

import React, { useState, useEffect } from "react";
import { PREDEFINED_INTERESTS } from "@/utils/categoryMappingService";

interface CategoryMapping {
  category: string;
  interests: string[];
  similarityScores?: Record<string, number>;
}

export default function CategoryMappingPage(): JSX.Element {
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [mappings, setMappings] = useState<CategoryMapping[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.75);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");
  const [unmappedOnly, setUnmappedOnly] = useState<boolean>(false);
  const [batchSize, setBatchSize] = useState<number>(20);
  const [currentBatch, setCurrentBatch] = useState<number>(1);

  // Fetch all unique categories on mount
  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/category-mapping");
        
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        
        const data = await response.json() as { categories: string[] };
        
        // Sort categories alphabetically
        const sortedCategories = [...data.categories].sort();
        setCategories(sortedCategories);
        setFilteredCategories(sortedCategories);
        
        // Initialize empty mappings array
        const initialMappings: CategoryMapping[] = sortedCategories.map(category => ({
          category,
          interests: []
        }));
        
        setMappings(initialMappings);
        setMessage(`Loaded ${sortedCategories.length} unique categories`);
        setStatusType("info");
      } catch (error) {
        console.error("Error fetching categories:", error);
        setMessage("Error loading categories: " + (error instanceof Error ? error.message : String(error)));
        setStatusType("error");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter categories based on search term and unmapped flag
  useEffect(() => {
    let filtered = [...categories];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(category => 
        category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply unmapped only filter
    if (unmappedOnly) {
      filtered = filtered.filter(category => {
        const mapping = mappings.find(m => m.category === category);
        return !mapping || mapping.interests.length === 0;
      });
    }
    
    setFilteredCategories(filtered);
  }, [searchTerm, categories, unmappedOnly, mappings]);

  // Toggle interest for a category
  const toggleInterest = (category: string, interest: string): void => {
    setMappings(prev => {
      return prev.map(mapping => {
        if (mapping.category === category) {
          const interests = mapping.interests.includes(interest)
            ? mapping.interests.filter(i => i !== interest)
            : [...mapping.interests, interest];
          
          return { ...mapping, interests };
        }
        return mapping;
      });
    });
  };

  // Generate mappings for a batch of categories using OpenAI
  const generateMappings = async (batchCategories: string[]): Promise<void> => {
    try {
      setProcessing(true);
      setMessage(`Generating mappings for ${batchCategories.length} categories...`);
      setStatusType("info");
      
      const response = await fetch("/api/admin/category-mapping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          categories: batchCategories,
          threshold: similarityThreshold
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate mappings");
      }
      
      const data = await response.json() as { mappings: CategoryMapping[] };
      
      // Update mappings
      setMappings(prev => {
        const newMappings = [...prev];
        
        data.mappings.forEach(newMapping => {
          const index = newMappings.findIndex(m => m.category === newMapping.category);
          if (index !== -1) {
            newMappings[index] = newMapping;
          }
        });
        
        return newMappings;
      });
      
      setMessage(`Generated mappings for ${batchCategories.length} categories`);
      setStatusType("success");
    } catch (error) {
      console.error("Error generating mappings:", error);
      setMessage("Error generating mappings: " + (error instanceof Error ? error.message : String(error)));
      setStatusType("error");
    } finally {
      setProcessing(false);
    }
  };

  // Generate mappings for the current batch
  const generateCurrentBatch = async (): Promise<void> => {
    const startIdx = (currentBatch - 1) * batchSize;
    const endIdx = startIdx + batchSize;
    const batchCategories = filteredCategories.slice(startIdx, endIdx);
    
    if (batchCategories.length === 0) {
      setMessage("No categories to process in this batch");
      setStatusType("info");
      return;
    }
    
    await generateMappings(batchCategories);
  };

  // Generate mappings for all unmapped categories
  const generateAllUnmapped = async (): Promise<void> => {
    const unmappedCategories = categories.filter(category => {
      const mapping = mappings.find(m => m.category === category);
      return !mapping || mapping.interests.length === 0;
    });
    
    if (unmappedCategories.length === 0) {
      setMessage("No unmapped categories found");
      setStatusType("info");
      return;
    }
    
    // Process in smaller batches to avoid rate limits
    const chunkSize = 10;
    const chunks = [];
    
    for (let i = 0; i < unmappedCategories.length; i += chunkSize) {
      chunks.push(unmappedCategories.slice(i, i + chunkSize));
    }
    
    setProcessing(true);
    setMessage(`Processing ${unmappedCategories.length} categories in ${chunks.length} batches...`);
    setStatusType("info");
    
    for (let i = 0; i < chunks.length; i++) {
        const batch = chunks[i];
        if (!batch) continue;
      
        setMessage(`Processing batch ${i + 1}/${chunks.length}...`);
        await generateMappings(batch);
      }
      
    setMessage(`Successfully processed all ${unmappedCategories.length} unmapped categories`);
    setStatusType("success");
    setProcessing(false);
  };

  // Save mappings and update all restaurants
  const updateRestaurants = async (): Promise<void> => {
    try {
      setProcessing(true);
      setMessage("Updating restaurant interests...");
      setStatusType("info");
      
      const response = await fetch("/api/admin/category-mapping", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mappings }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update restaurants");
      }
      
      setMessage("All restaurants updated successfully!");
      setStatusType("success");
    } catch (error) {
      console.error("Error updating restaurants:", error);
      setMessage("Error updating restaurants: " + (error instanceof Error ? error.message : String(error)));
      setStatusType("error");
    } finally {
      setProcessing(false);
    }
  };

  // Export mappings as JSON
  const exportMappings = (): void => {
    const data = {
      mappings,
      timestamp: new Date().toISOString(),
      threshold: similarityThreshold
    };
    
    const jsonStr = JSON.stringify(data, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(jsonStr)}`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'category-mappings.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setMessage("Mappings exported to JSON");
    setStatusType("success");
  };

  // Import mappings from JSON file
  const importMappings = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonStr = e.target?.result as string;
        const data = JSON.parse(jsonStr) as { mappings: CategoryMapping[]; threshold?: number };
        
        setMappings(prevMappings => {
          const newMappings = [...prevMappings];
          
          data.mappings.forEach(importedMapping => {
            const index = newMappings.findIndex(m => m.category === importedMapping.category);
            if (index !== -1) {
              newMappings[index] = importedMapping;
            }
          });
          
          return newMappings;
        });
        
        if (data.threshold) {
          setSimilarityThreshold(data.threshold);
        }
        
        setMessage("Mappings imported successfully");
        setStatusType("success");
      } catch (error) {
        console.error("Error importing mappings:", error);
        setMessage("Error importing mappings: " + (error instanceof Error ? error.message : String(error)));
        setStatusType("error");
      }
    };
    reader.readAsText(file);
  };

  // Get count of unmapped categories
  const getUnmappedCount = (): number => {
    return mappings.filter(mapping => mapping.interests.length === 0).length;
  };

  // Get total number of batches
  const getTotalBatches = (): number => {
    return Math.ceil(filteredCategories.length / batchSize);
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">OpenAI Category to Interest Mapper</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">OpenAI Category to Interest Mapper</h1>
      
      {message && (
        <div className={`px-4 py-3 rounded relative mb-4 ${
          statusType === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
          statusType === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
          'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          {message}
        </div>
      )}
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Similarity Threshold
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
              className="mr-2 flex-1"
            />
            <span className="text-sm font-semibold">{similarityThreshold}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Higher values require closer matches, lower values include more distant matches
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batch Size
          </label>
          <div className="flex items-center">
            <input
              type="number"
              min="5"
              max="50"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value))}
              className="p-2 border border-gray-300 rounded w-20 mr-2"
            />
            <label className="block text-sm font-medium text-gray-700 ml-4 mr-2">
              Batch:
            </label>
            <input
              type="number"
              min="1"
              max={getTotalBatches()}
              value={currentBatch}
              onChange={(e) => setCurrentBatch(parseInt(e.target.value))}
              className="p-2 border border-gray-300 rounded w-20"
            />
            <span className="ml-2 text-sm text-gray-500">of {getTotalBatches()}</span>
          </div>
        </div>
      </div>
      
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={generateCurrentBatch}
          disabled={processing || filteredCategories.length === 0}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {processing ? "Processing..." : `Generate Current Batch (${Math.min(batchSize, filteredCategories.length - (currentBatch - 1) * batchSize)})`}
        </button>
        
        <button
          onClick={generateAllUnmapped}
          disabled={processing || getUnmappedCount() === 0}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {processing ? "Processing..." : `Generate All Unmapped (${getUnmappedCount()})`}
        </button>
        
        <button
          onClick={updateRestaurants}
          disabled={processing}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {processing ? "Processing..." : "Update All Restaurants"}
        </button>
        
        <button
          onClick={exportMappings}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export Mappings
        </button>
        
        <label className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 cursor-pointer">
          Import Mappings
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            onChange={importMappings} 
          />
        </label>
      </div>
      
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div className="flex items-center">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={unmappedOnly}
              onChange={() => setUnmappedOnly(!unmappedOnly)}
              className="form-checkbox h-5 w-5 text-purple-600"
            />
            <span className="ml-2 text-gray-700">Show unmapped only</span>
          </label>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredCategories.length} of {categories.length} categories 
          • {getUnmappedCount()} unmapped
        </p>
      </div>
      
      <div className="space-y-6">
        {filteredCategories.slice((currentBatch - 1) * batchSize, currentBatch * batchSize).map(category => {
          const mapping = mappings.find(m => m.category === category);
          return (
            <div key={category} className="border p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">{category}</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {mapping?.interests.map(interest => (
                  <span 
                    key={interest}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    {interest} 
                    <button 
                      onClick={() => toggleInterest(category, interest)}
                      className="ml-1 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(!mapping || mapping.interests.length === 0) && (
                  <span className="text-red-500 text-sm">No interests mapped</span>
                )}
              </div>
              
              {mapping?.similarityScores && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Similarity Scores:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(mapping.similarityScores)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 9)
                      .map(([interest, score]) => (
                        <div 
                          key={interest}
                          className={`p-1 rounded ${
                            score >= similarityThreshold ? 'bg-green-50 border border-green-100' : 'bg-gray-50'
                          }`}
                        >
                          <span>{interest}:</span> <span className="font-mono">{score.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Select interests:</h4>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_INTERESTS.map(interest => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(category, interest)}
                      className={`px-2 py-1 rounded-full text-sm ${
                        mapping?.interests.includes(interest)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Batch navigation */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={() => setCurrentBatch(prev => Math.max(1, prev - 1))}
          disabled={currentBatch === 1}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Previous Batch
        </button>
        
        <span className="text-sm font-medium">
          Batch {currentBatch} of {getTotalBatches()}
        </span>
        
        <button
          onClick={() => setCurrentBatch(prev => Math.min(getTotalBatches(), prev + 1))}
          disabled={currentBatch === getTotalBatches()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Next Batch
        </button>
      </div>
    </div>
  );
}