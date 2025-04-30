"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faChartLine, 
  faChartPie, 
  faChartBar, 
  faChartColumn, 
  faStar,
  faComment,
  faEye
} from "@fortawesome/free-solid-svg-icons";
import PremiumButton from "@/app/_components/PremiumButton";
import PremiumSubscriptionModal from "@/app/_components/PremiumSubscriptionModal";

interface RestaurateurData {
  id: string;
  email: string;
  restaurantName: string;
  contactPersonName: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  isPremium: boolean;
}

interface Restaurant {
  id: string;
  title: string;
  rating?: string;
  num_reviews?: string;
  _count?: {
    reviews: number;
  };
}

interface Review {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  restaurantId: string;
  restaurantTitle: string;
  restaurant?: string;
  patron?: {
    firstName: string;
    lastName: string;
  } | null;
  isAnonymous?: boolean;
}

interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
  overallScore: number;
  commonPositive: string[];
  commonNegative: string[];
}

interface AnalyticsSummary {
  totalViews: number;
  totalReviews: number;
  avgRating: number;
  topCategories: { category: string; count: number }[];
  reviewTrend: { date: string; count: number }[];
  sentimentAnalysis?: SentimentData;
}

interface RestaurantAnalyticsProps {
  restaurantId: string;
}

export function RestaurantAnalytics({ restaurantId }: RestaurantAnalyticsProps): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [restaurateurData, setRestaurateurData] = useState<RestaurateurData | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<"week" | "month" | "year">("month");
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);
  
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary>({
    totalViews: 0,
    totalReviews: 0,
    avgRating: 0,
    topCategories: [],
    reviewTrend: []
  });

  // Fetch restaurateur data
  useEffect(() => {
    const fetchRestaurateurData = async (): Promise<void> => {
      if (status !== "authenticated") return;
      
      try {
        setIsLoading(true);
        const response = await fetch("/api/restaurateur/profile");
        
        if (!response.ok) {
          throw new Error("Failed to fetch restaurateur profile");
        }
        
        const data = await response.json();
        
        // Check for premium status, default to false if not present
        setRestaurateurData({
          ...data,
          isPremium: Boolean(data.isPremium)
        });
      } catch (error) {
        console.error("Error fetching restaurateur profile:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurateurData();
  }, [status]);

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurantData = async (): Promise<void> => {
      if (status !== "authenticated" || !restaurantId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/restaurants/${restaurantId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch restaurant data");
        }
        
        const data = await response.json();
        setRestaurant(data);
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantData();
  }, [restaurantId, status]);

  // Fetch reviews and calculate analytics
  useEffect(() => {
    const fetchReviews = async (): Promise<void> => {
      if (status !== "authenticated" || !restaurantId) {
        console.error("Cannot fetch reviews: not authenticated or restaurantId is missing", { 
          status, 
          restaurantId 
        });
        setError("Missing restaurant ID or not authenticated");
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        console.log(`Fetching reviews for restaurantId: ${restaurantId}`);
        
        // Use URLSearchParams to properly construct the query
        const params = new URLSearchParams();
        params.append("restaurantId", restaurantId);
        
        const response = await fetch(`/api/restaurateur/reviews?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Make sure we have an array of reviews
        const reviewsData = data.reviews && Array.isArray(data.reviews) ? data.reviews : [];
        setReviews(reviewsData);
        
        // Calculate analytics based on reviews
        if (reviewsData.length > 0) {
          calculateAnalytics(reviewsData);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setError(error instanceof Error ? error.message : "Failed to load reviews");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [restaurantId, status, analyticsTimeframe]);

  // Calculate analytics based on reviews
  const calculateAnalytics = (reviewData: Review[]): void => {
    if (!reviewData || reviewData.length === 0) {
      setAnalyticsSummary({
        totalViews: 0,
        totalReviews: 0,
        avgRating: 0,
        topCategories: [],
        reviewTrend: []
      });
      return;
    }

    // Basic analytics
    const totalReviews = reviewData.length;
    const avgRating = reviewData.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews;
    
    // Estimate view count based on reviews (in a real app this would come from actual tracking)
    const totalViews = totalReviews * Math.round(3 + (totalReviews / 5));
    
    // Generate review trend data
    const reviewsByDate: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Create labels for the selected timeframe
    const labels: string[] = [];
    
    if (analyticsTimeframe === "week") {
      // Past 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.getDate().toString());
      }
    } else if (analyticsTimeframe === "month") {
      // Past 30 days grouped by week
      for (let i = 4; i >= 0; i--) {
        labels.push(`Week ${i+1}`);
      }
    } else {
      // Past 12 months
      for (let i = 11; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        labels.push(months[monthIndex]!);
      }
    }
    
    // Initialize data structure with zeros
    labels.forEach(label => {
      reviewsByDate[label] = 0;
    });
    
    // Populate with actual review data
    reviewData.forEach(review => {
      const date = new Date(review.createdAt);
      
      if (analyticsTimeframe === "week") {
        // Group by day
        const dayOfMonth = date.getDate().toString();
        // Only count if it's within the last 7 days
        const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo < 7 && labels.includes(dayOfMonth)) {
          reviewsByDate[dayOfMonth] = (reviewsByDate[dayOfMonth] || 0) + 1;
        }
      } else if (analyticsTimeframe === "month") {
        // Group by week
        const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo < 30) {
          const weekNum = Math.floor(daysAgo / 7) + 1;
          const weekLabel = `Week ${weekNum}`;
          if (weekNum <= 4) {
            reviewsByDate[weekLabel] = (reviewsByDate[weekLabel] || 0) + 1;
          }
        }
      } else {
        // Group by month
        const monthsAgo = (currentYear - date.getFullYear()) * 12 + (currentMonth - date.getMonth());
        if (monthsAgo < 12) {
          const monthLabel = months[date.getMonth()];
          reviewsByDate[monthLabel!] = (reviewsByDate[monthLabel!] || 0) + 1;
        }
      }
    });
    
    const reviewTrend = Object.entries(reviewsByDate)
      .map(([date, count]) => ({ date, count }));
    
    // Analyse categories mentioned in reviews
    const categoryKeywords: Record<string, string[]> = {
      "Food Quality": ["food", "delicious", "taste", "flavor", "fresh", "dish", "menu", "meal", "appetizer", "dessert"],
      "Service": ["service", "staff", "waiter", "waitress", "server", "friendly", "attentive", "prompt", "helpful", "slow"],
      "Value": ["price", "value", "expensive", "cheap", "affordable", "worth", "overpriced", "reasonable", "cost", "priced"],
      "Atmosphere": ["atmosphere", "ambiance", "decor", "noise", "music", "comfortable", "cozy", "quiet", "loud", "romantic"],
      "Cleanliness": ["clean", "dirty", "spotless", "filthy", "hygiene", "sanitary", "tidy", "mess", "immaculate", "bathroom"]
    };
    
    const categoryCounts: Record<string, number> = {};
    
    // For each review, check for category keywords
    reviewData.forEach(review => {
      if (!review.content) return;
      
      const content = review.content.toLowerCase();
      
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        // Check if any keywords appear in the review
        const hasKeyword = keywords.some(keyword => content.includes(keyword));
        if (hasKeyword) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
      }
    });
    
    // Sort by count and convert to array
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));
    
    // Basic sentiment analysis if user is premium
    // In a real app, this would be handled server-side with a proper NLP library
    let sentimentAnalysis: SentimentData | undefined;
    
    if (restaurateurData?.isPremium) {
      // A simple word-based sentiment analysis as a placeholder
      // This would normally be handled by a proper NLP service or library
      const simplePositiveWords = [
        "good", "great", "excellent", "amazing", "delicious", "fantastic", 
        "best", "wonderful", "perfect", "enjoyed", "recommend", "tasty", "fresh",
        "friendly", "attentive", "clean", "reasonable", "value", "love", "favorite"
      ];
      
      const simpleNegativeWords = [
        "bad", "terrible", "awful", "worst", "mediocre", "poor", "disappointing",
        "slow", "overpriced", "expensive", "cold", "bland", "dirty", "rude", 
        "unfriendly", "undercooked", "wait", "waited", "never", "horrible"
      ];
      
      let positive = 0;
      let negative = 0;
      let neutral = 0;
      let totalScore = 0;
      
      // Track word occurrences
      const positiveWordCount: Record<string, number> = {};
      const negativeWordCount: Record<string, number> = {};
      
      reviewData.forEach(review => {
        if (!review.content) return;
        
        const words = review.content.toLowerCase().split(/\W+/);
        let reviewScore = 0;
        
        let positiveFound = false;
        let negativeFound = false;
        
        words.forEach(word => {
          if (simplePositiveWords.includes(word)) {
            reviewScore += 1;
            positiveFound = true;
            positiveWordCount[word] = (positiveWordCount[word] || 0) + 1;
          } else if (simpleNegativeWords.includes(word)) {
            reviewScore -= 1;
            negativeFound = true;
            negativeWordCount[word] = (negativeWordCount[word] || 0) + 1;
          }
        });
        
        // Classify the review based on score and rating
        if (reviewScore > 0 || (reviewScore === 0 && review.rating >= 4)) {
          positive++;
        } else if (reviewScore < 0 || (reviewScore === 0 && review.rating <= 2)) {
          negative++;
        } else {
          neutral++;
        }
        
        totalScore += reviewScore;
      });
      
      // Get top words by frequency
      const getTopWords = (wordCounts: Record<string, number>, count: number = 5): string[] => {
        return Object.entries(wordCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, count)
          .map(entry => entry[0]);
      };
      
      sentimentAnalysis = {
        positive,
        negative,
        neutral,
        overallScore: totalScore / totalReviews,
        commonPositive: getTopWords(positiveWordCount),
        commonNegative: getTopWords(negativeWordCount)
      };
    }
    
    setAnalyticsSummary({
      totalViews,
      totalReviews,
      avgRating,
      topCategories,
      reviewTrend,
      sentimentAnalysis
    });
  };

  // Handle timeframe change
  const handleTimeframeChange = (timeframe: "week" | "month" | "year"): void => {
    setAnalyticsTimeframe(timeframe);
  };

  // If not authenticated, redirect to login
  if (status === "unauthenticated") {
    router.push("/login/restaurateur");
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Please log in to access the restaurant dashboard.</p>
      </div>
    );
  }

  // If restaurateur verification status is not approved
  if (restaurateurData && restaurateurData.verificationStatus !== "APPROVED") {
    router.push("/restaurant-dashboard");
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Your account needs to be verified before you can access this page.</p>
      </div>
    );
  }

  return (
    <div>
      <main className="container mx-auto px-6 py-6">
        {/* Header with back button */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              href={`/restaurant-dashboard/${restaurantId}`}
              className="mr-4 text-gray-600 hover:text-gray-900 flex items-center"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Analytics & Insights</h1>
          </div>
          
          {/* Premium button if user is not premium */}
          {restaurateurData && !restaurateurData.isPremium && (
            <PremiumButton 
              feature="analytics" 
            />
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-6">
            <p>{error}</p>
          </div>
        ) : (
          <div className={restaurateurData && !restaurateurData.isPremium ? "relative" : ""}>
            {/* Blur overlay for non-premium users */}
            {restaurateurData && !restaurateurData.isPremium && (
              <div className="absolute inset-0 backdrop-blur-md bg-white/30 z-10 flex items-center justify-center">
                <div className="text-center p-6 bg-white/80 rounded-xl shadow-lg max-w-md mx-auto">
                  <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
                  <p className="mb-4">
                    Upgrade to Premium to unlock detailed analytics and sentiment analysis for your restaurant reviews.
                  </p>
                  <PremiumButton 
                    feature="analytics" 
                  />
                </div>
              </div>
            )}
            
            {/* Display analytics content */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">{restaurant?.title}</h2>
              <p className="text-gray-600">
                Analytics overview for {analyticsTimeframe === "week" ? "the past week" : 
                  analyticsTimeframe === "month" ? "the past month" : "the past year"}
              </p>
            </div>
            
            {/* Time period selector */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">Time Period</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleTimeframeChange("week")} 
                    className={`px-3 py-1 rounded-md text-sm ${analyticsTimeframe === "week" 
                      ? "bg-[#dab9f8] text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    Week
                  </button>
                  <button 
                    onClick={() => handleTimeframeChange("month")} 
                    className={`px-3 py-1 rounded-md text-sm ${analyticsTimeframe === "month" 
                      ? "bg-[#dab9f8] text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    Month
                  </button>
                  <button 
                    onClick={() => handleTimeframeChange("year")} 
                    className={`px-3 py-1 rounded-md text-sm ${analyticsTimeframe === "year" 
                      ? "bg-[#dab9f8] text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    Year
                  </button>
                </div>
              </div>
            </div>
            
            {/* No reviews message */}
            {analyticsSummary.totalReviews === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <FontAwesomeIcon icon={faChartLine} className="text-4xl text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No Reviews Yet</h3>
                <p className="text-gray-500 mb-4">
                  Your restaurant doesn't have any reviews yet. When customers leave reviews, you'll see analytics here.
                </p>
              </div>
            ) : (
              <div>
                {/* Key metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#faf2e5] p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm text-gray-500">Profile Views</h3>
                        <p className="text-2xl font-bold">{analyticsSummary.totalViews}</p>
                      </div>
                      <div className="bg-[#f2d36e] p-3 rounded-full">
                        <FontAwesomeIcon icon={faEye} className="text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#fdedf6] p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm text-gray-500">Review Count</h3>
                        <p className="text-2xl font-bold">{analyticsSummary.totalReviews}</p>
                      </div>
                      <div className="bg-[#f9c3c9] p-3 rounded-full">
                        <FontAwesomeIcon icon={faComment} className="text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#f1eafe] p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm text-gray-500">Average Rating</h3>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold mr-2">{analyticsSummary.avgRating.toFixed(1)}</span>
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map(star => (
                              <FontAwesomeIcon 
                                key={star} 
                                icon={faStar} 
                                className={`text-sm ${star <= Math.floor(analyticsSummary.avgRating) 
                                  ? 'text-yellow-400' 
                                  : star <= analyticsSummary.avgRating 
                                    ? 'text-yellow-400/50'
                                    : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#dab9f8] p-3 rounded-full">
                        <FontAwesomeIcon icon={faStar} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Charts section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Review Trend Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Review Trend</h3>
                      <div className="text-gray-500 text-sm">
                        <FontAwesomeIcon icon={faChartLine} className="mr-1" />
                        {analyticsTimeframe === "week" ? "Last 7 days" : 
                         analyticsTimeframe === "month" ? "Last 30 days" : "Last 12 months"}
                      </div>
                    </div>
                    
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    {analyticsSummary.reviewTrend.length > 0 ? (
                        <div className="flex h-40 items-end gap-4 px-4 w-full justify-around">
                        {analyticsSummary.reviewTrend.map((item, index) => {
                            // Fixed heights based on count
                            const barHeightPx = item.count === 0 ? 4 : (20 + (item.count * 20));
                            
                            return (
                            <div key={index} className="flex flex-col items-center">
                                <div 
                                className="w-8 bg-[#dab9f8] rounded-t-md"
                                style={{ height: `${barHeightPx}px` }}
                                ></div>
                                <span className="text-xs mt-2">{item.date}</span>
                                <span className="text-xs font-medium">{item.count}</span>
                            </div>
                            );
                        })}
                        </div>
                    ) : (
                        <p className="text-gray-500">Not enough data to display chart</p>
                    )}
                    </div>
                  </div>
                  
                  {/* Top Categories Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Top Mentioned Categories</h3>
                      <FontAwesomeIcon icon={faChartBar} className="text-gray-500" />
                    </div>
                    
                    <div className="space-y-4">
                      {analyticsSummary.topCategories.length > 0 ? (
                        analyticsSummary.topCategories.map((category, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">{category.category}</span>
                              <span className="text-sm font-semibold">{category.count}</span>
                            </div>
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="h-2 bg-[#dab9f8]" 
                                style={{ 
                                  width: `${(category.count / (analyticsSummary.topCategories[0]?.count || 1)) * 100}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">Not enough data to analyse categories</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Sentiment Analysis - Premium Feature */}
                {analyticsSummary.sentimentAnalysis && (
                  <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Sentiment Analysis</h3>
                      <span className="text-xs bg-gradient-to-r from-[#dab9f8] to-[#f2d36f] text-white px-2 py-1 rounded-full">
                        Premium
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="text-sm text-gray-500 mb-1">Positive Reviews</h4>
                        <p className="text-2xl font-bold text-green-600">
                          {analyticsSummary.sentimentAnalysis.positive}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            ({Math.round((analyticsSummary.sentimentAnalysis.positive / analyticsSummary.totalReviews) * 100)}%)
                          </span>
                        </p>
                      </div>
                      
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h4 className="text-sm text-gray-500 mb-1">Negative Reviews</h4>
                        <p className="text-2xl font-bold text-red-600">
                          {analyticsSummary.sentimentAnalysis.negative}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            ({Math.round((analyticsSummary.sentimentAnalysis.negative / analyticsSummary.totalReviews) * 100)}%)
                          </span>
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm text-gray-500 mb-1">Neutral Reviews</h4>
                        <p className="text-2xl font-bold text-gray-600">
                          {analyticsSummary.sentimentAnalysis.neutral}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            ({Math.round((analyticsSummary.sentimentAnalysis.neutral / analyticsSummary.totalReviews) * 100)}%)
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      {/* Common Positive Words */}
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Common Positive Words</h4>
                        <div className="flex flex-wrap gap-2">
                          {analyticsSummary.sentimentAnalysis.commonPositive.length > 0 ? (
                            analyticsSummary.sentimentAnalysis.commonPositive.map((word, index) => (
                              <span 
                                key={index} 
                                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                              >
                                {word}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No positive words found</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Common Negative Words */}
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Common Negative Words</h4>
                        <div className="flex flex-wrap gap-2">
                          {analyticsSummary.sentimentAnalysis.commonNegative.length > 0 ? (
                            analyticsSummary.sentimentAnalysis.commonNegative.map((word, index) => (
                              <span 
                                key={index} 
                                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                              >
                                {word}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No negative words found</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Overall Sentiment Score</h4>
                      <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden relative">
                        <div className="absolute inset-y-0 left-1/2 w-1 bg-gray-400 -ml-0.5 z-10"></div>
                        <div 
                          className={`h-full ${analyticsSummary.sentimentAnalysis.overallScore > 0 
                            ? 'bg-green-500' 
                            : analyticsSummary.sentimentAnalysis.overallScore < 0 
                              ? 'bg-red-500' 
                              : 'bg-gray-400'}`}
                          style={{ 
                            width: `${Math.min(Math.abs(analyticsSummary.sentimentAnalysis.overallScore * 10) + 50, 100)}%`,
                            marginLeft: analyticsSummary.sentimentAnalysis.overallScore < 0 ? '0' : '50%',
                            transform: analyticsSummary.sentimentAnalysis.overallScore < 0 ? 'translateX(50%)' : 'translateX(-100%)'
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Negative</span>
                        <span>Neutral</span>
                        <span>Positive</span>
                      </div>
                      <p className="text-center text-sm mt-2">
                        Score: {analyticsSummary.sentimentAnalysis.overallScore.toFixed(2)}
                        {analyticsSummary.sentimentAnalysis.overallScore > 1 ? ' (Very Positive)' : 
                         analyticsSummary.sentimentAnalysis.overallScore > 0 ? ' (Positive)' :
                         analyticsSummary.sentimentAnalysis.overallScore === 0 ? ' (Neutral)' :
                         analyticsSummary.sentimentAnalysis.overallScore > -1 ? ' (Negative)' : ' (Very Negative)'}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Recent activity */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold mb-4">Recent Reviews</h3>
                  
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review, index) => (
                      <div key={review.id} className="border-l-2 border-[#dab9f8] pl-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(star => (
                              <FontAwesomeIcon 
                                key={star} 
                                icon={faStar} 
                                className={`text-xs ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{review.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          By: {review.isAnonymous ? "Anonymous" : 
                              review.patron ? `${review.patron.firstName} ${review.patron.lastName}` : 
                              "Unknown User"}
                        </p>
                      </div>
                    ))}
                    
                    {reviews.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No reviews available</p>
                    )}
                  </div>
                  
                  {reviews.length > 0 && (
                    <div className="text-center mt-6">
                      <Link 
                        href={`/restaurant-dashboard/${restaurantId}`} 
                        className="text-[#dab9f8] hover:text-[#c9a2f2] text-sm font-medium"
                      >
                        View all reviews
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Premium Subscription Modal */}
      <PremiumSubscriptionModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onSubscribe={() => {
          // When subscription is successful
          if (restaurateurData) setRestaurateurData({ ...restaurateurData, isPremium: true });
          setIsPremiumModalOpen(false);
        }}
        feature="analytics"
      />
    </div>
  );
}