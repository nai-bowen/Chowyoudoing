// src/app/api/restaurants/discover/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("Restaurant Discovery API: Beginning request processing");
    
    // Get the session to check if a user is logged in
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("Restaurant Discovery API: Unauthorized access attempt");
      return NextResponse.json(
        { error: "Unauthorized. Please log in to access discovery." },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 12;
    const page = Number(url.searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;
    const interestsParam = url.searchParams.getAll("interests");
    const sort = url.searchParams.get("sort") || "relevance";
    
    // Get location parameter (city name)
    const cityName = url.searchParams.get("cityName") || null;
    
    console.log("Restaurant Discovery API: Received parameters", {
      limit,
      page,
      skip,
      interests: interestsParam,
      sort,
      location: { cityName }
    });
    
    // If no interests were provided in query params, get them from the user's profile
    let userInterests: string[] = interestsParam;
    
    if (interestsParam.length === 0 && sort === "relevance") {
      // Fetch user interests from their profile
      const patron = await db.patron.findUnique({
        where: { id: session.user.id },
        select: { interests: true }
      });
      
      userInterests = patron?.interests || [];
      console.log("Restaurant Discovery API: Retrieved user interests:", userInterests);
    }
    
    // Build query based on sort type and location
    let orderBy: Prisma.RestaurantOrderByWithRelationInput = {};
    let whereClause: Prisma.RestaurantWhereInput = {};
    
    // Location-based filtering
    const locationConditions: Prisma.RestaurantWhereInput[] = [];
    
    if (cityName) {
      // Match restaurants with this city in their widerAreas array
      locationConditions.push({
        widerAreas: {
          has: cityName
        }
      });
      
      // Match restaurants where the location contains the city name
      locationConditions.push({
        location: {
          contains: cityName,
          mode: 'insensitive'
        }
      });
    }
    
    // Create a comprehensive query based on interests and location
    if (sort === "relevance") {
      const conditions: Prisma.RestaurantWhereInput[] = [];

      // Priority 1: Match both interests AND location
      if (userInterests.length > 0 && locationConditions.length > 0) {
        conditions.push({
          AND: [
            {
              OR: [
                { interests: { hasSome: userInterests } },
                { category: { hasSome: userInterests } }
              ]
            },
            { OR: locationConditions }
          ]
        });
      }

      // Priority 2: Match location only
      if (locationConditions.length > 0) {
        conditions.push({ OR: locationConditions });
      }
      
      // Priority 3: Match interests only
      if (userInterests.length > 0) {
        conditions.push({
          OR: [
            { interests: { hasSome: userInterests } },
            { category: { hasSome: userInterests } }
          ]
        });
      }
      
      // Combine all conditions with OR
      whereClause = conditions.length > 0 ? { OR: conditions } : {};
      
      // Default ordering by ratings
      orderBy = {
        rating: 'desc'
      };
    } else if (sort === "newest") {
      // For 'newest' sorting, get most recently added restaurants
      orderBy = { 
        createdAt: 'desc' 
      };
      
      // Still apply location filter if available
      if (locationConditions.length > 0) {
        whereClause.OR = locationConditions;
      }
    } else {
      // Default sorting by rating
      orderBy = { 
        rating: 'desc' 
      };
      
      // Still apply location filter if available
      if (locationConditions.length > 0) {
        whereClause.OR = locationConditions;
      }
    }
    
    console.log("Restaurant Discovery API: Executing query with:", {
      where: whereClause,
      orderBy,
      skip,
      take: limit
    });
    
    // Fetch restaurants with proper sorting and filtering
    const restaurants = await db.restaurant.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        location: true,
        detail: true,
        category: true,
        rating: true,
        num_reviews: true,
        interests: true,
        widerAreas: true,
        _count: {
          select: {
            reviews: true
          }
        }
      }
    });
    
    // Add isNearby property based on widerAreas or location matching cityName
    let processedRestaurants = restaurants;
    
    if (cityName) {
      processedRestaurants = restaurants.map(restaurant => {
        const isLocationMatch = restaurant.location?.toLowerCase().includes(cityName.toLowerCase());
        const isWiderAreaMatch = restaurant.widerAreas.includes(cityName);
        
        // Add a new property to indicate if this restaurant is in the user's area
        return {
          ...restaurant,
          isNearby: isLocationMatch || isWiderAreaMatch
        };
      });
      
      // Sort restaurants to prioritize nearby ones first
      if (sort === "relevance") {
        processedRestaurants.sort((a: any, b: any) => {
          // Nearby restaurants come first
          if (a.isNearby && !b.isNearby) return -1;
          if (!a.isNearby && b.isNearby) return 1;
          
          // Then sort by rating
          return parseFloat(b.rating) - parseFloat(a.rating);
        });
      }
    }
    
    console.log(`Restaurant Discovery API: Found ${processedRestaurants.length} restaurants`);
    
    // Get total count for pagination
    const totalCount = await db.restaurant.count({
      where: whereClause
    });
    
    // Format response
    return NextResponse.json({
      restaurants: processedRestaurants,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error("Restaurant Discovery API: Error:", error);
    return NextResponse.json({
      error: "Failed to fetch restaurant discovery data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}