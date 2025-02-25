import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create a single PrismaClient instance to be reused across requests
// This prevents connection pool exhaustion in development
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, prevent multiple instances during hot reloading
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

// Define types for search result items
type RestaurantResult = {
  id: string;
  name: string;
  type: "Restaurant";
  url: string;
};

type FoodItemResult = {
  id: string;
  name: string;
  type: "Food Item";
  restaurant: string;
  url: string;
};

type CategoryResult = {
  id: string;
  name: string;
  type: "Category";
  url: string;
};

type LocationResult = {
  id: string;
  name: string;
  type: "Location";
  restaurant: string;
  url: string;
};

type SearchResult = RestaurantResult | FoodItemResult | CategoryResult | LocationResult;

// Type for restaurant data with selected fields
type RestaurantData = {
  id: string;
  title: string;
  url: string;
  location?: string;
};

// Type for food item data with selected fields
type FoodItemData = {
  id: string;
  name: string;
  menuSection: {
    restaurant?: {
      title: string;
      url: string;
    } | null;
  };
};

// Type for category data with selected fields
type CategoryData = {
  id: string;
  category: string;
};

// Type for the location data with selected fields
type LocationData = {
  id: string;
  title: string;
  url: string;
  location: string;
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
                prisma.restaurant.findMany({
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
                    url: `/restaurants/${r.url}`,
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
                prisma.menuItem.findMany({
                    where: { name: { contains: query, mode: "insensitive" } },
                    select: { 
                        id: true, 
                        name: true, 
                        menuSection: { 
                            select: { 
                                restaurant: { 
                                    select: { title: true, url: true } 
                                } 
                            } 
                        } 
                    },
                    take: limit,
                }) as Promise<QueryResult>
            );
            
            const mealProcessor: ResultProcessor<FoodItemData> = (foodItems) =>
                foodItems.map((f) => ({
                    id: f.id,
                    name: f.name,
                    type: "Food Item" as const,
                    restaurant: f.menuSection.restaurant?.title || "Unknown Restaurant",
                    url: `/restaurants/${f.menuSection.restaurant?.url || ""}#${f.name.replace(/\s+/g, "-").toLowerCase()}`,
                }));
                
            resultsProcessors.push(mealProcessor as ResultProcessor<unknown>);
        } else {
            promises.push(Promise.resolve([] as QueryResult));
            resultsProcessors.push(() => [] as SearchResult[]);
        }
        
        // Only include categories search if the filter is enabled
        if (includeCategories) {
            promises.push(
                prisma.menuSection.findMany({
                    where: { category: { contains: query, mode: "insensitive" } },
                    select: { id: true, category: true },
                    take: limit,
                }) as Promise<QueryResult>
            );
            
            const categoryProcessor: ResultProcessor<CategoryData> = (categories) =>
                categories.map((c) => ({
                    id: c.id,
                    name: c.category,
                    type: "Category" as const,
                    url: `/reviews?category=${encodeURIComponent(c.category)}`,
                }));
                
            resultsProcessors.push(categoryProcessor as ResultProcessor<unknown>);
        } else {
            promises.push(Promise.resolve([] as QueryResult));
            resultsProcessors.push(() => [] as SearchResult[]);
        }
        
        // Only include locations search if the filter is enabled
        if (includeLocations) {
            promises.push(
                prisma.restaurant.findMany({
                    where: { location: { contains: query, mode: "insensitive" } },
                    select: { id: true, title: true, url: true, location: true },
                    take: limit,
                }) as Promise<QueryResult>
            );
            
            const locationProcessor: ResultProcessor<LocationData> = (locations) =>
                locations
                    .filter((l): l is LocationData & { location: string } => Boolean(l.location))
                    .map((l) => ({
                        id: `loc-${l.id}`,
                        name: l.location,
                        type: "Location" as const,
                        restaurant: l.title,
                        url: `/restaurants?location=${encodeURIComponent(l.location)}`,
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