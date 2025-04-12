// src/app/restaurant-dashboard/[restaurantId]/receipt-verifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faReceipt
} from "@fortawesome/free-solid-svg-icons";
import ReceiptVerificationManagement from "@/app/_components/ReceiptVerificationManagement";

interface Restaurant {
  id: string;
  title: string;
}

export default function RestaurantReceiptVerificationsPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.restaurantId as string;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurateurId, setRestaurateurId] = useState<string>("");
  
  // Fetch restaurant data on mount
  useEffect(() => {
    const fetchRestaurantData = async (): Promise<void> => {
      if (!restaurantId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/restaurants/${restaurantId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch restaurant data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setRestaurant(data);
      } catch (err) {
        console.error("Error fetching restaurant data:", err);
        setError(err instanceof Error ? err.message : "Failed to load restaurant data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [restaurantId]);
  
  // Fetch restaurateur ID
  useEffect(() => {
    const fetchRestaurateurData = async (): Promise<void> => {
      try {
        const response = await fetch("/api/restaurateur/profile");
        
        if (!response.ok) {
          throw new Error("Failed to fetch restaurateur profile");
        }
        
        const data = await response.json();
        setRestaurateurId(data.id);
      } catch (error) {
        console.error("Error fetching restaurateur ID:", error);
      }
    };
    
    fetchRestaurateurData();
  }, []);
  
  // Display loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
        </div>
      </div>
    );
  }
  
  // Display error state
  if (error || !restaurant) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
          <p>There was an error loading the restaurant data: {error || "Restaurant not found"}</p>
          <button 
            onClick={() => router.back()}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()}
          className="mr-4 p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Receipt Verifications</h1>
          <p className="text-gray-600">{restaurant.title}</p>
        </div>
      </div>
      
      {/* Receipt Verification Management Component */}
      {restaurateurId ? (
        <ReceiptVerificationManagement 
          restaurateurId={restaurateurId}
          restaurants={[restaurant]}
        />
      ) : (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
        </div>
      )}
    </div>
  );
}