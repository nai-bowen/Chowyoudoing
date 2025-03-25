/*eslint-disable*/

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Define strong types
type Patron = {
  firstName: string;
  lastName: string;
};

type Review = {
  content: string;
  rating: number;
  imageUrl?: string;  // Add this line
  patron?: Patron;
};

type MenuItem = {
  name: string;
  description: string;
  price: string;
};

type Restaurant = {
  id: string;
  name: string;
  address: string;
  reviews: Review[];
  menuItems: MenuItem[];
};

type RestaurantPageParams = {
  restaurantId: string;
};

export default function RestaurantPage() {
  const params = useParams<RestaurantPageParams>();
  const restaurantId = params?.restaurantId as string;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Default value for localStorage in case it's not available
    const defaultVisitedRestaurants: string[] = [];
    let visitedPages: string[] = defaultVisitedRestaurants;
    
    try {
      // Track restaurant visits in localStorage
      const visitLimit = 3;
      const storedVisits = localStorage.getItem("visitedRestaurants");
      
      // Safely parse localStorage data
      if (storedVisits) {
        try {
          visitedPages = JSON.parse(storedVisits);
          // Ensure it's an array
          if (!Array.isArray(visitedPages)) {
            visitedPages = defaultVisitedRestaurants;
          }
        } catch (e) {
          console.error("Error parsing visited restaurants:", e);
          visitedPages = defaultVisitedRestaurants;
        }
      }

      if (restaurantId && !visitedPages.includes(restaurantId)) {
        visitedPages.push(restaurantId);
        localStorage.setItem("visitedRestaurants", JSON.stringify(visitedPages));
      }

      if (visitedPages.length > visitLimit) {
        setShowPopup(true);
      }
    } catch (e) {
      // Handle localStorage errors (e.g., in incognito mode)
      console.error("Error accessing localStorage:", e);
    }

    async function fetchRestaurant() {
      if (!restaurantId) {
        setError("Restaurant ID is missing");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/restaurants/${restaurantId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch restaurant data: ${res.status}`);
        }
        const data = await res.json();
        
        // Ensure the returned data has the expected structure
        if (!data || typeof data !== 'object') {
          throw new Error("Invalid restaurant data format");
        }
        
        // Set defaults for potential missing data
        const safeData: Restaurant = {
          id: data.id || restaurantId,
          name: data.name || "Restaurant",
          address: data.address || "Address not available",
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
          menuItems: Array.isArray(data.menuItems) ? data.menuItems : []
        };
        
        setRestaurant(safeData);
      } catch (error) {
        console.error("Error fetching restaurant:", error);
        setError("Failed to load restaurant data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurant();
  }, [restaurantId]);

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-[#FFF5E1]"><p>Loading...</p></div>;
  if (error) return <div className="flex justify-center items-center min-h-screen bg-[#FFF5E1]"><p className="text-[#A90D3C]">{error}</p></div>;
  if (!restaurant) return <div className="flex justify-center items-center min-h-screen bg-[#FFF5E1]"><p>Restaurant not found.</p></div>;

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
        <Link href="/">
          <Image src="/assets/cyd_fullLogo.png" alt="Logo" width={100} height={35} />
        </Link>
        <div className="flex space-x-6">
          <Link href="/browse" className="hover:text-[#A90D3C] transition">Browse</Link>
          <Link href="/search" className="text-[#A90D3C] font-semibold">Search</Link>
          <Link href="/why" className="hover:text-[#A90D3C] transition">Why?</Link>
        </div>
      </nav>

      <h1 className="text-4xl font-bold text-center mt-6 text-[#D29501]">{restaurant.name}</h1>
      <p className="text-center text-sm text-[#A90D3C]">{restaurant.address}</p>

{/* Reviews Section */}
<section className="mt-8">
  <h2 className="text-2xl font-semibold">Reviews</h2>
  {restaurant.reviews && restaurant.reviews.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      {restaurant.reviews.map((review, index) => (
        <div key={index} className="p-4 bg-white shadow-md rounded-md flex">
          {/* Display Image if available */}
          {review.imageUrl && (
            <div className="w-24 h-24 flex-shrink-0 relative mr-4">
              <Image
                src={review.imageUrl}
                alt="Review Image"
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
            </div>
          )}
          
          {/* Review Content */}
          <div>
            <div className="flex items-center mb-2">
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={i < review.rating ? "text-yellow-500" : "text-gray-300"}>
                    ★
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm italic">"{review.content}"</p>
            <p className="text-right mt-2 text-[#A90D3C]">
              - {review.patron?.firstName ? `${review.patron.firstName}` : "Anonymous"}
            </p>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="mt-4 text-lg">
      No reviews for this restaurant yet!{" "}
      <Link href="/review" className="text-[#A90D3C] font-semibold">
        Would you like to write one?
      </Link>
    </p>
  )}
</section>


      {/* Menu Section */}
      <section className="mt-8 pb-10">
        <h2 className="text-2xl font-semibold">Menu</h2>
        {restaurant.menuItems && restaurant.menuItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {restaurant.menuItems.map((item, index) => (
              <div key={index} className="p-4 bg-white shadow-md rounded-md">
                <h3 className="font-semibold text-[#D29501]">{item.name}</h3>
                <p className="text-sm">{item.description}</p>
                <p className="text-lg font-bold text-[#A90D3C] mt-2">{item.price}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4">No menu items available.</p>
        )}
      </section>
    </main>
  );
}