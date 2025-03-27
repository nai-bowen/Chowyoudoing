/*eslint-disable*/
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { db } from "@/server/db"; // Use existing db instance

// Define types for search result items
type RestaurantResult = {
  id: string;
  name: string;
  type: "Restaurant";
  url?: string;
};

type FoodItemResult = {
  id: string;
  name: string;
  type: "Food Item";
  restaurant?: string;
  restaurantId?: string; // Add restaurant ID for direct linking
  url?: string;
};

type CategoryResult = {
  id: string;
  name: string;
  type: "Category";
  url?: string;
};

type LocationResult = {
  id: string;
  name: string;
  type: "Location";
  restaurant?: string;
  url?: string;
};

type SearchResult = RestaurantResult | FoodItemResult | CategoryResult | LocationResult;

// Type for restaurant data with selected fields
type RestaurantData = {
  id: string;
  title: string;
  url?: string;
  location?: string;
};

// Type for food item data with selected fields
type FoodItemData = {
  id: string;
  name: string;
  menuSection: {
    restaurant?: {
      id: string;
      title: string;
      url?: string;
    } | null;
  };
};

// Define a generic type for result processors
type ResultProcessor<T> = (data: T[]) => SearchResult[];

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    
    // Get filter parameters (convert string to boolean)
    const includeRestaurants = searchParams.get("restaurants") !== "false";
    const includeMeals = searchParams.get("meals") !== "false";
    const includeCategories = searchParams.get("categories") !== "false";
    const includeLocations = searchParams.get("locations") !== "false";
    
    // Set a minimum query length to prevent excessive searches
    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    try {
        // Limit results per category
        const limit = 5;
        
        // Create arrays to store our promises and processors
        type QueryResult = unknown[];
        const promises: Promise<QueryResult>[] = [];
        const resultsProcessors: ResultProcessor<unknown>[] = [];
        
        // Only include restaurant search if the filter is enabled
        if (includeRestaurants) {
            promises.push(
                db.restaurant.findMany({
                    where: { title: { contains: query, mode: "insensitive" } },
                    select: { id: true, title: true, url: true },
                    take: limit,
                }) as Promise<QueryResult>
            );
            
            const restaurantProcessor: ResultProcessor<RestaurantData> = (restaurants) => 
                restaurants.map((r) => ({
                    id: r.id,
                    name: r.title,
                    type: "Restaurant" as const,
                    url: r.url // Use the URL if available
                }));
                
            resultsProcessors.push(restaurantProcessor as ResultProcessor<unknown>);
        } else {
            // Push empty array if filter is disabled to maintain array indexes
            promises.push(Promise.resolve([] as QueryResult));
            resultsProcessors.push(() => [] as SearchResult[]);
        }
        
        // Only include meals search if the filter is enabled
        if (includeMeals) {
            promises.push(
                db.menuItem.findMany({
                    where: { name: { contains: query, mode: "insensitive" } },
                    select: { 
                        id: true, 
                        name: true, 
                        menuSection: { 
                            select: { 
                                restaurant: { 
                                    select: { id: true, title: true, url: true } 
                                } 
                            } 
                        } 
                    },
                    take: limit,
                }) as Promise<QueryResult>
            );
            
            const mealProcessor: ResultProcessor<FoodItemData> = (foodItems) =>
                foodItems.map((f) => {
                    const restaurant = f.menuSection.restaurant;
                    
                    // Create a proper anchor link with the menu item name
                    const itemAnchor = f.name.replace(/\s+/g, "-").toLowerCase();
                    
                    return {
                        id: f.id,
                        name: f.name,
                        type: "Food Item" as const,
                        restaurant: restaurant?.title || "Unknown Restaurant",
                        restaurantId: restaurant?.id, // Include restaurant ID for direct linking
                        // Return the restaurant ID as this will be used in the component
                        url: restaurant?.id || ""
                    };
                });
                
            resultsProcessors.push(mealProcessor as ResultProcessor<unknown>);
        } else {
            promises.push(Promise.resolve([] as QueryResult));
            resultsProcessors.push(() => [] as SearchResult[]);
        }
        
        // Only include categories search if the filter is enabled
        if (includeCategories) {
            promises.push(
                db.menuSection.findMany({
                    where: { category: { contains: query, mode: "insensitive" } },
                    select: { id: true, category: true },
                    take: limit,
                    distinct: ['category'] // Only get unique categories
                }) as Promise<QueryResult>
            );
            
            const categoryProcessor: ResultProcessor<any> = (categories) =>
                categories.map((c) => ({
                    id: c.id,
                    name: c.category,
                    type: "Category" as const,
                    url: `/patron-search?category=${encodeURIComponent(c.category)}`,
                }));
                
            resultsProcessors.push(categoryProcessor as ResultProcessor<unknown>);
        } else {
            promises.push(Promise.resolve([] as QueryResult));
            resultsProcessors.push(() => [] as SearchResult[]);
        }
        
        // Only include locations search if the filter is enabled
        if (includeLocations) {
            promises.push(
                db.restaurant.findMany({
                    where: { location: { contains: query, mode: "insensitive" } },
                    select: { id: true, title: true, url: true, location: true },
                    take: limit,
                }) as Promise<QueryResult>
            );
            
            const locationProcessor: ResultProcessor<any> = (locations) =>
                locations
                    .filter((l) => Boolean(l.location))
                    .map((l) => ({
                        id: `loc-${l.id}`,
                        name: l.location,
                        type: "Location" as const,
                        restaurant: l.title,
                        url: `/patron-search?location=${encodeURIComponent(l.location)}`,
                    }));
                
            resultsProcessors.push(locationProcessor as ResultProcessor<unknown>);
        } else {
            promises.push(Promise.resolve([] as QueryResult));
            resultsProcessors.push(() => [] as SearchResult[]);
        }
        
        // Run all active queries in parallel for better performance
        const queryResults = await Promise.all(promises);
        
        // Process results outside of database queries
        let results: SearchResult[] = [];
        
        // Safely process results with type checking
        for (let i = 0; i < queryResults.length; i++) {
            const processor = resultsProcessors[i];
            const result = queryResults[i];
            
            if (processor && result) {
                const processedResults = processor(result);
                results = [...results, ...processedResults];
            }
        }

        // Limit total results to prevent overloading the UI
        return NextResponse.json({ 
            results: results.slice(0, 15),
            totalCount: results.length
        });
        
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
    }
}