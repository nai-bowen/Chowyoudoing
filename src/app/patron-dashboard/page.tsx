/*eslint-disable*/
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "../_components/navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar, faBookOpen, faMapMarkerAlt, faPencilAlt } from "@fortawesome/free-solid-svg-icons";

interface Review {
  id: string;
  title: string;
  date: string;
  upvotes: number;
  text?: string;
  restaurant?: string;
  author?: string;
}

interface Restaurant {
  id: string;
  title: string;
  location: string;
  category?: string;
}

interface UserData {
  name: string;
  email: string;
  id: string;
}

export default function PatronDashboard(): JSX.Element {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingUserReviews, setIsLoadingUserReviews] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch user data when session is available
  useEffect(() => {
    const fetchUserData = async (): Promise<void> => {
      if (status === "authenticated" && session?.user) {
        try {
          console.log("Session user data:", session.user);
          
          // If user data is directly available in the session
          if (session.user.name && session.user.email) {
            setUserData({
              name: session.user.name,
              email: session.user.email,
              id: (session.user as any).id || "" // Casting to any to access potential id
            });
            
            console.log("User data set from session:", {
              name: session.user.name,
              email: session.user.email,
              id: (session.user as any).id
            });
          } else {
            // If we need to fetch additional user data from the server
            const response = await fetch("/api/user/profile");
            if (!response.ok) {
              throw new Error("Failed to fetch user data");
            }
            const data = await response.json();
            setUserData(data.user);
            console.log("User data fetched from API:", data.user);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to session data if available
          if (session.user.name) {
            setUserData({
              name: session.user.name,
              email: session.user.email as string,
              id: (session.user as any).id || ""
            });
            console.log("User data fallback to session data");
          }
        }
      }
    };

    fetchUserData();
  }, [session, status]);

  // Fetch general dashboard data
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        // Fetch general reviews
        const reviewsResponse = await fetch("/api/review");
        
        if (!reviewsResponse.ok) {
          console.error("Failed to fetch reviews:", reviewsResponse.statusText);
          setReviews([]);
        } else {
          const reviewsData = await reviewsResponse.json();
          
          if (Array.isArray(reviewsData)) {
            console.log("Reviews data fetched:", reviewsData.length);
            setReviews(reviewsData as Review[]);
          } else if (Array.isArray(reviewsData.reviews)) {
            console.log("Reviews data fetched from nested property:", reviewsData.reviews.length);
            setReviews(reviewsData.reviews as Review[]);
          } else {
            console.error("Reviews data is not an array:", reviewsData);
            setReviews([]);
          }
        }

        // Fetch restaurants
        const restaurantsResponse = await fetch("/api/restaurants/location");
        
        if (!restaurantsResponse.ok) {
          console.error("Failed to fetch restaurants:", restaurantsResponse.statusText);
          setFallbackRestaurants();
        } else {
          const restaurantsData = await restaurantsResponse.json();
          
          if (Array.isArray(restaurantsData)) {
            console.log("Restaurants data fetched:", restaurantsData.length);
            setRestaurants(restaurantsData as Restaurant[]);
          } else if (Array.isArray(restaurantsData.restaurants)) {
            console.log("Restaurants data fetched from nested property:", restaurantsData.restaurants.length);
            setRestaurants(restaurantsData.restaurants as Restaurant[]);
          } else {
            console.error("Restaurants data is not an array:", restaurantsData);
            setFallbackRestaurants();
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setFallbackRestaurants();
      } finally {
        setIsLoading(false);
      }
    };

    const setFallbackRestaurants = (): void => {
      setRestaurants([
        {
          id: "1",
          title: "KAI - Leicester",
          category: "Breakfast",
          location: "Leicester"
        },
        {
          id: "2",
          title: "Fluffy Fluffy - Leicester",
          category: "Dessert",
          location: "Leicester"
        }
      ]);
    };

    fetchData();
  }, []);

  // Fetch user reviews when user data is available
  useEffect(() => {
    const fetchUserReviews = async (): Promise<void> => {
      setIsLoadingUserReviews(true);
      setFetchError(null);
      
      // Only proceed if authenticated
      if (status !== "authenticated") {
        console.log("Not fetching user reviews - not authenticated");
        setIsLoadingUserReviews(false);
        return;
      }
      
      try {
        // Get user ID from session or state
        const userId = (session?.user as any)?.id || userData?.id;
        
        if (!userId) {
          console.log("No user ID available for fetching reviews");
          setFetchError("No user ID available");
          setIsLoadingUserReviews(false);
          return;
        }
        
        console.log(`Fetching reviews for user ${userId}`);
        
        // Updated to use the consolidated endpoint
        const response = await fetch(`/api/review?userId=${userId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch user reviews: ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log("User reviews API response:", data);
        
        if (Array.isArray(data.reviews)) {
          setUserReviews(data.reviews);
          console.log(`Found ${data.reviews.length} user reviews`);
        } else {
          console.error("User reviews data is not an array:", data);
          setUserReviews([]);
          setFetchError("Invalid review data format");
        }
      } catch (error) {
        console.error("Error fetching user reviews:", error);
        setFetchError(error instanceof Error ? error.message : "Unknown error");
        
        // Don't set mock data in production - just show the error
        setUserReviews([]);
      } finally {
        setIsLoadingUserReviews(false);
      }
    };

    // Fetch user reviews when session and user data are available
    if (status === "authenticated" && ((session?.user as any)?.id || userData?.id)) {
      fetchUserReviews();
    }
  }, [session, userData, status]);

  // Handle review edit
  const handleEditReview = (reviewId: string): void => {
    // Navigate to edit review page
    window.location.href = `/review/edit/${reviewId}`;
  };

  return (
    <div className="with-navbar">
      {/* Sidebar Navigation */}
      <Navbar />

      {/* Main Content */}
      <div className="page-content dashboard-content">
        <h1 className="welcome-message">
          Welcome Back, {userData?.name || "Patron"}!
        </h1>

        {/* Hot Reviews Section */}
        <section className="hot-reviews">
          <h2 className="section-title">
            <FontAwesomeIcon icon={faFire} className="icon-flame" /> Hot Reviews
          </h2>
          <p className="section-subtitle">Here's some reviews in your area which have a lot of attention right now!</p>
          
          <div className="reviews-container">
            {isLoading ? (
              <p>Loading reviews...</p>
            ) : reviews.length > 0 ? (
              <div className="review-cards">
                {reviews.slice(0, 3).map((review, index) => (
                  <div className="review-card" key={review.id || index}>
                    <div className="star-rating">
                      <span className="star-icon">★</span>
                      <span>{Math.floor(Math.random() * 2) + 3}/5</span>
                    </div>
                    <span className="quote-decoration-left">"</span>
                    <p className="review-text">
                      {review.text || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc interdum mauris justo, a fermentum lacus posuere ullamcorper. Mauris efficitur mauris mauris, sagittis lobortis sapien eleifend at."}
                    </p>
                    <span className="quote-decoration-right">"</span>
                    <div className="review-card-footer">
                      <span>{review.upvotes || 0} upvotes</span>
                      <span>-{review.author || ["Lisa B.", "Jane D.", "Jamie G."][index % 3]}</span>
                    </div>
                    <div className="restaurant-tag">{review.restaurant || ["Popeyes - Leicester", "BKith - Leicester", "Chickstar - Leicester"][index % 3]}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-reviews">No reviews yet! How about writing one?</p>
            )}
          </div>
        </section>

        {/* Top Menus Section */}
        <section className="top-menus">
          <h2 className="section-title">
            <FontAwesomeIcon icon={faStar} className="icon-star" /> Top Menus
          </h2>
          <p className="section-subtitle">Menus which might catch your interest - based on what you've told us!</p>
          
          <div className="sort-container">
            <span>Sort By:</span>
            <select className="sort-dropdown">
              <option>Newest</option>
              <option>Highest Rated</option>
              <option>Most Popular</option>
            </select>
          </div>
          
          <div className="restaurant-list">
            {isLoading ? (
              <p>Loading restaurants...</p>
            ) : restaurants.length > 0 ? (
              <>
                {restaurants.map((restaurant, index) => (
                  <div className="restaurant-card" key={restaurant.id || index}>
                    <div className="restaurant-info">
                      <div className="restaurant-logo">
                        <img src={`/restaurant${index + 1}.jpg`} alt="Restaurant" className="restaurant-image" />
                      </div>
                      <div className="restaurant-details">
                        <h3>{restaurant.title}</h3>
                        <p className="restaurant-category">{restaurant.category || "Restaurant"}</p>
                        <p className="restaurant-description">
                          {index === 0 ? 
                            "KAI in Leicester specializes in breakfast and brunch, offering a delightful selection of American pancakes and brunch items. The spot's popular for its unique pancake mix!" : 
                            "Fluffy Fluffy, means \"fluffy fluffy\". The UK's largest souffle pancake & dessert cafe. From breakfast to dinner, and everything in between. We aim to deliver happiness, one pancake at a time."}
                        </p>
                      </div>
                    </div>
                    <div className="restaurant-actions">
                      <button className="check-out-btn">Check it out!</button>
                      <button className="write-review-btn">Write a review</button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p>No restaurants found in your area.</p>
            )}
          </div>
        </section>

        {/* Bottom Section: Reviews & Map */}
        <div className="bottom-section">
          <section className="your-reviews">
            <h2 className="section-title">
              <FontAwesomeIcon icon={faBookOpen} className="icon-book" /> Your Reviews
            </h2>
            <p className="section-subtitle">Some of your reviews are gaining traction! Have a look...</p>
            
            {isLoadingUserReviews ? (
              <p>Loading your reviews...</p>
            ) : fetchError ? (
              <div className="error-message">
                <p>There was an error fetching your reviews: {fetchError}</p>
                <p>Please try refreshing the page or contact support if the issue persists.</p>
              </div>
            ) : userReviews.length > 0 ? (
              <div className="review-list">
                {userReviews.map((review, index) => (
                  <div className="review-list-item" key={review.id || index}>
                    <span className="review-number">{index + 1}.</span>
                    <span className="review-title">{review.title}</span>
                    <span className="review-date">{review.date}</span>
                    <div className="review-upvotes">
                      <span className="upvote-icon">👍</span>
                      <span>{review.upvotes} upvotes</span>
                    </div>
                    <button 
                      className="edit-icon" 
                      onClick={() => handleEditReview(review.id)}
                    >
                      <FontAwesomeIcon icon={faPencilAlt} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-reviews">No reviews yet! Start by writing one.</p>
            )}
          </section>

          {/* Your Area (Google Maps) */}
          <section className="your-area">
            <h2 className="section-title">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="icon-map" /> Your Area
            </h2>
            <p className="section-subtitle">Put it on a map! Look at the reviews near you.</p>
            
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d19318.71436395326!2d-1.1453416228027344!3d52.6369879!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487742ab49b76c73%3A0x9a151d2a6fb49cb8!2sLeicester!5e0!3m2!1sen!2suk!4v1708603784760!5m2!1sen!2suk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}