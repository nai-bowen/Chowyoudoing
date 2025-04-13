/*eslint-disable*/
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFlag,
  faUser,
  faCalendarAlt,
  faUtensils,
  faCheckCircle,
  faTimesCircle,
  faUndoAlt
} from "@fortawesome/free-solid-svg-icons";

interface Patron {
  id: string;
  firstName: string;
  lastName: string;
}

interface Restaurant {
  id: string;
  title: string;
}

interface Review {
  id: string;
  content: string;
  rating: number;
  patron: Patron;
  restaurant: Restaurant;
  isAnonymous: boolean;
}

interface ReviewFlag {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  flaggedBy: string;
  reviewId: string;
  review: Review;
}

export default function AdminReviewFlagsPage(): JSX.Element {
  const [password, setPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [reviewFlags, setReviewFlags] = useState<ReviewFlag[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  
  const router = useRouter();

  // Fetch review flags
  const fetchReviewFlags = useCallback(async (authToken: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching flags with status filter: "${statusFilter}"`);
      const response = await fetch(
        `/api/admin/review-flags?status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem("adminToken");
          throw new Error("Invalid admin password");
        }
        throw new Error(`Failed to fetch review flags: ${response.statusText}`);
      }

      const data = await response.json() as ReviewFlag[];
      console.log(`Received ${data.length} flags with status: "${statusFilter}"`);
      setReviewFlags(data);
    } catch (err) {
      console.error("Error fetching review flags:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Attempt to authenticate with stored token on page load
  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken");
    if (storedToken) {
      setIsAuthenticated(true);
      fetchReviewFlags(storedToken);
    }
  }, [fetchReviewFlags]);

  // Handle login
  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!password.trim()) return;
    
    localStorage.setItem("adminToken", password);
    setIsAuthenticated(true);
    fetchReviewFlags(password);
  };

  // Handle logout
  const handleLogout = (): void => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    setReviewFlags([]);
  };

  // Handle status update
  const updateFlagStatus = async (
    flagId: string,
    newStatus: string,
    deleteReview: boolean = false
  ): Promise<void> => {
    const authToken = localStorage.getItem("adminToken");
    if (!authToken) {
      setIsAuthenticated(false);
      return;
    }

    // Set processing state for this flag
    setProcessing((prev) => ({ ...prev, [flagId]: true }));

    try {
      const response = await fetch(
        `/api/admin/review-flags/${flagId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            status: newStatus,
            deleteReview,
          }),
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem("adminToken");
          throw new Error("Invalid admin password");
        }
        throw new Error(`Failed to update flag: ${response.statusText}`);
      }

      // Refresh the flags list
      fetchReviewFlags(authToken);
      
    } catch (err) {
      console.error("Error updating flag:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setProcessing((prev) => ({ ...prev, [flagId]: false }));
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilter: string): void => {
    console.log(`Changing filter from "${statusFilter}" to "${newFilter}"`);
    setStatusFilter(newFilter);
  };

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Effect to re-fetch when status filter changes
  useEffect(() => {
    if (isAuthenticated) {
      const authToken = localStorage.getItem("adminToken");
      if (authToken) {
        fetchReviewFlags(authToken);
      }
    }
  }, [statusFilter, fetchReviewFlags, isAuthenticated]);

  // Format reason for display
  const formatReason = (reason: string): string => {
    switch (reason) {
      case "hate_speech":
        return "Hate Speech";
      case "misinformation":
        return "Misinformation";
      case "inappropriate":
        return "Inappropriate Content";
      case "spam":
        return "Spam";
      case "other":
        return "Other";
      default:
        return reason.charAt(0).toUpperCase() + reason.slice(1);
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
            Flagged Reviews
          </h1>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/restaurant-connection-requests"
              className="text-gray-600 hover:text-gray-900"
            >
              Connection Requests
            </Link>
            <Link 
              href="/admin/certification-requests"
              className="text-gray-600 hover:text-gray-900"
            >
              Certification Requests
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

        {/* Filter options */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Filter by status:</span>
            
            <button
              onClick={() => handleFilterChange("pending")}
              className={`px-3 py-1 rounded-md ${
                statusFilter === "pending"
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            
            <button
              onClick={() => handleFilterChange("reviewed")}
              className={`px-3 py-1 rounded-md ${
                statusFilter === "reviewed"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Reviewed
            </button>
            
            <button
              onClick={() => handleFilterChange("dismissed")}
              className={`px-3 py-1 rounded-md ${
                statusFilter === "dismissed"
                  ? "bg-red-100 text-red-800 border border-red-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Dismissed
            </button>
            
            <button
              onClick={() => handleFilterChange("")}
              className={`px-3 py-1 rounded-md ${
                statusFilter === ""
                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Flagged reviews table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#dab9f8]"></div>
              <p className="mt-2 text-gray-600">Loading flagged reviews...</p>
            </div>
          ) : reviewFlags.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No flagged reviews found for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flag Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviewFlags.map((flag) => (
                    <tr key={flag.id}>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <div className="flex items-center mb-2">
                            <FontAwesomeIcon icon={faUtensils} className="text-gray-400 mr-2" />
                            <span className="font-medium">{flag.review.restaurant.title}</span>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-3">
                            Review by: {flag.review.isAnonymous ? "Anonymous" : `${flag.review.patron.firstName} ${flag.review.patron.lastName}`}
                          </div>
                          
                          <p className="text-sm text-gray-800">
                            {flag.review.content.length > 200 
                              ? `${flag.review.content.substring(0, 200)}...` 
                              : flag.review.content}
                          </p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <div className="text-sm text-gray-900 mb-2">
                            <strong>Reason:</strong> {formatReason(flag.reason)}
                          </div>
                          
                          {flag.details && (
                            <div className="text-sm text-gray-900 mb-2">
                              <strong>Details:</strong>
                              <p className="mt-1 text-gray-600">
                                {flag.details}
                              </p>
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-600 mt-2">
                            <strong>Flagged:</strong> {formatDate(flag.createdAt)}
                          </div>
                          
                          {flag.reviewedAt && (
                            <div className="text-sm text-gray-600 mt-1">
                              <strong>Reviewed:</strong> {formatDate(flag.reviewedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${flag.status === 'reviewed' ? 'bg-green-100 text-green-800' : 
                            flag.status === 'dismissed' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                        >
                          {flag.status.charAt(0).toUpperCase() + flag.status.slice(1)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {flag.status === 'pending' && (
                          <div className="space-y-2">
                            <button
                              onClick={() => updateFlagStatus(flag.id, 'reviewed', true)}
                              disabled={processing[flag.id]}
                              className="w-full flex items-center justify-center text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                              {processing[flag.id] ? 'Processing...' : 'Approve & Delete Review'}
                            </button>
                            
                            <button
                              onClick={() => updateFlagStatus(flag.id, 'dismissed')}
                              disabled={processing[flag.id]}
                              className="w-full flex items-center justify-center text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
                              {processing[flag.id] ? 'Processing...' : 'Dismiss Flag'}
                            </button>
                          </div>
                        )}
                        
                        {flag.status !== 'pending' && (
                          <button
                            onClick={() => updateFlagStatus(flag.id, 'pending')}
                            disabled={processing[flag.id]}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 flex items-center"
                          >
                            <FontAwesomeIcon icon={faUndoAlt} className="mr-1" />
                            Reset to Pending
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}