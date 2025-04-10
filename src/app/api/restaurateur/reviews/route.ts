// src/app/api/restaurateur/reviews/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

// src/app/api/restaurateur/reviews/route.ts
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const restaurantId = url.searchParams.get("restaurantId");
    const restaurantIds = url.searchParams.getAll("restaurantId"); // Note: can have multiple with same param name
    
    console.log(`GET /api/restaurateur/reviews - restaurantIds: ${restaurantIds.join(', ')}`);
    
    if (restaurantIds.length === 0 && !restaurantId) {
      return NextResponse.json({ error: "At least one restaurantId is required" }, { status: 400 });
    }

    // Build the filter with all restaurant IDs
    const allIds = restaurantId ? [...restaurantIds, restaurantId] : restaurantIds;
    const reviewsFilters = {
      restaurantId: {
        in: allIds,
      },
    };
    
    console.log(`Applying review filters:`, JSON.stringify(reviewsFilters));
    
    const reviews = await db.review.findMany({
      where: reviewsFilters,
      include: {
        patron: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    console.log(`Found ${reviews.length} reviews matching filters`);
    
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      content: review.content,
      rating: review.rating,
      upvotes: review.upvotes,
      createdAt: review.createdAt.toISOString(),
      restaurantId: review.restaurantId,
      restaurantTitle: review.restaurant.title,
      restaurantResponse: review.restaurantResponse,
      patron: review.isAnonymous ? null : {
        id: review.patron.id,
        firstName: review.patron.firstName,
        lastName: review.patron.lastName,
      },
      isAnonymous: review.isAnonymous,
    }));

    return NextResponse.json({ reviews: formattedReviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}