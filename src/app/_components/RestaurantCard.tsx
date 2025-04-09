// src/app/_components/RestaurantCard.tsx
"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faUtensils, faEdit, faChartLine } from "@fortawesome/free-solid-svg-icons";

interface Restaurant {
  id: string;
  title: string;
  location: string;
  category: string[] | string;
  rating?: string;
  num_reviews?: string;
  _count?: {
    reviews: number;
  };
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  color?: string;
}

export default function RestaurantCard({ 
  restaurant,
  color = "#fdf9f5" 
}: RestaurantCardProps): JSX.Element {
  
  const reviewCount = restaurant._count?.reviews || 
                     (restaurant.num_reviews ? parseInt(restaurant.num_reviews) : 0);
  
  const categoryArray = Array.isArray(restaurant.category) 
    ? restaurant.category 
    : typeof restaurant.category === 'string'
      ? [restaurant.category]
      : [];

  return (
    <div
      className="rounded-xl shadow-sm p-5 transition-all hover:shadow-md"
      style={{ backgroundColor: color }}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg">{restaurant.title}</h3>
      </div>
      
      <div className="flex items-center text-sm text-gray-600 mb-3">
        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
        <span>{restaurant.location}</span>
      </div>
      
      {categoryArray.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {categoryArray.slice(0, 3).map((cat, i) => (
            <span key={i} className="text-xs bg-white px-2 py-1 rounded-full">
              {cat}
            </span>
          ))}
          {categoryArray.length > 3 && (
            <span className="text-xs bg-white px-2 py-1 rounded-full">
              +{categoryArray.length - 3} more
            </span>
          )}
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
        <div className="flex space-x-3">
          <Link
            href={`/restaurant-dashboard/${restaurant.id}`}
            className="text-sm text-[#dab9f8] hover:underline flex items-center"
          >
            <FontAwesomeIcon icon={faEdit} className="mr-1" />
            Manage
          </Link>
          
          <Link
            href={`/restaurant-dashboard/${restaurant.id}/analytics`}
            className="text-sm text-[#f9c3c9] hover:underline flex items-center"
          >
            <FontAwesomeIcon icon={faChartLine} className="mr-1" />
            Analytics
          </Link>
        </div>
        
        <span className="text-sm text-gray-500 flex items-center">
          <FontAwesomeIcon icon={faUtensils} className="mr-1 text-gray-400" />
          {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
        </span>
      </div>
    </div>
  );
}