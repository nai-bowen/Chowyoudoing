/*eslint-disable*/
"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faReceipt, 
  faSearch, 
  faFilter, 
  faCalendarAlt, 
  faUser, 
  faUtensils,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faImage,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import ReceiptVerificationModal from "./ReceiptVerificationModal";

interface Patron {
  id: string;
  firstName: string;
  lastName: string;
}

interface Review {
  id: string;
  content: string;
  rating: number;
  patron: Patron | null;
}

interface Restaurant {
  id: string;
  title: string;
}

interface ReceiptVerification {
  id: string;
  receiptImage: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewId: string | null;
  restaurantId: string;
  review: Review | null;
  restaurant: Restaurant;
}

interface ReceiptVerificationFilter {
  restaurantId: string;
  status: string;
  sortBy: string;
}

interface ReceiptStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface ReceiptVerificationManagementProps {
  restaurateurId: string;
  restaurants: Restaurant[];
  onStatsUpdate?: (stats: Partial<ReceiptStats>) => void; 
}

export default function ReceiptVerificationManagement({ 
  restaurateurId, 
  restaurants 
}: ReceiptVerificationManagementProps): JSX.Element {
  const [verifications, setVerifications] = useState<ReceiptVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<ReceiptVerification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Filter state
  const [filters, setFilters] = useState<ReceiptVerificationFilter>({
    restaurantId: "",
    status: "all",
    sortBy: "newest"
  });
  
  // Receipt verification modal state
  const [selectedVerification, setSelectedVerification] = useState<ReceiptVerification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Fetch receipt verifications on component mount
  useEffect(() => {
    fetchVerifications();
  }, [restaurateurId]);

  // Apply filters when verifications or filters change
  useEffect(() => {
    applyFilters();
  }, [verifications, filters, searchQuery]);

  // Calculate statistics when verifications change
  useEffect(() => {
    calculateStats();
  }, [verifications]);

  const fetchVerifications = async (): Promise<void> => {
    if (!restaurateurId) {
      setVerifications([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/restaurateur/receipt-verifications?restaurateurId=${restaurateurId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch receipt verifications: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setVerifications(data);
      } else {
        setVerifications([]);
      }
    } catch (err) {
      console.error("Error fetching receipt verifications:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setVerifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (): void => {
    const total = verifications.length;
    const pending = verifications.filter(v => v.status === "pending").length;
    const approved = verifications.filter(v => v.status === "approved").length;
    const rejected = verifications.filter(v => v.status === "rejected").length;
    
    setStats({
      total,
      pending,
      approved,
      rejected
    });
  };

  const applyFilters = (): void => {
    let filtered = [...verifications];
    
    // Filter by restaurant
    if (filters.restaurantId) {
      filtered = filtered.filter(verification => verification.restaurantId === filters.restaurantId);
    }
    
    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(verification => verification.status === filters.status);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(verification => {
        // Search by patron name
        const patronName = verification.review?.patron ? 
          `${verification.review.patron.firstName} ${verification.review.patron.lastName}`.toLowerCase() : 
          "";
        
        // Search by restaurant name
        const restaurantName = verification.restaurant?.title?.toLowerCase() || "";
        
        return patronName.includes(query) || restaurantName.includes(query);
      });
    }
    
    // Sort verifications
    if (filters.sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    } else if (filters.sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    }
    
    setFilteredVerifications(filtered);
  };

  const handleFilterChange = (field: keyof ReceiptVerificationFilter, value: string): void => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpenModal = (verification: ReceiptVerification): void => {
    setSelectedVerification(verification);
    setIsModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setSelectedVerification(null);
  };

  const handleStatusUpdate = async (verificationId: string, status: "approved" | "rejected"): Promise<void> => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/restaurateur/receipt-verifications/${verificationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          reviewedBy: restaurateurId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }
      
      // Update local state
      setVerifications(prevVerifications => 
        prevVerifications.map(verification => 
          verification.id === verificationId 
            ? { 
                ...verification, 
                status, 
                reviewedAt: new Date().toISOString(), 
                reviewedBy: restaurateurId 
              } 
            : verification
        )
      );
      
      // Close modal after successful update
      if (selectedVerification?.id === verificationId) {
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      }
      
    } catch (err) {
      console.error("Error updating verification status:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get card colors based on index
  const getCardColor = (index: number): string => {
    const colors = ["#fdf9f5", "#fdedf6", "#fbe9fc", "#f1eafe"];
    return colors[index % colors.length] as string;
  };
  

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatCurrency = (amount: string | undefined): string => {
    if (!amount) return "$0.00";
    
    // Try to parse the amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return amount;
    
    // Format as currency
    return `$${numericAmount.toFixed(2)}`;
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="w-full">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#faf2e5] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm">Total Verifications</h3>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-[#f2d36e] p-3 rounded-full">
              <FontAwesomeIcon icon={faReceipt} className="text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-[#fdedf6] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm">Pending</h3>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="bg-[#f9c3c9] p-3 rounded-full">
              <FontAwesomeIcon icon={faClock} className="text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-[#fbe9fc] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm">Approved</h3>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
            <div className="bg-[#f5b7ee] p-3 rounded-full">
              <FontAwesomeIcon icon={faCheckCircle} className="text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-[#f1eafe] p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm">Rejected</h3>
              <p className="text-2xl font-bold">{stats.rejected}</p>
            </div>
            <div className="bg-[#dab9f8] p-3 rounded-full">
              <FontAwesomeIcon icon={faTimesCircle} className="text-white" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Controls */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex flex-wrap gap-4">
          {/* Search Input */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="restaurantFilter" className="block text-sm text-gray-600 mb-1">
              Restaurant
            </label>
            <select
              id="restaurantFilter"
              value={filters.restaurantId}
              onChange={(e) => handleFilterChange("restaurantId", e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
            >
              <option value="">All Restaurants</option>
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.title}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="statusFilter" className="block text-sm text-gray-600 mb-1">
              Status
            </label>
            <select
              id="statusFilter"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sortFilter" className="block text-sm text-gray-600 mb-1">
              Sort By
            </label>
            <select
              id="sortFilter"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Receipt Verifications List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
          <p>There was an error loading receipt verifications: {error}</p>
          <button 
            onClick={fetchVerifications}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      ) : filteredVerifications.length > 0 ? (
        <div className="space-y-4">
          {filteredVerifications.map((verification, index) => (
            <div
              key={verification.id}
              className="rounded-xl shadow-sm p-5 transition-all hover:shadow-md cursor-pointer"
              style={{ backgroundColor: getCardColor(index) }}
              onClick={() => handleOpenModal(verification)}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* User Info & Receipt Details */}
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold mr-3">
                      {verification.review?.patron ? 
                        getInitials(verification.review.patron.firstName, verification.review.patron.lastName) : 
                        "?"
                      }
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {verification.review?.patron ? 
                          `${verification.review.patron.firstName} ${verification.review.patron.lastName}` : 
                          "Anonymous User"
                        }
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-gray-400" />
                        {formatDate(verification.submittedAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Restaurant Info */}
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 flex items-center">
                      <FontAwesomeIcon icon={faUtensils} className="mr-1 text-gray-400" />
                      {verification.restaurant.title}
                    </p>
                  </div>
                </div>
                
                {/* Receipt Image Preview */}
                <div className="col-span-1">
                  <div className="bg-gray-100 h-20 rounded-md flex items-center justify-center">
                    <FontAwesomeIcon icon={faImage} className="text-gray-400 text-xl" />
                  </div>
                </div>
                
                {/* Status */}
                <div className="col-span-1">
                  <div className="flex flex-col h-full justify-center">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center w-fit ${getStatusColor(verification.status)}`}>
                      <span className="capitalize">{verification.status}</span>
                    </div>
                    
                    {verification.reviewedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Reviewed on {formatDate(verification.reviewedAt)}
                      </p>
                    )}
                    
                    <div className="mt-auto">
                      <button className="text-sm text-blue-600 hover:text-blue-800 mt-2">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/50 rounded-xl">
          <FontAwesomeIcon icon={faReceipt} className="text-4xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No receipt verifications found</h3>
          <p className="text-gray-500 mb-6">
            {verifications.length > 0 
              ? "No verifications match your current filters." 
              : "Verifications will appear here when users submit receipts."}
          </p>
          {verifications.length > 0 && (
            <button
              onClick={() => {
                setFilters({ restaurantId: "", status: "all", sortBy: "newest" });
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
      
      {/* Receipt Verification Modal */}
      {selectedVerification && (
        <ReceiptVerificationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          verification={selectedVerification}
          onStatusUpdate={handleStatusUpdate}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}