"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faMapMarkerAlt,
  faUtensils,
  faStar,
  faGlobe,
  faLink,
  faEdit
} from "@fortawesome/free-solid-svg-icons";

interface Restaurant {
  id: string;
  title: string;
  url: string | null;
  detail: string | null;
  rating: string;
  num_reviews: string;
  location: string | null;
  category: string[];
  interests: string[];
  widerAreas: string[];
}

interface RestaurantProfileProps {
  restaurant: Restaurant;
  canEdit?: boolean;
  showDetailedView?: boolean;
}

export default function RestaurantProfile({
  restaurant,
  canEdit = false,
  showDetailedView = true
}: RestaurantProfileProps): JSX.Element {
  // For future expandable sections
  const [expanded, setExpanded] = useState<boolean>(false);
  
  // Format rating to have at most one decimal place
  const formattedRating = Number(restaurant.rating) ? 
    Number(Number(restaurant.rating).toFixed(1)) : 
    0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">{restaurant.title}</h2>
            {restaurant.location && (
              <p className="text-gray-600 flex items-center mt-1">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-gray-400" />
                {restaurant.location}
              </p>
            )}
          </div>
          
          {/* Rating display */}
          <div className="flex flex-col items-end">
            <div className="flex items-center mb-1">
              <span className="text-lg font-bold mr-1">{formattedRating}</span>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map(star => (
                  <FontAwesomeIcon 
                    key={star} 
                    icon={faStar} 
                    className={star <= formattedRating ? 'text-yellow-400' : 'text-gray-300'} 
                  />
                ))}
              </div>
            </div>
            <span className="text-sm text-gray-500">{restaurant.num_reviews} reviews</span>
          </div>
        </div>
        
        {/* Edit link if allowed */}
        {canEdit && (
          <div className="mt-4">
            <Link
              href={`/restaurant-dashboard/${restaurant.id}/edit`}
              className="inline-flex items-center px-3 py-1 text-sm bg-[#faf2e5] text-[#f2d36e] rounded-md hover:bg-[#f8e8d0] transition-colors"
            >
              <FontAwesomeIcon icon={faEdit} className="mr-1" />
              Edit Profile
            </Link>
          </div>
        )}
      </div>
      
      {/* Categories and Interests */}
      <div className="p-6 border-b border-gray-100">
        {restaurant.category.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
              <FontAwesomeIcon icon={faUtensils} className="mr-2 text-gray-400" />
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {restaurant.category.map(cat => (
                <span key={cat} className="px-2 py-1 bg-[#faf2e5] text-gray-700 rounded-full text-sm">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {restaurant.interests.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
              <FontAwesomeIcon icon={faStar} className="mr-2 text-gray-400" />
              Food Specialties
            </h3>
            <div className="flex flex-wrap gap-2">
              {restaurant.interests.map(interest => (
                <span key={interest} className="px-2 py-1 bg-[#fdedf6] text-gray-700 rounded-full text-sm">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Description Section */}
      {showDetailedView && restaurant.detail && (
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-2">About</h3>
          <p className="text-gray-700">{restaurant.detail}</p>
        </div>
      )}
      
      {/* Additional Information */}
      {showDetailedView && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurant.widerAreas.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <FontAwesomeIcon icon={faGlobe} className="mr-2 text-gray-400" />
                  Areas Served
                </h3>
                <div className="flex flex-wrap gap-2">
                  {restaurant.widerAreas.map(area => (
                    <span key={area} className="px-2 py-1 bg-[#f1eafe] text-gray-700 rounded-full text-sm">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {restaurant.url && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <FontAwesomeIcon icon={faLink} className="mr-2 text-gray-400" />
                  Website
                </h3>
                <a 
                  href={restaurant.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#dab9f8] hover:underline flex items-center"
                >
                  {restaurant.url}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}