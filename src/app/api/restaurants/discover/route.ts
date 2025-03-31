/*eslint-disable*/
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
    
    console.log("Restaurant Discovery API: Received parameters", {
      limit,
      page,
      skip,
      interests: interestsParam,
      sort
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
    
    // Build query based on sort type
    let orderBy: Prisma.RestaurantOrderByWithRelationInput = {};
    const whereClause: Prisma.RestaurantWhereInput = {};
    
    // For 'relevance' sorting, prioritize restaurants that match user interests
    if (sort === "relevance" && userInterests.length > 0) {
      // Use interests to filter restaurants
      console.log("Restaurant Discovery API: Using relevance-based sorting");
      
      // Filter for restaurants that contain at least one matching interest
      whereClause.OR = [
        { 
          interests: { 
            hasSome: userInterests 
          } 
        },
        { 
          category: { 
            hasSome: userInterests 
          } 
        }
      ];
      
      // Sort by the most reviews for "relevant" restaurants
      orderBy = { 
        num_reviews: 'desc' 
      };
      
    } else if (sort === "newest") {
      // For 'newest' sorting, get most recently added restaurants
      console.log("Restaurant Discovery API: Using newest-based sorting");
      orderBy = { 
        createdAt: 'desc' 
      };
    } else {
      // Default sorting by rating
      console.log("Restaurant Discovery API: Using default rating-based sorting");
      orderBy = { 
        rating: 'desc' 
      };
    }
    
    console.log("Restaurant Discovery API: Executing query with:", {
      where: whereClause,
      orderBy,
      skip,
      take: limit
    });
    
    // Fetch restaurants with proper sorting and filtering
    // Include _count to get the review count for each restaurant
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
        _count: {
          select: {
            reviews: true
          }
        }
      }
    });
    
    console.log(`Restaurant Discovery API: Found ${restaurants.length} restaurants`);
    
    // Get total count for pagination
    const totalCount = await db.restaurant.count({
      where: whereClause
    });
    
    // Format response
    return NextResponse.json({
      restaurants,
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