/*eslint-disable*/
"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserGroup, faSearch, faXmark } from "@fortawesome/free-solid-svg-icons";
import PatronProfileModal from "./PatronProfileModal";
import { createPortal } from "react-dom";

interface Patron {
  id: string;
  firstName: string;
  lastName: string;
  username?: string | null;
  profileImage?: string | null;
  isCertifiedFoodie?: boolean;
}

const FollowingList: React.FC = () => {
  const [following, setFollowing] = useState<Patron[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatron, setSelectedPatron] = useState<Patron | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  
  // State to track if we're in the browser environment for portal rendering
  const [isBrowser, setIsBrowser] = useState<boolean>(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Patron[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showingSearchResults, setShowingSearchResults] = useState<boolean>(false);
  
  // Initialize browser state on component mount
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  // Fetch following list on component mount
  useEffect(() => {
    const fetchFollowing = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch("/api/profile/following");
        
        if (!response.ok) {
          throw new Error("Failed to fetch following");
        }
        
        const data = await response.json();
        setFollowing(data.following || []);
      } catch (error) {
        console.error("Error fetching following:", error);
        setError("Failed to load following. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFollowing();
  }, []);
  
  // Search function with debounce
  const searchPatrons = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowingSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    setShowingSearchResults(true);
    
    try {
      const response = await fetch(`/api/profile/patron?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error("Search request failed");
      }
      
      const data = await response.json();
      setSearchResults(data.patrons || []);
    } catch (error) {
      console.error("Error searching patrons:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  // Handle search input changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatrons(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, searchPatrons]);
  
  const handleViewProfile = (patron: Patron): void => {
    // Clear search when opening a profile to prevent UI constraints
    setSearchQuery("");
    setSearchResults([]);
    setShowingSearchResults(false);
    
    // Set the selected patron and open modal
    setSelectedPatron(patron);
    setIsProfileModalOpen(true);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };
  
  const clearSearch = (): void => {
    setSearchQuery("");
    setSearchResults([]);
    setShowingSearchResults(false);
  };
  
  // Filter following list if not showing search results
  const displayList = showingSearchResults ? searchResults : following;
  
  // Render profile modal with portal
  const renderProfileModal = (): React.ReactNode => {
    if (!isBrowser || !selectedPatron || !isProfileModalOpen) return null;
    
    return createPortal(
      <PatronProfileModal
        patronId={selectedPatron.id}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        isCertifiedFoodie={selectedPatron.isCertifiedFoodie}
      />,
      document.body
    );
  };
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <FontAwesomeIcon icon={faUserGroup} className="mr-2 text-[#F1C84B]" />
        People You Follow
      </h2>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search people by name or username..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full p-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1C84B]"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
          </div>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
      </div>
      
      {/* Search Status */}
      {showingSearchResults && (
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {isSearching ? 'Searching...' : `Found ${searchResults.length} results`}
          </p>
          <button
            onClick={clearSearch}
            className="text-sm text-[#F1C84B] hover:underline"
          >
            Back to Following
          </button>
        </div>
      )}
      
      {/* Loading State */}
      {(isLoading || (isSearching && !searchResults.length)) ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F1C84B]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
          <p>{error}</p>
        </div>
      ) : following.length === 0 && !showingSearchResults ? (
        // Empty following state
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FontAwesomeIcon icon={faUserGroup} className="text-4xl text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            You're not following anyone yet
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Search for food enthusiasts to follow and see their reviews in your feed.
          </p>
        </div>
      ) : displayList.length > 0 ? (
        // Display list of people (either following or search results)
        <div className="space-y-4">
          {displayList.map((patron) => (
            <div
              key={patron.id}
              className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleViewProfile(patron)}
            >
              <div className="relative">
                {patron.profileImage ? (
                  <img
                    src={patron.profileImage}
                    alt={`${patron.firstName}'s profile`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-[#F1C84B] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {patron.firstName.charAt(0)}
                    </span>
                  </div>
                )}
                
                {patron.isCertifiedFoodie && (
                  <div className="absolute -bottom-1 -right-1 bg-[#F1C84B] rounded-full p-0.5 border border-white">
                    <FontAwesomeIcon icon={faUser} className="text-white text-xs" />
                  </div>
                )}
              </div>
              
              <div className="ml-3">
                <p className="font-medium">{patron.firstName} {patron.lastName}</p>
                {patron.username && (
                  <p className="text-xs text-gray-500">@{patron.username}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : showingSearchResults ? (
        // No search results
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FontAwesomeIcon icon={faSearch} className="text-4xl text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No results found
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Try a different search term
          </p>
          <button 
            onClick={clearSearch}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : null}
      
      {/* Render the modal via portal */}
      {renderProfileModal()}
    </div>
  );
};

export default FollowingList;