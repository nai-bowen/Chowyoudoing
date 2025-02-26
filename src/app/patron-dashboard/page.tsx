/*eslint-disable*/
"use client";

import { useEffect, useState } from "react";
import Navbar from "../_components/navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar, faBookOpen, faMapMarkerAlt, faPencilAlt } from "@fortawesome/free-solid-svg-icons";

interface Review {
  id: string;
  title: string;
  date: string;
  upvotes: number;
  text?: string;
}

interface Restaurant {
  id: string;
  title: string;
  location: string;
  category?: string;
}

export default function PatronDashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        // Fetch reviews
        const reviewsResponse = await fetch("/api/reviews");
        const reviewsData = await reviewsResponse.json();
        
        if (Array.isArray(reviewsData)) {
          setReviews(reviewsData as Review[]);
        } else {
          console.error("Reviews data is not an array:", reviewsData);
          setReviews([]);
        }

        // Fetch restaurants
        const restaurantsResponse = await fetch("/api/restaurants/location");
        const restaurantsData = await restaurantsResponse.json();
        
        if (Array.isArray(restaurantsData)) {
          setRestaurants(restaurantsData as Restaurant[]);
        } else {
          console.error("Restaurants data is not an array:", restaurantsData);
          setRestaurants([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        // Mock data for development
        setReviews([
          {
            id: "1",
            title: "It is what it is!",
            date: "March 24, 2024",
            upvotes: 5
          },
          {
            id: "2",
            title: "A little greasy",
            date: "March 24, 2025",
            upvotes: 3
          },
          {
            id: "3",
            title: "Better when warm",
            date: "March 24, 2025",
            upvotes: 2
          },
          {
            id: "4",
            title: "Spectacular!",
            date: "March 24, 2025",
            upvotes: 2
          }
        ]);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <Navbar />

      {/* Main Content */}
      <div className="dashboard-content">
        <h1 className="welcome-message">Welcome Back, John!</h1>

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
                <div className="review-card">
                  <div className="review-card-rate">
                    <span className="star-icon">★</span>
                    <span>4/5</span>
                  </div>
                  <p className="review-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc malesuam mauris justo, a ullamcorper. Mauris effector mauris mauris, sagittis bibortis sapien eleifend at.</p>
                  <div className="review-card-footer">
                    <span>6/5</span>
                    <span>Lisa B.</span>
                  </div>
                  <div className="restaurant-tag">Popeyes - Leicester</div>
                </div>
                
                <div className="review-card">
                  <div className="review-card-rate">
                    <span className="star-icon">★</span>
                    <span>3/5</span>
                  </div>
                  <p className="review-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc malesuam mauris justo, a ullamcorper. Mauris effector mauris mauris, sagittis bibortis sapien eleifend at.</p>
                  <div className="review-card-footer">
                    <span>1/5</span>
                    <span>Jane D.</span>
                  </div>
                  <div className="restaurant-tag">GRITH - Leicester</div>
                </div>
                
                <div className="review-card">
                  <div className="review-card-rate">
                    <span className="star-icon">★</span>
                    <span>5/5</span>
                  </div>
                  <p className="review-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc malesuam mauris justo, a ullamcorper. Mauris effector mauris mauris, sagittis bibortis sapien eleifend at.</p>
                  <div className="review-card-footer">
                    <span>6/5</span>
                    <span>Jamie G.</span>
                  </div>
                  <div className="restaurant-tag">Chil - Leicester</div>
                </div>
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
                <div className="restaurant-card">
                  <div className="restaurant-info">
                    <div className="restaurant-logo">
                      <img src="/restaurant1.jpg" alt="Restaurant" className="restaurant-image" />
                    </div>
                    <div className="restaurant-details">
                      <h3>KAI - Leicester</h3>
                      <p className="restaurant-category">Breakfast</p>
                      <p className="restaurant-description">KAI in Leicester specializes in breakfast and brunch, offering a delightful selection of American pancakes and brunch items. The spot's popular for its unique pancake mix!</p>
                    </div>
                  </div>
                  <div className="restaurant-actions">
                    <button className="check-out-btn">Check it out!</button>
                    <button className="write-review-btn">Write a review</button>
                  </div>
                </div>
                
                <div className="restaurant-card">
                  <div className="restaurant-info">
                    <div className="restaurant-logo">
                      <img src="/restaurant2.jpg" alt="Restaurant" className="restaurant-image" />
                    </div>
                    <div className="restaurant-details">
                      <h3>Fluffy Fluffy - Leicester</h3>
                      <p className="restaurant-category">Dessert</p>
                      <p className="restaurant-description">Fluss Fluss, means "fluffy fluffy". The UK's largest souffle pancake & dessert cafe. From breakfast to dinner, and everything in between. We aim to deliver happiness, one pancake at a time.</p>
                    </div>
                  </div>
                  <div className="restaurant-actions">
                    <button className="check-out-btn">Check it out!</button>
                    <button className="write-review-btn">Write a review</button>
                  </div>
                </div>
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
            
            {isLoading ? (
              <p>Loading your reviews...</p>
            ) : reviews.length > 0 ? (
              <div className="review-list">
                <div className="review-list-item">
                  <span className="review-number">1.</span>
                  <span className="review-title">It is what it is!</span>
                  <span className="review-date">March 24, 2024</span>
                  <div className="review-upvotes">
                    <span className="upvote-icon">👍</span>
                    <span>5 upvotes!</span>
                  </div>
                  <button className="edit-icon"><FontAwesomeIcon icon={faPencilAlt} /></button>
                </div>
                
                <div className="review-list-item">
                  <span className="review-number">2.</span>
                  <span className="review-title">A little greasy</span>
                  <span className="review-date">March 24, 2025</span>
                  <div className="review-upvotes">
                    <span className="upvote-icon">👍</span>
                    <span>3 upvotes!</span>
                  </div>
                  <button className="edit-icon"><FontAwesomeIcon icon={faPencilAlt} /></button>
                </div>
                
                <div className="review-list-item">
                  <span className="review-number">3.</span>
                  <span className="review-title">Better when warm</span>
                  <span className="review-date">March 24, 2025</span>
                  <div className="review-upvotes">
                    <span className="upvote-icon">👍</span>
                    <span>2 upvotes!</span>
                  </div>
                  <button className="edit-icon"><FontAwesomeIcon icon={faPencilAlt} /></button>
                </div>
                
                <div className="review-list-item">
                  <span className="review-number">4.</span>
                  <span className="review-title">Spectacular!</span>
                  <span className="review-date">March 24, 2025</span>
                  <div className="review-upvotes">
                    <span className="upvote-icon">👍</span>
                    <span>2 upvotes!</span>
                  </div>
                  <button className="edit-icon"><FontAwesomeIcon icon={faPencilAlt} /></button>
                </div>
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