"use client";

import { useEffect, useState } from "react";

import Navbar from "../_components/navbar";

interface Review {
  id: string;
  title: string;
  date: string;
  upvotes: number;
}

interface Restaurant {
  id: string;
  title: string;
  location: string;
}

export default function PatronDashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data: Review[]) => setReviews(data))
      .catch((err) => console.error("Error fetching reviews:", err));

    fetch("/api/restaurants/location")
      .then((res) => res.json())
      .then((data: Restaurant[]) => setRestaurants(data))
      .catch((err) => console.error("Error fetching restaurant data:", err));
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
          <h2><i className="fas fa-fire"></i> Hot Reviews</h2>
          <p>Here are some reviews in your area!</p>
          <div className="reviews-container">
            {reviews.length ? reviews.map(review => (
              <div key={review.id} className="review-card">
                <p className="review-text">{review.title}</p>
                <p className="review-date">{review.date}</p>
                <p className="review-votes">{review.upvotes} upvotes</p>
              </div>
            )) : <p className="no-reviews">No reviews yet! How about writing one?</p>}
          </div>
        </section>

        {/* Top Menus Section */}
        <section className="top-menus">
          <h2><i className="fas fa-star"></i> Top Menus</h2>
          <p>Menus that match your interest based on what you’ve told us!</p>
          <div className="restaurant-list">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="restaurant-card">
                <div>
                  <h3>{restaurant.title}</h3>
                  <p>{restaurant.location}</p>
                </div>
                <button className="check-out-btn">Check it out!</button>
                <button className="write-review-btn">Write a review</button>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Section: Reviews & Map */}
        <div className="bottom-section">
          <section className="your-reviews">
            <h2><i className="fas fa-book-open"></i> Your Reviews</h2>
            <p>Some of your reviews are gaining traction! Have a look...</p>
            {reviews.length ? reviews.map((review, index) => (
              <div key={review.id} className="review-list-item">
                <span>{index + 1}. {review.title}</span>
                <span>{review.date}</span>
                <span>{review.upvotes} upvotes!</span>
              </div>
            )) : <p className="no-reviews">No reviews yet! Start by writing one.</p>}
          </section>

          {/* Your Area (Google Maps) */}
          <section className="your-area">
            <h2><i className="fas fa-map-marker-alt"></i> Your Area</h2>
            <p>Put it on a map! Look at the reviews near you.</p>
            <iframe
              src={`https://www.google.com/maps/embed/v1/search?q=${encodeURIComponent(restaurants[0]?.location ?? "Leicester")}&key=YOUR_GOOGLE_MAPS_API_KEY`}
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
