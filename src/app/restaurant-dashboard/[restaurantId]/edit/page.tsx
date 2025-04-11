// src/app/restaurant-dashboard/[restaurantId]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faArrowLeft,
  faSpinner,
  faExclamationTriangle,
  faMapMarkerAlt,
  faUtensils,
  faTag,
  faGlobe,
  faLink
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
  createdAt: string;
  updatedAt: string;
}

// Category options based on common restaurant categories
const CATEGORY_OPTIONS: string[] = [
  "American", "Chinese", "Italian", "Mexican", "Indian", "Japanese", "Thai",
  "Mediterranean", "Greek", "French", "Korean", "Vietnamese", "Middle Eastern",
  "BBQ", "Seafood", "Steakhouse", "Pizza", "Burger", "Breakfast", "Brunch",
  "Cafe", "Bakery", "Dessert", "Vegan", "Vegetarian", "Gluten-Free", "Fusion",
  "Sushi", "Fast Food", "Fine Dining", "Food Truck", "Pub", "Bar", "Bistro"
];

// Interest options (these might overlap with categories but can be more specific food types)
const INTEREST_OPTIONS: string[] = [
  "Pizza", "Burger", "Pasta", "Steak", "Fried Chicken", "Sushi", "Ramen",
  "Tacos", "Curry", "Salad", "Sandwich", "Soup", "Seafood", "BBQ", "Brunch",
  "Dessert", "Coffee", "Tea", "Smoothie", "Juice", "Ice Cream", "Cake",
  "Healthy", "Vegan", "Vegetarian", "Gluten-Free", "Halal", "Kosher",
  "Spicy", "Sweet", "Savory", "Comfort Food", "Street Food", "Gourmet"
];

export default function EditRestaurantPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.restaurantId as string;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Restaurant>>({
    title: "",
    url: "",
    detail: "",
    location: "",
    category: [],
    interests: [],
    widerAreas: []
  });
  
  // Custom category/interest input
  const [newCategory, setNewCategory] = useState<string>("");
  const [newInterest, setNewInterest] = useState<string>("");
  const [newArea, setNewArea] = useState<string>("");
  
  // Fetch restaurant data on component mount
  useEffect(() => {
    const fetchRestaurantData = async (): Promise<void> => {
      if (!restaurantId) {
        console.error("No restaurantId found in URL params");
        return;
      }
      
      try {
        setIsLoading(true);
        setFetchError(null);
        
        console.log(`Fetching data for restaurant ID: ${restaurantId}`);
        
        // Add cache: 'no-store' to prevent caching issues
        const response = await fetch(`/api/restaurants/${restaurantId}/edit`, {
          cache: 'no-store',
          next: { revalidate: 0 } // Force revalidation
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch restaurant data: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Received restaurant data:", data);
        
        if (!data || typeof data !== 'object') {
          throw new Error("Invalid restaurant data received");
        }
        
        setRestaurant(data);
        
        // Initialize form data with restaurant data
        const formDataToSet = {
          title: data.title || "",
          url: data.url || "",
          detail: data.detail || "",
          location: data.location || "",
          category: Array.isArray(data.category) ? [...data.category] : [],
          interests: Array.isArray(data.interests) ? [...data.interests] : [],
          widerAreas: Array.isArray(data.widerAreas) ? [...data.widerAreas] : []
        };
        
        console.log("Setting form data:", formDataToSet);
        setFormData(formDataToSet);
        
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
        setFetchError(error instanceof Error ? error.message : "Failed to load restaurant data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [restaurantId]);
  
  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if exists
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Toggle category selection
  const handleCategoryToggle = (category: string): void => {
    setFormData((prev) => {
      const currentCategories = prev.category || [];
      return {
        ...prev,
        category: currentCategories.includes(category)
          ? currentCategories.filter(c => c !== category)
          : [...currentCategories, category]
      };
    });
  };
  
  // Toggle interest selection
  const handleInterestToggle = (interest: string): void => {
    setFormData((prev) => {
      const currentInterests = prev.interests || [];
      return {
        ...prev,
        interests: currentInterests.includes(interest)
          ? currentInterests.filter(i => i !== interest)
          : [...currentInterests, interest]
      };
    });
  };
  
  // Add custom category
  const handleAddCategory = (): void => {
    if (!newCategory.trim()) return;
    
    const category = newCategory.trim();
    setFormData((prev) => {
      const currentCategories = prev.category || [];
      if (!currentCategories.includes(category)) {
        return {
          ...prev,
          category: [...currentCategories, category]
        };
      }
      return prev;
    });
    
    setNewCategory("");
  };
  
  // Add custom interest
  const handleAddInterest = (): void => {
    if (!newInterest.trim()) return;
    
    const interest = newInterest.trim();
    setFormData((prev) => {
      const currentInterests = prev.interests || [];
      if (!currentInterests.includes(interest)) {
        return {
          ...prev,
          interests: [...currentInterests, interest]
        };
      }
      return prev;
    });
    
    setNewInterest("");
  };
  
  // Add wider area
  const handleAddArea = (): void => {
    if (!newArea.trim()) return;
    
    const area = newArea.trim();
    setFormData((prev) => {
      const currentAreas = prev.widerAreas || [];
      if (!currentAreas.includes(area)) {
        return {
          ...prev,
          widerAreas: [...currentAreas, area]
        };
      }
      return prev;
    });
    
    setNewArea("");
  };
  
  // Remove category
  const handleRemoveCategory = (category: string): void => {
    setFormData((prev) => ({
      ...prev,
      category: (prev.category || []).filter(c => c !== category)
    }));
  };
  
  // Remove interest
  const handleRemoveInterest = (interest: string): void => {
    setFormData((prev) => ({
      ...prev,
      interests: (prev.interests || []).filter(i => i !== interest)
    }));
  };
  
  // Remove wider area
  const handleRemoveArea = (area: string): void => {
    setFormData((prev) => ({
      ...prev,
      widerAreas: (prev.widerAreas || []).filter(a => a !== area)
    }));
  };
  
  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      errors.title = "Restaurant name is required";
    }
    
    if (formData.url && !isValidUrl(formData.url)) {
      errors.url = "Please enter a valid URL";
    }
    
    if (!formData.location?.trim()) {
      errors.location = "Location is required";
    }
    
    if (!formData.category || formData.category.length === 0) {
      errors.category = "At least one category is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Check if URL is valid
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty URL is valid (optional field)
    
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMessage(null);
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update restaurant");
      }
      
      // Show success message
      setSuccessMessage("Restaurant profile updated successfully!");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/restaurant-dashboard`);
      }, 1500);
      
    } catch (error) {
      console.error("Error updating restaurant:", error);
      setFormErrors({
        submit: error instanceof Error ? error.message : "Failed to update restaurant"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Display loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
        </div>
      </div>
    );
  }
  
  // Display error state
  if (fetchError || !restaurant) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
          <p>There was an error loading the restaurant data: {fetchError || "Restaurant not found"}</p>
          <button 
            onClick={() => router.back()}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()}
          className="mr-4 p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Edit Restaurant Profile</h1>
          <p className="text-gray-600">{restaurant.title}</p>
        </div>
      </div>
      
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 p-4 rounded-xl text-green-600 mb-6 flex items-center">
          <FontAwesomeIcon icon={faStore} className="mr-2" />
          <p>{successMessage}</p>
        </div>
      )}
      
      {/* Form submission error */}
      {formErrors.submit && (
        <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
          <p>{formErrors.submit}</p>
        </div>
      )}
      
      {/* Edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Restaurant Name */}
          <div className="col-span-1">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faStore} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title || ""}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border ${formErrors.title ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                placeholder="Restaurant name"
              />
            </div>
            {formErrors.title && (
              <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
            )}
          </div>
          
          {/* Restaurant URL */}
          <div className="col-span-1">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faLink} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="url"
                name="url"
                value={formData.url || ""}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border ${formErrors.url ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                placeholder="https://example.com"
              />
            </div>
            {formErrors.url && (
              <p className="mt-1 text-sm text-red-600">{formErrors.url}</p>
            )}
          </div>
          
          {/* Location */}
          <div className="col-span-1">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location || ""}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border ${formErrors.location ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]`}
                placeholder="123 Main St, City, State"
              />
            </div>
            {formErrors.location && (
              <p className="mt-1 text-sm text-red-600">{formErrors.location}</p>
            )}
          </div>
          
          {/* Wider Areas */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wider Areas
            </label>
            <div className="flex">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faGlobe} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                  placeholder="Add wider area (e.g., Downtown, West Side)"
                />
              </div>
              <button
                type="button"
                onClick={handleAddArea}
                className="px-4 py-2 bg-[#dab9f8] text-white rounded-r-md hover:bg-[#c9a2f2]"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(formData.widerAreas || []).map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#f1eafe] text-gray-700"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => handleRemoveArea(area)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          {/* Description */}
          <div className="col-span-2">
            <label htmlFor="detail" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="detail"
              name="detail"
              value={formData.detail || ""}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
              placeholder="Describe the restaurant..."
            />
          </div>
        </div>
        
        {/* Categories Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Categories *</h3>
            <div className="flex">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="mr-2 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                placeholder="Add custom category"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-1 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2]"
              >
                Add
              </button>
            </div>
          </div>
          
          {formErrors.category && (
            <p className="mt-1 text-sm text-red-600 mb-2">{formErrors.category}</p>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
            {CATEGORY_OPTIONS.map((category) => {
              const isSelected = (formData.category || []).includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-[#dab9f8] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
          
          {/* Selected custom categories */}
          <div className="mt-2 flex flex-wrap gap-2">
            {(formData.category || [])
              .filter(cat => !CATEGORY_OPTIONS.includes(cat))
              .map(category => (
                <span
                  key={category}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#fbe9fc] text-gray-700"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(category)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </span>
              ))
            }
          </div>
        </div>
        
        {/* Interests Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Food Interests</h3>
            <div className="flex">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                className="mr-2 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                placeholder="Add custom interest"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="px-3 py-1 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2]"
              >
                Add
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
            {INTEREST_OPTIONS.map((interest) => {
              const isSelected = (formData.interests || []).includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-[#f9c3c9] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
          
          {/* Selected custom interests */}
          <div className="mt-2 flex flex-wrap gap-2">
            {(formData.interests || [])
              .filter(int => !INTEREST_OPTIONS.includes(int))
              .map(interest => (
                <span
                  key={interest}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#fdedf6] text-gray-700"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </span>
              ))
            }
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="mt-8 flex justify-end gap-4">
          <Link
            href={`/restaurant-dashboard/${restaurantId}`}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#dab9f8] text-white rounded-md hover:bg-[#c9a2f2] disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}