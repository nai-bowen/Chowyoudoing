// src/app/admin/certification-requests/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Patron {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
  interests: string[];
  reviewCount: number;
}

interface CertificationRequest {
  id: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  justification: string | null;
  socialMediaLink: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  patronId: string;
  patron: Patron;
}

export default function AdminCertificationRequestsPage(): JSX.Element {
  const [password, setPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [certificationRequests, setCertificationRequests] = useState<CertificationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  
  const router = useRouter();

  // Create a memoized fetchCertificationRequests function that depends on statusFilter
  const fetchCertificationRequests = useCallback(async (authToken: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching requests with status filter: "${statusFilter}"`);
      const response = await fetch(
        `/api/admin/certification-requests?status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          // Add cache: 'no-store' to prevent caching issues
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem("adminToken");
          throw new Error("Invalid admin password");
        }
        throw new Error(`Failed to fetch certification requests: ${response.statusText}`);
      }

      const data = await response.json() as CertificationRequest[];
      console.log(`Received ${data.length} requests with status: "${statusFilter}"`);
      console.log("Request statuses:", data.map(req => req.status));
      setCertificationRequests(data);
    } catch (err) {
      console.error("Error fetching certification requests:", err);
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
      fetchCertificationRequests(storedToken);
    }
  }, [fetchCertificationRequests]);

  // Handle login
  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!password.trim()) return;
    
    // Store password in localStorage (normally not recommended for security reasons,
    // but acceptable for this simple admin password case)
    localStorage.setItem("adminToken", password);
    setIsAuthenticated(true);
    fetchCertificationRequests(password);
  };

  // Handle logout
  const handleLogout = (): void => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    setCertificationRequests([]);
  };

  // Handle status update
  const updateRequestStatus = async (
    requestId: string,
    newStatus: "approved" | "rejected" | "pending"
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
        `/api/admin/certification-requests/${requestId}`,
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
          // Add cache: 'no-store' to prevent caching issues
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem("adminToken");
          throw new Error("Invalid admin password");
        }
        throw new Error(`Failed to update request: ${response.statusText}`);
      }

      // Refresh the requests list
      fetchCertificationRequests(authToken);
      
    } catch (err) {
      console.error("Error updating certification request:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  // Handle filter change - FIXED VERSION
  const handleFilterChange = (newFilter: string): void => {
    console.log(`Changing filter from "${statusFilter}" to "${newFilter}"`);
    setStatusFilter(newFilter);
    // No need to call fetchCertificationRequests here as it will be triggered by the useEffect
  };

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
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
            Certification Requests
          </h1>
          
          <div className="flex items-center space-x-4">
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

        {/* Certification requests table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#dab9f8]"></div>
              <p className="mt-2 text-gray-600">Loading requests...</p>
            </div>
          ) : certificationRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No certification requests found for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Details
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
                  {certificationRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full"
                              src={request.patron.profileImage || '/assets/default-profile.jpg'} 
                              alt={`${request.patron.firstName} ${request.patron.lastName}`}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.patron.firstName} {request.patron.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.patron.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              Reviews: {request.patron.reviewCount}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <div className="text-sm text-gray-900 mb-2">
                            <strong>Submitted:</strong> {formatDate(request.createdAt)}
                          </div>
                          
                          {request.justification && (
                            <div className="text-sm text-gray-900 mb-2">
                              <strong>Justification:</strong>
                              <p className="mt-1 text-gray-600">
                                {request.justification}
                              </p>
                            </div>
                          )}
                          
                          {request.socialMediaLink && (
                            <div className="text-sm text-gray-900">
                              <strong>Social Media:</strong>
                              <a 
                                href={request.socialMediaLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="ml-2 text-[#dab9f8] hover:underline"
                              >
                                Link
                              </a>
                            </div>
                          )}
                          
                          {request.reviewedAt && (
                            <div className="text-sm text-gray-600 mt-2">
                              <strong>Reviewed:</strong> {formatDate(request.reviewedAt)} by {request.reviewedBy || 'Admin'}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status !== 'approved' && (
                          <button
                            onClick={() => updateRequestStatus(request.id, 'approved')}
                            disabled={processing[request.id]}
                            className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50"
                          >
                            {processing[request.id] ? 'Processing...' : 'Approve'}
                          </button>
                        )}
                        
                        {request.status !== 'rejected' && (
                          <button
                            onClick={() => updateRequestStatus(request.id, 'rejected')}
                            disabled={processing[request.id]}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {processing[request.id] ? 'Processing...' : 'Reject'}
                          </button>
                        )}
                        
                        {(request.status === 'approved' || request.status === 'rejected') && (
                          <button
                            onClick={() => updateRequestStatus(request.id, 'pending')}
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