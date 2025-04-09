// src/app/_components/AddEditMenuSectionModal.tsx
"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface Interest {
  id: string;
  name: string;
}

interface MenuSection {
  id: string;
  category: string;
  restaurantId: string;
  interestId: string | null;
  interest: Interest | null;
}

interface AddEditMenuSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { category: string; interestId: string | null }) => Promise<void>;
  section: MenuSection | null;
  interests: Interest[];
}

export default function AddEditMenuSectionModal({
  isOpen,
  onClose,
  onSave,
  section,
  interests
}: AddEditMenuSectionModalProps): JSX.Element | null {
  const [category, setCategory] = useState<string>("");
  const [interestId, setInterestId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial values when section changes
  useEffect(() => {
    if (section) {
      setCategory(section.category);
      setInterestId(section.interestId || "");
    } else {
      setCategory("");
      setInterestId("");
    }
    setError(null);
  }, [section]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Validate form
    if (!category.trim()) {
      setError("Category name is required");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSave({
        category: category.trim(),
        interestId: interestId || null,
      });
    } catch (err) {
      console.error("Error saving menu section:", err);
      setError(err instanceof Error ? err.message : "Failed to save menu section");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#faf2e5] px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {section ? "Edit Category" : "Add New Category"}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                placeholder="e.g., Appetizers, Main Courses, Desserts"
                required
              />
            </div>
            
            <div className="mb-5">
              <label htmlFor="interestId" className="block text-sm font-medium text-gray-700 mb-1">
                Food Interest (Optional)
              </label>
              <select
                id="interestId"
                value={interestId}
                onChange={(e) => setInterestId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
              >
                <option value="">None</option>
                {interests.map((interest) => (
                  <option key={interest.id} value={interest.id}>
                    {interest.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Associating a food interest helps with restaurant recommendations.
              </p>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#dab9f8] text-white rounded-lg hover:bg-[#c9a2f2] disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : section ? "Update Category" : "Add Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}