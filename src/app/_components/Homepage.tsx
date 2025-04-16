"use client";

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Star, MapPin, ExternalLink, Mail, Phone, MapIcon, ArrowRightCircle, AlertCircle } from 'lucide-react';
import Navbar from './Home-Navbar';
import Hero from './Hero';
import { useSession } from "next-auth/react";
import ReviewsSection from './ReviewSection';
import { toast } from 'react-hot-toast'; // Make sure to install this package

// Type definitions
type Restaurant = {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  priceLevel: string;
  categories: string[];
  address: string;
  hasReviews: boolean;
};

type ReviewRatings = {
  taste: number;
  value: number;
  service: number;
};

type Review = {
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
};

export default function Home(): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  
  const [activeReview, setActiveReview] = React.useState<number>(0);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = React.useState<boolean>(true);
  const [userLocation, setUserLocation] = React.useState<string>("");
  const [hasLocalReviews, setHasLocalReviews] = React.useState<boolean>(false);

  // Handler for protected routes
  const handleProtectedLink = useCallback((e: React.MouseEvent, path: string): void => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      // Show notification
      toast.error("Please log in to use this feature", {
        icon: <AlertCircle className="text-red-500" size={18} />,
        position: "top-center",
        duration: 3000
      });
      
      // Redirect to login
      setTimeout(() => {
        router.push("/login");
      }, 500);
    } else {
      router.push(path);
    }
  }, [isAuthenticated, router]);

  // Fetch mock reviews on mount
  React.useEffect(() => {
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
          reviewer: { name: "Lisa B.", id: "user1" }
        },
        {
          id: "2",
          restaurantId: "kith1",
          restaurantName: "&Kith - Leicester",
          location: "Leicester",
          content: "Their avocado toast is a game-changer! The bread was perfectly toasted and the toppings were fresh. Great spot for brunch with friends.",
          imageUrl: "/assets/&kith.jpg",
          ratings: { taste: 4, value: 5, service: 5 },
          reviewer: { name: "Mark T.", id: "user2" }
        },
        {
          id: "3",
          restaurantId: "chickanos1",
          restaurantName: "Chickanos",
          location: "Birmingham",
          content: "The chicken burger was amazing! Juicy chicken with the perfect crunch. Their fries are also exceptional - crispy and well-seasoned.",
          imageUrl: "/assets/chickanos.jpg",
          ratings: { taste: 4, value: 5, service: 5 },
          reviewer: { name: "Ricky H.", id: "user3" }
        }
      ];
      
      setReviews(mockReviews);
      setUserLocation("London");
      setHasLocalReviews(true);
      setIsLoadingReviews(false);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Auto-rotate through reviews
  React.useEffect(() => {
    if (reviews.length === 0) return;
    
    const interval = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % reviews.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [reviews]);

  // Navigation between reviews
  function navigateReviews(direction: 'prev' | 'next'): void {
    if (direction === 'prev') {
      setActiveReview((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
    } else {
      setActiveReview((prev) => (prev + 1) % reviews.length);
    }
  }

  // Featured restaurants data
  const restaurants: Restaurant[] = [
    {
      id: '1',
      name: 'The Urban Bistro',
      imageUrl: '/restaurant1.jpg',
      rating: 4.5,
      reviewCount: 347,
      priceLevel: '$',
      categories: ['American', 'Brunch'],
      address: '123 Main St, San Francisco, CA',
      hasReviews: true,
    },
    {
      id: '2',
      name: 'Coastal Kitchen',
      imageUrl: '/restaurant2.jpg',
      rating: 5,
      reviewCount: 228,
      priceLevel: '$$',
      categories: ['Seafood', 'Bar'],
      address: '456 Ocean Ave, Los Angeles, CA',
      hasReviews: true,
    },
    {
      id: '3',
      name: 'Green Garden Cafe',
      imageUrl: '/restaurant3.jpg',
      rating: 4,
      reviewCount: 189,
      priceLevel: '$',
      categories: ['Vegetarian', 'Healthy'],
      address: '789 Market St, Portland, OR',
      hasReviews: false,
    },
    {
      id: '4',
      name: 'Spice Route',
      imageUrl: '/restaurant4.jpg',
      rating: 4.5,
      reviewCount: 275,
      priceLevel: '$',
      categories: ['Indian', 'Asian Fusion'],
      address: '101 Eastern Blvd, Seattle, WA',
      hasReviews: true,
    },
  ];

  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Featured Restaurants */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-[#F1C84B]">Featured Restaurants</h2>
            {/* Public link - no auth needed */}
            <Link href="/login" className="text-[#FFB400] hover:text-[#D29501] font-medium flex items-center gap-1">
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Restaurant Cards - Public routes (no auth needed) */}
            {restaurants.map((restaurant, index) => {
              const gradientColors = [
                '#f2d577',
                '#dabbfa',
                '#f5baf2',
                '#f9c8d7',
                '#f9ecd0',
              ];
              const baseColor = gradientColors[index % gradientColors.length];
              const fallbackGradient = `linear-gradient(135deg, ${baseColor}, ${baseColor}80)`;

              return (
                <Link 
                  key={restaurant.id} 
                  href={`/login`} 
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="h-48 overflow-hidden">
                    <div 
                      className="w-full h-full bg-cover bg-center"
                      style={{ 
                        backgroundImage: `url(${restaurant.imageUrl}), ${fallbackGradient}`
                      }}
                    ></div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg text-[#4B2B10]">{restaurant.name}</h3>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span className={`inline-block rounded-full w-2 h-2 ${restaurant.hasReviews ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={restaurant.hasReviews ? 'text-green-700' : 'text-red-700'}>
                          {restaurant.hasReviews ? 'Has Reviews' : 'No Reviews Yet'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={16} 
                            className={star <= Math.floor(restaurant.rating) 
                              ? "text-[#FFB400] fill-[#FFB400]" 
                              : star <= restaurant.rating 
                                ? "text-[#FFB400] fill-[#FFB400]/50" 
                                : "text-gray-300"
                            } 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-700 ml-1">({restaurant.reviewCount})</span>
                    </div>

                    <div className="mt-3 flex items-center text-sm text-gray-700">
                      <span className="mr-2">{restaurant.priceLevel}</span>
                      <span className="mr-2">•</span>
                      <span>{restaurant.categories.join(', ')}</span>
                    </div>

                    <div className="mt-3 flex items-start gap-1.5 text-sm text-gray-700">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-500" />
                      <span className="line-clamp-1">{restaurant.address}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <ReviewsSection />

      {/* Call to Action - Write a Review - PROTECTED ROUTE */}
      <section className="py-20 bg-gradient-to-br from-[#f9ecd0] to-[#f2d577]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Share Your Food Experience
            </h2>
            <p className="text-white/90 text-lg max-w-2xl mb-10">
              Had an amazing meal? Or perhaps something not worth the hype? Let others know by writing a review and help them find the perfect spot!
            </p>
            {/* Protected route that checks auth status */}
            <a 
              href="#"
              onClick={(e) => handleProtectedLink(e, "/review")}
              className="bg-white text-[#F1C84B] hover:bg-[#F8A5A5] hover:text-white transition-colors px-10 py-4 rounded-full font-medium text-lg shadow-lg flex items-center gap-2 cursor-pointer"
            >
              Write a Review
              <ArrowRightCircle size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold text-[#F1C84B] text-center mb-16">Why Choose Chow You Doing?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-[#FFB400]/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <MapIcon size={32} className="text-[#FFB400]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Discover Local Gems</h3>
              <p className="text-gray-600">
                Find hidden culinary treasures in your neighborhood that you might have missed.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-[#F8A5A5]/20 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <Star size={32} className="text-[#F8A5A5]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Honest Reviews</h3>
              <p className="text-gray-600">
                Get authentic opinions from real customers about their dining experiences.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-[#F1C84B]/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#F1C84B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Driven</h3>
              <p className="text-gray-600">
                Join a community of food enthusiasts sharing their passion for great meals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2D3748] text-white py-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-bold mb-4">Chow You Doing?</h3>
              <p className="text-gray-300 max-w-xs">
                Discover, rate, and recommend the best meals around you—one bite at a time.
              </p>
              <div className="flex mt-6 space-x-4">
                <a href="#" className="text-gray-300 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">For Users</h4>
                <ul className="space-y-2">
                  <li><Link href="/login" className="text-gray-300 hover:text-white">Login</Link></li>
                  <li><Link href="/register" className="text-gray-300 hover:text-white">Sign Up</Link></li>
                  {/* Protected footer links */}
                  <li>
                    <a 
                      href="#" 
                      onClick={(e) => handleProtectedLink(e, "/patron-dashboard")} 
                      className="text-gray-300 hover:text-white cursor-pointer"
                    >
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      onClick={(e) => handleProtectedLink(e, "/review")} 
                      className="text-gray-300 hover:text-white cursor-pointer"
                    >
                      Write a Review
                    </a>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">For Restaurants</h4>
                <ul className="space-y-2">
                  {/* Protected restaurant links */}
                  <li>
                    <a 
                      href="#" 
                      onClick={(e) => handleProtectedLink(e, "/restaurant-dashboard")} 
                      className="text-gray-300 hover:text-white cursor-pointer"
                    >
                      Claim Business
                    </a>
                  </li>
                  <li><Link href="/login" className="text-gray-300 hover:text-white">Business Login</Link></li>
                  <li><Link href="/discover" className="text-gray-300 hover:text-white">Discover Restaurants</Link></li>
                  <li>
                    <a 
                      href="#" 
                      onClick={(e) => handleProtectedLink(e, "/restaurant-dashboard")} 
                      className="text-gray-300 hover:text-white cursor-pointer"
                    >
                      Restaurant Dashboard
                    </a>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Mail className="w-5 h-5 mr-2 mt-0.5 text-gray-400" />
                    <span className="text-gray-300">support@chowyoudoing.com</span>
                  </li>
                  <li className="flex items-start">
                    <Phone className="w-5 h-5 mr-2 mt-0.5 text-gray-400" />
                    <span className="text-gray-300">+44 (0) 123 456 7890</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Chow You Doing? All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}