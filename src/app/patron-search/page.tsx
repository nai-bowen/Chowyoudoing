/* eslint-disable */

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Navbar from "../_components/navbar";
import ReviewModal from '@/app/_components/ReviewModal'

// Define types
interface SearchResult {
  id: string;
  name: string;
  type: "Restaurant" | "Food Item" | "Category" | "Location";
  url: string;
  restaurant?: string;
}

interface Patron {
  firstName: string;
  lastName: string;
}

interface Review {
  content: string;
  rating: number;
  imageUrl?: string;
  patron?: Patron;
  reviewStandards?: string;
  date?: string;
}

interface MenuItem {
  name: string;
  description: string;
  price: string;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  reviews: Review[];
  menuItems: MenuItem[];
}

export default function PatronSearchPage(): JSX.Element {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    
    async function fetchResults(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${query}&restaurants=true&meals=false&categories=false&locations=false`);
        if (!res.ok) throw new Error("Failed to fetch search results");
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to load search results");
      } finally {
        setLoading(false);
      }
    }
    
    fetchResults();
  }, [query]);

  async function fetchRestaurantDetails(restaurantId: string): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`);
      if (!res.ok) throw new Error("Failed to fetch restaurant data");
      const data = await res.json();
      setSelectedRestaurant({
        id: data.id,
        name: data.name,
        address: data.address,
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
        menuItems: Array.isArray(data.menuItems) ? data.menuItems : [],
      });
    } catch (err) {
      console.error("Restaurant fetch error:", err);
      setError("Failed to load restaurant details");
    } finally {
      setLoading(false);
    }
  }

  const handleReviewClick = (review: Review): void => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setSelectedReview(null);
  };

  const renderStars = (rating: number): JSX.Element => {
    const stars: JSX.Element[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`${i <= rating ? "text-yellow-400" : "text-gray-300"}`}>
          ★
        </span>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  return (
    <div className="with-navbar">
      <Navbar />
      
      <div className="page-content">
        <main className="bg-[#FFF5E1] min-h-screen text-[#5A5A5A] px-8 w-full">
          {/* Search Bar */}
          <div className="flex justify-center pt-6">
            <input
              type="text"
              placeholder="Search restaurants..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A90D3C]"
            />
          </div>
          
          {loading && (
            <div className="flex justify-center mt-4">
              <p>Loading...</p>
            </div>
          )}
          
          {error && (
            <div className="flex justify-center mt-4 text-[#A90D3C]">
              <p>{error}</p>
            </div>
          )}
          
          {/* Results Section */}
          <section className="mt-8">
            <h2 className="text-2xl font-semibold">Search Results</h2>
            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {results.map((restaurant) => (
                  <div key={restaurant.id} className="p-4 bg-white shadow-md rounded-md">
                    <h3 className="font-semibold text-[#D29501]">{restaurant.name}</h3>
                    {restaurant.restaurant && (
                      <p className="text-sm text-gray-600">{restaurant.restaurant}</p>
                    )}
                    <button
                      onClick={() => fetchRestaurantDetails(restaurant.id)}
                      className="mt-2 px-4 py-2 bg-[#A90D3C] text-white rounded-lg"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-lg">No results found.</p>
            )}
          </section>

          {/* Selected Restaurant Details */}
          {selectedRestaurant && (
            <section className="mt-8 pb-10">
              <h1 className="text-4xl font-bold text-center text-[#D29501]">{selectedRestaurant.name}</h1>
              <p className="text-center text-sm text-[#A90D3C]">{selectedRestaurant.address}</p>
              
              {/* Reviews Section */}
              <h2 className="text-2xl font-semibold mt-6">Reviews</h2>
              {selectedRestaurant.reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {selectedRestaurant.reviews.map((review, index) => (
                    <div 
                      key={index} 
                      className="p-4 bg-white shadow-md rounded-md cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleReviewClick(review)}
                    >
                      {renderStars(review.rating)}
                      <p className="text-sm italic my-2 line-clamp-3">"{review.content}"</p>
                      <p className="text-right mt-2 text-[#A90D3C]">- {review.patron?.firstName || "Anonymous"}</p>
                      {review.imageUrl && (
                        <div className="mt-2 h-16 w-16 relative float-right">
                          <Image
                            src={review.imageUrl}
                            alt="Review image"
                            className="rounded object-cover"
                            fill
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4">No reviews available.</p>
              )}

              {/* Menu Section */}
              <h2 className="text-2xl font-semibold mt-6">Menu</h2>
              {selectedRestaurant.menuItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {selectedRestaurant.menuItems.map((item, index) => (
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
          )}

          {/* Review Modal */}
          {selectedReview && (
            <ReviewModal 
              review={selectedReview} 
              isOpen={isModalOpen} 
              onClose={closeModal} 
            />
          )}
        </main>
      </div>
    </div>
  );
}