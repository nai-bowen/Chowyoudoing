// src/app/_components/AddEditMenuItemModal.tsx
"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface Interest {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  img_url: string | null;
  status: string;
  menuSectionId: string;
  interestId: string | null;
}

interface AddEditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string | null;
    price: string;
    status: string;
    interestId: string | null;
  }) => Promise<void>;
  item: MenuItem | null;
  interests: Interest[];
}

export default function AddEditMenuItemModal({
  isOpen,
  onClose,
  onSave,
  item,
  interests
}: AddEditMenuItemModalProps): JSX.Element | null {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [status, setStatus] = useState<string>("available");
  const [interestId, setInterestId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial values when item changes
  useEffect(() => {
    if (item) {
      console.log("Editing item:", item); // Debug log
      setName(item.name);
      setDescription(item.description || "");
      setPrice(item.price);
      setStatus(item.status);
      setInterestId(item.interestId || "");
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setStatus("available");
      setInterestId("");
    }
    setError(null);
  }, [item]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Validate form
    if (!name.trim()) {
      setError("Item name is required");
      return;
    }
    
    if (!price.trim()) {
      setError("Price is required");
      return;
    }
    
    // Validate price format
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    if (!priceRegex.test(price)) {
      setError("Price must be a valid number (e.g., 12.99)");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        price: price.trim(),
        status,
        interestId: interestId || null,
      });
    } catch (err) {
      console.error("Error saving menu item:", err);
      setError(err instanceof Error ? err.message : "Failed to save menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#fdedf6] px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {item ? "Edit Menu Item" : "Add New Menu Item"}
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                placeholder="e.g., Bruschetta, Truffle Pasta"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8] resize-none"
                placeholder="Describe your menu item..."
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="text"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
                placeholder="e.g., 12.99"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#dab9f8]"
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            
            <div className="mb-5">
              <label htmlFor="itemInterestId" className="block text-sm font-medium text-gray-700 mb-1">
                Food Interest (Optional)
              </label>
              <select
                id="itemInterestId"
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
                Associating a food interest helps with item recommendations.
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
                {isSubmitting ? "Saving..." : item ? "Update Item" : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

