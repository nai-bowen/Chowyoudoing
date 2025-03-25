"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface RestaurantCardProps {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  priceLevel: string;
  categories: string[];
  address: string;
  isOpen: boolean;
}

const getPastelColor = (index: number) => {
  const colors = [
    'glass-yellow', // Yellow pastel
    'glass-pink',   // Pink pastel
    'glass-purple', // Purple pastel
  ];
  return colors[index % colors.length];
};

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  id,
  name,
  imageUrl,
  rating,
  reviewCount,
  priceLevel,
  categories,
  address,
  isOpen,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Create a pastel background color based on the restaurant ID
  const pastelClass = getPastelColor(parseInt(id, 10) || 0);

  return (
    <Link to={`/restaurants/${id}`} className="block group">
      <div className={`rounded-xl ${pastelClass} hover-lift overflow-hidden h-full flex flex-col transition-all duration-300`}>
        <div className="h-48 overflow-hidden bg-gray-100 relative">
          <div className={`absolute inset-0 bg-gray-200 ${imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}></div>
          <img 
            src={imageUrl} 
            alt={name} 
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
          />
          
          {/* Status badge - open/closed */}
          <div 
            className={`absolute top-3 right-3 ${isOpen ? 'bg-green-500' : 'bg-red-500'} text-white text-xs px-2 py-1 rounded-full font-medium`}
          >
            {isOpen ? 'Open' : 'Closed'}
          </div>
        </div>
        
        <div className="p-4 flex-grow flex flex-col backdrop-blur-sm">
          <h3 className="font-semibold text-lg text-gray-800 group-hover:text-food-700 transition-colors">{name}</h3>
          
          <div className="mt-2 flex items-center gap-1">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg 
                  key={i} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`w-4 h-4 ${
                    i < Math.floor(rating) 
                      ? 'text-food-500 fill-food-500' 
                      : i < rating 
                        ? 'text-food-500 fill-food-500/50' 
                        : 'text-gray-300'
                  }`}
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-1">({reviewCount})</span>
          </div>
          
          <div className="mt-3 flex items-center text-sm text-gray-500">
            <span className="mr-2">{priceLevel}</span>
            <span className="mr-2">•</span>
            <span className="truncate">{categories.join(', ')}</span>
          </div>
          
          <div className="mt-3 flex items-start gap-1.5 text-sm text-gray-500">
            <svg 
              className="mt-0.5 flex-shrink-0 w-4 h-4 text-gray-400" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="line-clamp-1">{address}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;