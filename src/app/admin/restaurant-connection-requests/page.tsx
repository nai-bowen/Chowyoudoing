/*eslint-disable*/
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faLink, faUser, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";

interface Restaurateur {
  id: string;
  email: string;
  restaurantName: string;
  contactPersonName: string;
  contactPersonEmail: string;
  verificationStatus: string;
}

interface Restaurant {
  id: string;
  title: string;
  location: string;
  category: string[];
}

interface ConnectionRequest {
  id: string;
  restaurateurId: string;
  restaurantId: string;
  status: string; // "pending", "approved", "rejected"
  message: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  restaurateur: Restaurateur;
  restaurant: Restaurant;
}

export default function AdminRestaurantConnectionRequestsPage(): JSX.Element {
  const [password, setPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  
  const router = useRouter();

  // Create a memoized fetchConnectionRequests function that depends on statusFilter
  const fetchConnectionRequests = useCallback(async (authToken: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching connection requests with status filter: "${statusFilter}"`);
      const response = await fetch(
        `/api/admin/restaurant-connection-requests?status=${statusFilter}`,
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
        throw new Error(`Failed to fetch connection requests: ${response.statusText}`);
      }

      const data = await response.json() as ConnectionRequest[];
      console.log(`Received ${data.length} connection requests with status: "${statusFilter}"`);
      setConnectionRequests(data);
    } catch (err) {
      console.error("Error fetching connection requests:", err);
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
      fetchConnectionRequests(storedToken);
    }
  }, [fetchConnectionRequests]);

  // Handle login
  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!password.trim()) return;
    
    localStorage.setItem("adminToken", password);
    setIsAuthenticated(true);
    fetchConnectionRequests(password);
  };

  // Handle logout
  const handleLogout = (): void => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    setConnectionRequests([]);
  };

  // Handle status update
  const updateRequestStatus = async (
    requestId: string,
    newStatus: string
  ): Promise<void> => {
    const authToken = localStorage.getItem("adminToken");
    if (!authToken) {
      setIsAuthenticated(false);
      return;
    }

    // Set processing state for this request
    setProcessing((prev) => ({ ...prev, [requestId]: true }));

    try {
      const response = await fetch(
        `/api/admin/restaurant-connection-requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            status: newStatus,
            reviewedBy: "Admin",
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
        
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update request: ${response.statusText}`);
      }

      // Refresh the requests list
      fetchConnectionRequests(authToken);
      
    } catch (err) {
      console.error("Error updating connection request:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: false }));
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
        fetchConnectionRequests(authToken);
      }
    }
  }, [statusFilter, fetchConnectionRequests, isAuthenticated]);

  // Get status color based on status
  const getStatusColor = (status: string): string => {
    if (status === "approved") return "bg-green-100 text-green-800";
    if (status === "rejected") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800"; // Default/pending
  };

  // Format status string for display
  const formatStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
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
            Restaurant Connection Requests
          </h1>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/restaurant-requests"
              className="text-gray-600 hover:text-gray-900"
            >
              Restaurant Requests
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
              onClick={() => handleFilterChange("approved")}
              className={`px-3 py-1 rounded-md ${
                statusFilter === "approved"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Approved
            </button>
            
            <button
              onClick={() => handleFilterChange("rejected")}
              className={`px-3 py-1 rounded-md ${
                statusFilter === "rejected"
                  ? "bg-red-100 text-red-800 border border-red-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Rejected
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

        {/* Connection requests table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#dab9f8]"></div>
              <p className="mt-2 text-gray-600">Loading requests...</p>
            </div>
          ) : connectionRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No restaurant connection requests found for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
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
                  {connectionRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="bg-[#faf2e5] rounded-full p-2 mr-3">
                            <FontAwesomeIcon icon={faStore} className="text-[#f2d36e]" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.restaurant.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.restaurant.location}
                            </div>
                            {request.restaurant.category && request.restaurant.category.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {request.restaurant.category.slice(0, 2).map((cat, i) => (
                                  <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                    {cat}
                                  </span>
                                ))}
                                {request.restaurant.category.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{request.restaurant.category.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="bg-[#fdedf6] rounded-full p-2 mr-3">
                            <FontAwesomeIcon icon={faUser} className="text-[#f9c3c9]" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.restaurateur.contactPersonName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.restaurateur.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.restaurateur.restaurantName}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              ID: {request.restaurateur.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-2">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-2" />
                            <span>Submitted: {formatDate(request.submittedAt)}</span>
                          </div>
                          
                          {request.reviewedAt && (
                            <div className="flex items-center mb-2">
                              <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-2" />
                              <span>Reviewed: {formatDate(request.reviewedAt)}</span>
                            </div>
                          )}
                          
                          {request.message && (
                            <div className="mt-3 bg-gray-50 p-3 rounded-md">
                              <p className="text-sm font-medium mb-1">Message:</p>
                              <p className="text-sm text-gray-600">{request.message}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {formatStatus(request.status)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status !== "approved" && (
                          <button
                            onClick={() => updateRequestStatus(request.id, "approved")}
                            disabled={processing[request.id]}
                            className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50"
                          >
                            {processing[request.id] ? 'Processing...' : 'Approve'}
                          </button>
                        )}
                        
                        {request.status !== "rejected" && (
                          <button
                            onClick={() => updateRequestStatus(request.id, "rejected")}
                            disabled={processing[request.id]}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {processing[request.id] ? 'Processing...' : 'Reject'}
                          </button>
                        )}
                        
                        {(request.status === "approved" || request.status === "rejected") && (
                          <button
                            onClick={() => updateRequestStatus(request.id, "pending")}
                            disabled={processing[request.id]}
                            className="text-blue-600 hover:text-blue-900 ml-3 disabled:opacity-50"
                          >
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