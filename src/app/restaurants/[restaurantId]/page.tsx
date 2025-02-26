/*eslint-disable*/

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type Restaurant = {
  id: string;
  name: string;
  address: string;
  reviews: { 
    content: string; 
    rating: number; 
    patron?: { firstName: string; lastName: string }; 
  }[];
  menuItems: { name: string; description: string; price: string }[];
};

export default function RestaurantPage() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Track restaurant visits in localStorage
    const visitLimit = 3;
    const visitedPages = JSON.parse(localStorage.getItem("visitedRestaurants") || "[]");

    if (!visitedPages.includes(restaurantId)) {
      visitedPages.push(restaurantId);
      localStorage.setItem("visitedRestaurants", JSON.stringify(visitedPages));
    }

    if (visitedPages.length > visitLimit) {
      setShowPopup(true);
    }

    async function fetchRestaurant() {
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}`);
        if (!res.ok) throw new Error("Failed to fetch restaurant data");
        const data = await res.json();
        setRestaurant(data);
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurant();
  }, [restaurantId]);

  if (loading) return <p>Loading...</p>;
  if (!restaurant) return <p>Restaurant not found.</p>;

  return (
    <main className="bg-[#FFF5E1] min-h-screen text-[#5A5A5A] px-8 relative">
      {/* Block Page with Popup if Limit Exceeded */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
            <h2 className="text-2xl font-semibold text-[#D29501]">Sign Up to Continue</h2>
            <p className="mt-4 text-[#5A5A5A]">
              You have reached your free view limit. Create an account to explore more!
            </p>
            <Link href="/register">
              <button className="mt-4 px-6 py-2 bg-[#A90D3C] text-white rounded-lg">
                Sign Up Now
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex justify-between items-center py-4">
        <Image src="/assets/cyd_fullLogo.png" alt="Logo" width={100} height={35} />
        <div className="flex space-x-6">
          <a href="/browse" className="hover:text-[#A90D3C] transition">Browse</a>
          <a href="/search" className="text-[#A90D3C] font-semibold">Search</a>
          <a href="/why" className="hover:text-[#A90D3C] transition">Why?</a>
        </div>
      </nav>

      <h1 className="text-4xl font-bold text-center mt-6 text-[#D29501]">{restaurant.name}</h1>
      <p className="text-center text-sm text-[#A90D3C]">{restaurant.address}</p>

      {/* Reviews Section */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Reviews</h2>
        {restaurant.reviews.length === 0 ? (
          <p className="mt-4 text-lg">
            No reviews for this restaurant yet! 
            <a href="/write-review" className="text-[#A90D3C] font-semibold">Would you like to write one?</a>
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {restaurant.reviews.map((review, index) => (
              <div key={index} className="p-4 bg-white shadow-md rounded-md">
                <p className="text-sm italic">"{review.content}"</p>
                <p className="text-right mt-2 text-[#A90D3C]">
                  - {review.patron?.firstName ? `${review.patron.firstName}` : "Anonymous"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Menu Section */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {restaurant.menuItems.map((item, index) => (
            <div key={index} className="p-4 bg-white shadow-md rounded-md">
              <h3 className="font-semibold text-[#D29501]">{item.name}</h3>
              <p className="text-sm">{item.description}</p>
              <p className="text-lg font-bold text-[#A90D3C] mt-2">{item.price}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
