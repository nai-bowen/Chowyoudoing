/*eslint-disable*/
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUtensils, 
  faPlus, 
  faPencilAlt, 
  faTrash,
  faSearch,
  faChevronDown,
  faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import AddEditMenuSectionModal from "./AddEditMenuSectionModal";
import AddEditMenuItemModal from "./AddEditMenuItemModal";

// Define interfaces for the menu data
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
  totalUpvotes: number;
  menuSectionId: string;
  interestId: string | null;
  interest: Interest | null;
}

interface MenuSection {
  id: string;
  category: string;
  restaurantId: string;
  interestId: string | null;
  interest: Interest | null;
  items: MenuItem[];
}

interface MenuManagementProps {
  restaurantId: string;
}

export default function MenuManagement({ restaurantId }: MenuManagementProps): JSX.Element {
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // State for section modal
  const [isSectionModalOpen, setIsSectionModalOpen] = useState<boolean>(false);
  const [selectedSection, setSelectedSection] = useState<MenuSection | null>(null);
  
  // State for item modal
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  // Fetch menu sections and items for the restaurant
  const fetchMenuData = useCallback(async (): Promise<void> => {
    if (!restaurantId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/restaurateur/menu-sections?restaurantId=${restaurantId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch menu data");
      }
      
      const data = await response.json() as MenuSection[];
      setMenuSections(data);
      
      // Set all sections as expanded initially
      const newExpandedSections: Record<string, boolean> = {};
      data.forEach(section => {
        newExpandedSections[section.id] = true;
      });
      setExpandedSections(newExpandedSections);
    } catch (err) {
      console.error("Error fetching menu data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  // Fetch interests
  const fetchInterests = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/restaurateur/interests");
      
      if (!response.ok) {
        throw new Error("Failed to fetch interests");
      }
      
      const data = await response.json() as Interest[];
      setInterests(data);
    } catch (err) {
      console.error("Error fetching interests:", err);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchMenuData();
    fetchInterests();
  }, [fetchMenuData, fetchInterests]);

  // Toggle section expansion
  const toggleSectionExpansion = (sectionId: string): void => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Open add section modal
  const handleAddSection = (): void => {
    setSelectedSection(null);
    setIsSectionModalOpen(true);
  };

  // Open edit section modal
  const handleEditSection = (section: MenuSection): void => {
    setSelectedSection(section);
    setIsSectionModalOpen(true);
  };

  // Handle section modal close
  const handleSectionModalClose = (): void => {
    setIsSectionModalOpen(false);
    setSelectedSection(null);
  };

  // Handle section modal save
  const handleSectionSave = async (sectionData: { 
    category: string;
    interestId: string | null; 
  }): Promise<void> => {
    try {
      if (selectedSection) {
        // Update existing section
        const response = await fetch(`/api/restaurateur/menu-sections/${selectedSection.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sectionData),
        });
        
        if (!response.ok) {
          throw new Error("Failed to update menu section");
        }
      } else {
        // Create new section
        const response = await fetch("/api/restaurateur/menu-sections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...sectionData,
            restaurantId,
          }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to create menu section");
        }
      }
      
      // Refresh menu data
      fetchMenuData();
      handleSectionModalClose();
    } catch (err) {
      console.error("Error saving menu section:", err);
      alert(err instanceof Error ? err.message : "Failed to save menu section");
    }
  };

  // Handle section delete
  const handleDeleteSection = async (sectionId: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this section? All items in this section will also be deleted.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/restaurateur/menu-sections/${sectionId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete menu section");
      }
      
      // Refresh menu data
      fetchMenuData();
    } catch (err) {
      console.error("Error deleting menu section:", err);
      alert(err instanceof Error ? err.message : "Failed to delete menu section");
    }
  };

  // Open add item modal
  const handleAddItem = (sectionId: string): void => {
    setSelectedItem(null);
    setSelectedSectionId(sectionId);
    setIsItemModalOpen(true);
  };

  // Open edit item modal
  const handleEditItem = (item: MenuItem): void => {
    setSelectedItem(item);
    setSelectedSectionId(item.menuSectionId);
    setIsItemModalOpen(true);
  };

  // Handle item modal close
  const handleItemModalClose = (): void => {
    setIsItemModalOpen(false);
    setSelectedItem(null);
    setSelectedSectionId("");
  };

  // Handle item modal save
  const handleItemSave = async (itemData: {
    name: string;
    description: string | null;
    price: string;
    interestId: string | null;
  }): Promise<void> => {
    try {
      if (selectedItem) {
        // Update existing item
        console.log("Updating menu item:", selectedItem.id, itemData);
        
        const response = await fetch(`/api/restaurateur/menu-items/${selectedItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...itemData,
            menuSectionId: selectedSectionId, // Ensure we include the sectionId
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update menu item");
        }
      } else {
        // Create new item
        const response = await fetch("/api/restaurateur/menu-items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...itemData,
            menuSectionId: selectedSectionId,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create menu item");
        }
      }
      
      // Refresh menu data
      fetchMenuData();
      handleItemModalClose();
    } catch (err) {
      console.error("Error saving menu item:", err);
      alert(err instanceof Error ? err.message : "Failed to save menu item");
    }
  };

  // Handle item delete
  const handleDeleteItem = async (itemId: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/restaurateur/menu-items/${itemId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete menu item");
      }
      
      // Refresh menu data
      fetchMenuData();
    } catch (err) {
      console.error("Error deleting menu item:", err);
      alert(err instanceof Error ? err.message : "Failed to delete menu item");
    }
  };

  // Filter menu items based on search query
  const filteredMenuSections = menuSections.map(section => {
    // Filter items in this section
    const filteredItems = section.items.filter(item => {
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    });
    
    // Return a copy of the section with filtered items
    return {
      ...section,
      items: filteredItems
    };
  }).filter(section => {
    // If search query is active, only show sections with matching items
    return searchQuery === "" || section.items.length > 0;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2d36e]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-xl text-red-600 mb-6">
        <p>There was an error loading the menu: {error}</p>
        <p className="mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with search and add category button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Menu Management</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f2d36e]"
            />
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          
          <button 
            onClick={handleAddSection}
            className="flex items-center gap-2 px-4 py-2 bg-[#f2d36e] text-white rounded-full hover:bg-[#e6c860] transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
            Add Category
          </button>
        </div>
      </div>
      
      {/* Menu Sections */}
      {filteredMenuSections.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-xl">
          <FontAwesomeIcon icon={faUtensils} className="text-4xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No menu items found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery 
              ? "Try a different search term or clear your search."
              : "Start by adding your first menu category."}
          </p>
          {!searchQuery && (
            <button 
              onClick={handleAddSection}
              className="px-6 py-3 bg-[#f2d36e] text-white rounded-full hover:bg-[#e6c860] transition-colors"
            >
              Add First Category
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredMenuSections.map((section) => (
            <div key={section.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Section Header */}
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleSectionExpansion(section.id)}>
                  <FontAwesomeIcon 
                    icon={expandedSections[section.id] ? faChevronUp : faChevronDown} 
                    className="text-gray-500"
                  />
                  <h3 className="font-semibold text-lg flex items-center">
                    {section.category}
                    {section.interest && (
                      <span className="ml-2 text-xs bg-[#faf2e5] text-[#a58a62] px-2 py-1 rounded-full">
                        {section.interest.name}
                      </span>
                    )}
                  </h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleAddItem(section.id)}
                    className="text-sm px-3 py-1 bg-[#dab9f8] text-white rounded-full hover:bg-[#c9a2f2] transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-1" />
                    Add Item
                  </button>
                  <button 
                    onClick={() => handleEditSection(section)}
                    className="p-2 text-gray-600 hover:text-[#f3b4eb]"
                  >
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </button>
                  <button 
                    onClick={() => handleDeleteSection(section.id)}
                    className="p-2 text-gray-600 hover:text-red-500"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              
              {/* Section Items */}
              {expandedSections[section.id] && (
                <div className="divide-y divide-gray-100">
                  {section.items.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No items in this category. Click "Add Item" to add your first menu item.
                    </div>
                  ) : (
                    section.items.map((item) => (
                      <div key={item.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium">{item.name}</h4>
                              <span className="text-[#f2d36e] font-medium">{item.price}</span>
                            </div>
                            
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            
                            <div className="flex items-center mt-2 gap-2">
                              {item.interest && (
                                <span className="text-xs bg-[#faf2e5] text-[#a58a62] px-2 py-1 rounded-full">
                                  {item.interest.name}
                                </span>
                              )}
                              
                              {item.totalUpvotes > 0 && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  {item.totalUpvotes} upvotes
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-start ml-4">
                            <button 
                              onClick={() => handleEditItem(item)}
                              className="p-2 text-gray-600 hover:text-[#f3b4eb]"
                            >
                              <FontAwesomeIcon icon={faPencilAlt} />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-gray-600 hover:text-red-500"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Modals */}
      <AddEditMenuSectionModal
        isOpen={isSectionModalOpen}
        onClose={handleSectionModalClose}
        onSave={handleSectionSave}
        section={selectedSection}
        interests={interests}
      />
      
      <AddEditMenuItemModal
        isOpen={isItemModalOpen}
        onClose={handleItemModalClose}
        onSave={handleItemSave}
        item={selectedItem}
        interests={interests}
      />
    </div>
  );
}