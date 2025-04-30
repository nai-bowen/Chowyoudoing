/* eslint-disable */
"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faStore } from "@fortawesome/free-solid-svg-icons";
import { RestaurantAnalytics } from "@/app/_components/RestaurantAnalytics";
import AnalyticsLoader from "../../_components/AnalyticsLoader";

export default function AnalyticsPage(): JSX.Element {
  const { status } = useSession();
  const [restaurants, setRestaurants] = useState<Array<{ id: string; title: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  const handleRestaurantIdResolved = (id: string | null): void => {
    setSelectedRestaurantId(id);
  };

  useEffect(() => {
    const fetchRestaurants = async (): Promise<void> => {
      if (status !== "authenticated") return;

      try {
        setIsLoading(true);
        const profileResponse = await fetch("/api/restaurateur/profile");
        if (!profileResponse.ok) throw new Error("Failed to fetch profile");

        const profileData = await profileResponse.json();
        const restaurateurId = profileData.id;

        const response = await fetch(`/api/restaurateur/restaurants?restaurateurId=${restaurateurId}`);
        if (!response.ok) throw new Error("Failed to fetch restaurants");

        const data = await response.json();
        const formatted = data.map((r: any) => ({
          id: r.id,
          title: r.title || r.name,
        }));

        setRestaurants(formatted);

        if (!selectedRestaurantId && formatted.length > 0) {
          setSelectedRestaurantId(formatted[0].id);
        }
      } catch (err) {
        console.error("Error fetching restaurants:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, [status, selectedRestaurantId]);

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-lg mb-4">Please log in to view restaurant analytics.</p>
          <Link
            href="/login/restaurateur"
            className="px-4 py-2 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="mt-16 bg-white p-8 rounded-xl shadow-sm text-center">
          <FontAwesomeIcon icon={faStore} className="text-4xl text-gray-300 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Restaurants Available</h2>
          <p className="text-gray-600 mb-6">
            You need to connect to a restaurant before you can view analytics.
          </p>
          <Link
            href="/restaurant-dashboard"
            className="inline-flex items-center px-4 py-2 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2]"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedRestaurantId) {
    return (
      <>
        <Suspense fallback={null}>
          <AnalyticsLoader onRestaurantIdResolved={handleRestaurantIdResolved} />
        </Suspense>

        <div className="container mx-auto px-6 py-8">
          <div className="mt-8 bg-white p-8 rounded-xl shadow-sm">
            <h2 className="text-2xl font-semibold mb-6">Select a Restaurant to View Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurant-dashboard/analytics?restaurantId=${restaurant.id}`}
                  className="p-6 border border-gray-200 rounded-xl hover:border-[#dab9f8] hover:shadow-md transition-all"
                >
                  <h3 className="font-medium text-lg mb-2">{restaurant.title}</h3>
                  <p className="text-sm text-gray-500">View analytics and insights</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return <RestaurantAnalytics restaurantId={selectedRestaurantId} />;
}
