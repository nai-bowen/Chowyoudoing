/*eslint-disable*/

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ThumbsUp, Flag, Star, X } from 'lucide-react';

// Type definitions
interface ReviewRatings {
  taste: number;
  value: number;
  service: number;
}

interface Review {
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
  helpfulCount?: number;
  isHelpful?: boolean;
}

// Login Modal Component
const LoginModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onLogin: () => void; 
  isRestaurant?: boolean;
  restaurantName?: string;
}> = ({ isOpen, onClose, onLogin, isRestaurant = false, restaurantName = "" }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold mb-3">
          {isRestaurant 
            ? `Discover More About ${restaurantName}!` 
            : "Discover More Food Adventures!"}
        </h3>
        <p className="text-gray-600 mb-6">
          {isRestaurant
            ? "Want to discover more restaurants? Login or stay on the homepage to search these options without an account!"
            : "Log in to discover more amazing reviews and restaurants tailored to your taste preferences."}
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Stay on Homepage
          </button>
          <button 
            onClick={onLogin}
            className="px-4 py-2 bg-[#F1C84B] text-white rounded-lg hover:bg-[#d9a82e]"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

// Component for Star Rating
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${
            star <= rating
              ? "text-[#f2d26d] fill-[#f2d26d]"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

// Avatar component
const Avatar: React.FC<{ name: string; className?: string }> = ({ name, className = "" }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`h-10 w-10 rounded-full bg-[#d9b7f8] text-white flex items-center justify-center font-medium ${className}`}>
      {initials}
    </div>
  );
};

// Main Reviews Section Component
const ReviewsSection: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<string>("");
  const [hasLocalReviews, setHasLocalReviews] = useState<boolean>(false);
  
  // Fetch mock reviews on mount
  useEffect(() => {
    // Simulate API call with timeout
    const timeoutId = setTimeout(() => {
      // Mock reviews data
      const mockReviews: Review[] = [
        {
          id: "1",
          restaurantId: "popeyes1",
          restaurantName: "Popeyes",
          location: "London",
          content: "The chicken sandwich was incredible! Crispy on the outside, juicy on the inside. Perfect amount of spice and the bread was fresh. I'll definitely be back for more.",
          imageUrl: "/assets/popeyes.jpg",
          ratings: { taste: 4, value: 5, service: 5 },
          reviewer: { name: "Lisa Brighton", id: "user1" },
          helpfulCount: 24,
          isHelpful: false
        },
        {
          id: "2",
          restaurantId: "kith1",
          restaurantName: "&Kith - Leicester",
          location: "Leicester",
          content: "Their avocado toast is a game-changer! The bread was perfectly toasted and the toppings were fresh. Great spot for brunch with friends.",
          imageUrl: "/assets/&kith.jpg",
          ratings: { taste: 4, value: 5, service: 5 },
          reviewer: { name: "Mark Turner", id: "user2" },
          helpfulCount: 16,
          isHelpful: true
        },
        {
          id: "3",
          restaurantId: "chickanos1",
          restaurantName: "Chickanos",
          location: "Birmingham",
          content: "The chicken burger was amazing! Juicy chicken with the perfect crunch. Their fries are also exceptional - crispy and well-seasoned.",
          imageUrl: "/assets/chickanos.jpg",
          ratings: { taste: 4, value: 5, service: 5 },
          reviewer: { name: "Ricky Hanson", id: "user3" },
          helpfulCount: 8,
          isHelpful: false
        }
      ];
      
      setReviews(mockReviews);
      setUserLocation("London");
      setHasLocalReviews(true);
      setIsLoadingReviews(false);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Function to handle marking a review as helpful
  const handleMarkHelpful = (reviewId: string): void => {
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? { 
            ...review, 
            isHelpful: !review.isHelpful,
            helpfulCount: review.isHelpful 
              ? (review.helpfulCount || 1) - 1 
              : (review.helpfulCount || 0) + 1
          } 
        : review
    ));
  };

  // State to track modal context
  const [modalContext, setModalContext] = useState<{
    isRestaurant: boolean;
    restaurantName: string;
  }>({
    isRestaurant: false,
    restaurantName: ""
  });

  // Handle see more reviews click
  const handleSeeMoreClick = (e: React.MouseEvent): void => {
    if (!session) {
      e.preventDefault();
      setModalContext({
        isRestaurant: false,
        restaurantName: ""
      });
      setShowLoginModal(true);
    }
    // If logged in, Link will handle navigation
  };

  // Handle restaurant click
  const handleRestaurantClick = (e: React.MouseEvent, restaurantName: string): void => {
    if (!session) {
      e.preventDefault();
      setModalContext({
        isRestaurant: true,
        restaurantName
      });
      setShowLoginModal(true);
    }
    // If logged in, Link will handle navigation
  };

  // Handle login button click in modal
  const handleLogin = (): void => {
    router.push('/login');
  };

  // Get the average rating for a review
  const getAverageRating = (ratings: ReviewRatings): number => {
    return Math.round((ratings.taste + ratings.value + ratings.service) / 3);
  };

  // Format date for display (mock function)
  const formatDate = (reviewId: string): string => {
    // In a real app, you'd use the review's actual date
    const dates = ["March 12, 2025", "February 27, 2025", "March 15, 2025"];
    return dates[parseInt(reviewId) - 1] || "March 2025";
  };

  // Colors for review cards
  const cardColors = [
    { bg: "bg-[#f9ebc2]/40", border: "border-[#f9ebc2]" },
    { bg: "bg-[#f9c4ca]/40", border: "border-[#f9c4ca]" },
    { bg: "bg-[#f5b5ee]/40", border: "border-[#f5b5ee]" },
    { bg: "bg-[#d9b7f8]/40", border: "border-[#d9b7f8]" }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F1C84B] mb-4">
            Short <span className="text-[#f2d26d]">&</span> Sweet<br /> 
            <span>Reviews</span>
          </h2>
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-600 leading-relaxed">
              At Chow You Doing?, we take food reviews seriously—well, as seriously as you can when drooling over crispy fries and gooey desserts! Whether you're hunting for the best bites in town or warning others about a "never again" meal, our reviews have got you covered.
            </p>
          </div>
        </div>
        
        {/* Reviews Display */}
        <div className="relative">
          {isLoadingReviews ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F1C84B]"></div>
            </div>
          ) : reviews.length > 0 ? (
            <>
              {/* Location Notice */}
              {hasLocalReviews && (
                <div className="mb-8 text-left">
                  <span className="bg-[#F1C84B] text-white px-4 py-1 rounded-full text-sm inline-block">
                    Reviews from {userLocation}
                  </span>
                </div>
              )}
              
              {/* Grid Layout for Reviews */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review, index) => {
                  const colorSet = cardColors[index % cardColors.length];
                  return (
                    <div 
                      key={review.id}
                      className={`transition-all duration-300 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-2 p-6 ${colorSet!.bg} border ${colorSet!.border} backdrop-blur-sm`}
                      style={{
                        transform: `translateY(${index % 2 * 10}px)`,
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      {/* Restaurant Name Link */}
                      <Link 
                        href={session ? "/discover" : "#"}
                        onClick={(e) => handleRestaurantClick(e, review.restaurantName)}
                        className="block text-xl font-semibold text-[#F1C84B] hover:underline mb-3"
                      >
                        {review.restaurantName}
                      </Link>
                      
                      {/* Review Header - Avatar and Info */}
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar name={review.reviewer.name} />
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mb-2">
                            <h4 className="font-medium">{review.reviewer.name}</h4>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <StarRating rating={getAverageRating(review.ratings)} />
                            <span className="text-sm text-gray-500">{formatDate(review.id)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Review Content */}
                      <div className="mb-4">
                        {review.imageUrl && (
                          <div className="mb-4 rounded-lg overflow-hidden h-48 w-full">
                            <img 
                              src={review.imageUrl} 
                              alt={`Food at ${review.restaurantName}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <p className="text-gray-700">"{review.content}"</p>
                      </div>
                      
                      {/* Rating Details */}
                      <div className="flex flex-wrap gap-4 mb-3">
                        <div className="flex items-center">
                          <span className="text-xs text-gray-600 mr-2">Taste:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span 
                                key={star} 
                                className={star <= review.ratings.taste ? "text-[#f2d26d]" : "text-gray-300"}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-xs text-gray-600 mr-2">Value:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span 
                                key={star} 
                                className={star <= review.ratings.value ? "text-[#f2d26d]" : "text-gray-300"}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-xs text-gray-600 mr-2">Service:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span 
                                key={star} 
                                className={star <= review.ratings.service ? "text-[#f2d26d]" : "text-gray-300"}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between border-t pt-3">
                        <button 
                          onClick={() => handleMarkHelpful(review.id)}
                          className={`flex items-center gap-1 text-sm ${review.isHelpful ? "text-[#F1C84B]" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          <ThumbsUp size={16} className={review.isHelpful ? "fill-[#F1C84B]" : ""} />
                          <span>Helpful {review.helpfulCount ? `(${review.helpfulCount})` : ""}</span>
                        </button>
                        
                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                          <Flag size={16} />
                          <span>Report</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* See More Button */}
              <div className="mt-10 text-center">
                <Link
                  href={session ? "/discover" : "#"}
                  onClick={handleSeeMoreClick}
                  className="inline-flex items-center gap-2 bg-[#F1C84B] hover:bg-[#d9a82e] text-white px-6 py-3 rounded-full text-lg font-medium transition-colors shadow-md"
                >
                  See More Reviews
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500">No reviews available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        isRestaurant={modalContext.isRestaurant}
        restaurantName={modalContext.restaurantName}
      />
    </section>
  );
};

export default ReviewsSection;