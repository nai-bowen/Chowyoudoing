
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

type ReviewRatings = {
  taste: number;
  value: number;
  service: number;
};

interface ReviewCardProps {
  id: string;
  restaurantId: string;
  restaurantName: string;
  location: string;
  content: string;
  imageUrl: string;
  ratings: ReviewRatings;
  reviewer: {
    name: string;
    id: string;
  };
  isActive: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  id,
  restaurantId,
  restaurantName,
  location,
  content,
  imageUrl,
  ratings,
  reviewer,
  isActive,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg 
            key={i} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className={`transition-all duration-700 flex-shrink-0 w-full ${isActive ? 'opacity-100 z-10' : 'opacity-0 absolute'}`}
      style={{ display: isActive ? 'flex' : 'none' }}>
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col items-center">
          <div className="w-full bg-white rounded-2xl shadow-apple p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-2/5 flex justify-center">
                <div className="w-full h-64 relative rounded-xl overflow-hidden bg-gray-100">
                  <div className={`absolute inset-0 bg-gray-200 ${imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}></div>
                  <img 
                    src={imageUrl} 
                    alt={`Food at ${restaurantName}`}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={handleImageLoad}
                  />
                </div>
              </div>
              
              <div className="md:w-3/5 flex flex-col justify-between">
                <div>
                  <div className="text-yellow-400 text-4xl mb-4">★</div>
                  <p className="text-gray-700 text-lg italic mb-4">{content}</p>
                </div>
                
                <div>
                  <div className="flex justify-end mb-4">
                    <p className="text-brand-600 font-medium">-{reviewer.name}</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-end gap-6">
                    <div className="flex flex-col items-end">
                      {renderStarRating(ratings.taste)}
                      <span className="text-xs text-gray-600 mt-1">Taste</span>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      {renderStarRating(ratings.value)}
                      <span className="text-xs text-gray-600 mt-1">Value</span>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      {renderStarRating(ratings.service)}
                      <span className="text-xs text-gray-600 mt-1">Service</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Link 
            to={`/restaurants/${restaurantId}`}
            className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-full text-lg font-medium transition-colors shadow-md hover:shadow-lg"
          >
            {restaurantName}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;