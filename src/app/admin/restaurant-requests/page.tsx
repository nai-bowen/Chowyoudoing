/*eslint-disable*/
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RestaurantImage {
  utilityBillUrl: string | null;
  businessLicenseUrl: string | null;
  foodHygieneCertUrl: string | null;
  storefrontPhotoUrl: string | null;
  receiptPhotoUrl: string | null;
}

interface Restaurant {
  id: string;
  title: string;
  location: string;
  category: string[];
}

interface RestaurantRequest {
  id: string;
  email: string;
  restaurantName: string;
  businessRegNumber: string | null;
  vatNumber: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string;
  country: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  verificationStatus: string; // "PENDING", "APPROVED", "REJECTED"
  submittedAt: string;
  approvedAt: string | null;
  utilityBillUrl: string | null;
  businessLicenseUrl: string | null;
  foodHygieneCertUrl: string | null;
  storefrontPhotoUrl: string | null;
  receiptPhotoUrl: string | null;
  restaurantId: string | null;
  restaurant: Restaurant | null;
}

export default function AdminRestaurantRequestsPage(): JSX.Element {
  const [password, setPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [restaurantRequests, setRestaurantRequests] = useState<RestaurantRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [activeImageModal, setActiveImageModal] = useState<RestaurantImage | null>(null);
  const [activeImageType, setActiveImageType] = useState<string | null>(null);
  
  const router = useRouter();

  // Create a memoized fetchRestaurantRequests function that depends on statusFilter
  const fetchRestaurantRequests = useCallback(async (authToken: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching restaurant requests with status filter: "${statusFilter}"`);
      const response = await fetch(
        `/api/admin/restaurant-requests?status=${statusFilter}`,
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
        throw new Error(`Failed to fetch restaurant requests: ${response.statusText}`);
      }

      const data = await response.json() as RestaurantRequest[];
      console.log(`Received ${data.length} restaurant requests with status: "${statusFilter}"`);
      setRestaurantRequests(data);
    } catch (err) {
      console.error("Error fetching restaurant requests:", err);
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
      fetchRestaurantRequests(storedToken);
    }
  }, [fetchRestaurantRequests]);

  // Handle login
  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!password.trim()) return;
    
    localStorage.setItem("adminToken", password);
    setIsAuthenticated(true);
    fetchRestaurantRequests(password);
  };

  // Handle logout
  const handleLogout = (): void => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    setRestaurantRequests([]);
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
      // Check if trying to approve without business registration number
      if (newStatus === "approved") {
        const request = restaurantRequests.find(r => r.id === requestId);
        if (request && !request.businessRegNumber) {
          setError("Business Registration Number is required for approval");
          setProcessing((prev) => ({ ...prev, [requestId]: false }));
          return;
        }
      }

      const response = await fetch(
        `/api/admin/restaurant-requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            status: newStatus.toLowerCase(), // Convert to lowercase for API
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
      fetchRestaurantRequests(authToken);
      
    } catch (err) {
      console.error("Error updating restaurant request:", err);
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
  
  // Open image modal
  const openImageModal = (request: RestaurantRequest, imageType: string): void => {
    setActiveImageModal({
      utilityBillUrl: request.utilityBillUrl,
      businessLicenseUrl: request.businessLicenseUrl,
      foodHygieneCertUrl: request.foodHygieneCertUrl,
      storefrontPhotoUrl: request.storefrontPhotoUrl,
      receiptPhotoUrl: request.receiptPhotoUrl
    });
    setActiveImageType(imageType);
  };

  // Effect to re-fetch when status filter changes
  useEffect(() => {
    if (isAuthenticated) {
      const authToken = localStorage.getItem("adminToken");
      if (authToken) {
        fetchRestaurantRequests(authToken);
      }
    }
  }, [statusFilter, fetchRestaurantRequests, isAuthenticated]);

  // Get status color based on verification status
  const getStatusColor = (status: string): string => {
    if (status === "APPROVED") return "bg-green-100 text-green-800";
    if (status === "REJECTED") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800"; // Default/PENDING
  };

  // Format status string for display
  const formatStatus = (status: string): string => {
    return status.charAt(0) + status.slice(1).toLowerCase();
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
            Restaurant Registration Requests
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

        {/* Restaurant requests table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#dab9f8]"></div>
              <p className="mt-2 text-gray-600">Loading requests...</p>
            </div>
          ) : restaurantRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No restaurant registration requests found for the selected filter.
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
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Person
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
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
                  {restaurantRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {request.restaurantName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.email}
                          </div>
                          {request.businessRegNumber && (
                            <div className="text-sm text-gray-500">
                              Reg #: {request.businessRegNumber}
                            </div>
                          )}
                          {request.vatNumber && (
                            <div className="text-sm text-gray-500">
                              VAT #: {request.vatNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="mb-1">{request.addressLine1}</div>
                          {request.addressLine2 && <div className="mb-1">{request.addressLine2}</div>}
                          <div className="mb-1">{request.city}, {request.postalCode}</div>
                          <div className="mb-1">{request.country}</div>
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          <div>Submitted: {formatDate(request.submittedAt)}</div>
                          {request.approvedAt && <div>Approved: {formatDate(request.approvedAt)}</div>}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{request.contactPersonName}</div>
                          <div className="text-gray-500">{request.contactPersonPhone}</div>
                          <div className="text-gray-500">{request.contactPersonEmail}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          {request.utilityBillUrl && (
                            <button 
                              onClick={() => openImageModal(request, "utilityBill")}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Utility Bill
                            </button>
                          )}
                          
                          {request.businessLicenseUrl && (
                            <button 
                              onClick={() => openImageModal(request, "businessLicense")}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Business License
                            </button>
                          )}
                          
                          {request.foodHygieneCertUrl && (
                            <button 
                              onClick={() => openImageModal(request, "foodHygieneCert")}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Food Hygiene Cert
                            </button>
                          )}
                          
                          {request.storefrontPhotoUrl && (
                            <button 
                              onClick={() => openImageModal(request, "storefrontPhoto")}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Storefront Photo
                            </button>
                          )}
                          
                          {request.receiptPhotoUrl && (
                            <button 
                              onClick={() => openImageModal(request, "receiptPhoto")}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Receipt Photo
                            </button>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.verificationStatus)}`}>
                          {formatStatus(request.verificationStatus)}
                        </span>
                        
                        {request.verificationStatus === "APPROVED" && !request.businessRegNumber && (
                          <div className="mt-2 text-xs text-red-600">
                            Missing Business Reg #
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.verificationStatus !== "APPROVED" && (
                          <button
                            onClick={() => updateRequestStatus(request.id, "approved")}
                            disabled={processing[request.id] || !request.businessRegNumber}
                            className={`text-green-600 hover:text-green-900 mr-3 ${
                              (!request.businessRegNumber || processing[request.id]) ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title={!request.businessRegNumber ? "Business Registration Number required" : ""}
                          >
                            {processing[request.id] ? 'Processing...' : 'Approve'}
                          </button>
                        )}
                        
                        {request.verificationStatus !== "REJECTED" && (
                          <button
                            onClick={() => updateRequestStatus(request.id, "rejected")}
                            disabled={processing[request.id]}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {processing[request.id] ? 'Processing...' : 'Reject'}
                          </button>
                        )}
                        
                        {(request.verificationStatus === "APPROVED" || request.verificationStatus === "REJECTED") && (
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

      {/* Image Modal */}
      {activeImageModal && activeImageType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {activeImageType === "utilityBill" ? "Utility Bill" :
                 activeImageType === "businessLicense" ? "Business License" :
                 activeImageType === "foodHygieneCert" ? "Food Hygiene Certificate" :
                 activeImageType === "storefrontPhoto" ? "Storefront Photo" :
                 "Receipt Photo"}
              </h3>
              <button 
                onClick={() => {
                  setActiveImageModal(null);
                  setActiveImageType(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <div className="flex justify-center">
              {activeImageType === "utilityBill" && activeImageModal.utilityBillUrl ? (
                <img 
                  src={activeImageModal.utilityBillUrl} 
                  alt="Utility Bill" 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : activeImageType === "businessLicense" && activeImageModal.businessLicenseUrl ? (
                <img 
                  src={activeImageModal.businessLicenseUrl} 
                  alt="Business License" 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : activeImageType === "foodHygieneCert" && activeImageModal.foodHygieneCertUrl ? (
                <img 
                  src={activeImageModal.foodHygieneCertUrl} 
                  alt="Food Hygiene Certificate" 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : activeImageType === "storefrontPhoto" && activeImageModal.storefrontPhotoUrl ? (
                <img 
                  src={activeImageModal.storefrontPhotoUrl} 
                  alt="Storefront Photo" 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : activeImageType === "receiptPhoto" && activeImageModal.receiptPhotoUrl ? (
                <img 
                  src={activeImageModal.receiptPhotoUrl} 
                  alt="Receipt Photo" 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="text-gray-500">Image not available</div>
              )}
            </div>
            
            <div className="flex justify-center mt-4">
              <button 
                onClick={() => {
                  setActiveImageModal(null);
                  setActiveImageType(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}