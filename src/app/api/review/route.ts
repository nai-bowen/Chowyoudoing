/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

// GET handler - handles both general reviews and user-specific reviews
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("Reviews API: Beginning GET request processing");
    
    // Get the query parameters
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 10;
    const page = Number(url.searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;
    const userId = url.searchParams.get("userId");
    
    // Check if this is a request for user-specific reviews
    if (userId) {
      console.log(`Reviews API: Fetching reviews for specific user ID: ${userId}`);
      return await getUserReviews(userId);
    }
    
    // Otherwise, get server session in case we need the current user's reviews
    const session = await getServerSession(authOptions);
    const userFilter = url.searchParams.get("userReviews") === "true";
    
    // If userReviews=true in query and we have a session, get the current user's reviews
    if (userFilter && session?.user?.id) {
      console.log(`Reviews API: Fetching reviews for current user: ${session.user.id}`);
      return await getUserReviews(session.user.id);
    }
    
    // Otherwise, fetch general reviews
    console.log(`Reviews API: Fetching general reviews with pagination: limit=${limit}, page=${page}, skip=${skip}`);
    
    // Fetch reviews WITH the related restaurant data
    const reviews = await db.review.findMany({
      select: {
        id: true,
        content: true,
        rating: true,
        createdAt: true,
        upvotes: true,
        patron: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        restaurant: {  // Include the related restaurant
          select: {
            title: true,
            location: true
          }
        }
      },
      orderBy: {
        upvotes: 'desc'
      },
      take: limit,
      skip: skip
    });
    
    console.log(`Reviews API: Found ${reviews.length} general reviews`);
    
    // Transform to the expected format
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      title: `Review of ${review.restaurant?.title || 'Restaurant'}`,
      date: review.createdAt.toISOString().split('T')[0],
      upvotes: review.upvotes || 0,
      text: review.content,
      restaurant: `${review.restaurant?.title || 'Restaurant'}${review.restaurant?.location ? ` - ${review.restaurant.location}` : ''}`,
      author: review.patron ? `${review.patron.firstName} ${review.patron.lastName.charAt(0)}.` : 'Anonymous'
    }));
    
    console.log("Reviews API: General reviews formatted for response", {
      count: formattedReviews.length
    });
    
    return NextResponse.json({ reviews: formattedReviews });
  } catch (error) {
    console.error("Reviews API: Error fetching reviews:", error);
    return NextResponse.json({ 
      error: "Failed to fetch reviews", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Helper function to get user-specific reviews
async function getUserReviews(userId: string): Promise<NextResponse> {
  try {
    // Fetch reviews for the specified user WITH the related restaurant data
    const reviews = await db.review.findMany({
      where: {
        patronId: userId
      },
      select: {
        id: true,
        content: true,
        rating: true,
        createdAt: true,
        upvotes: true,
        restaurant: {  // Make sure to include the related restaurant
          select: {
            title: true,
            location: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Reviews API: Found ${reviews.length} reviews for user ${userId}`);
    
    // Transform the data to match the expected format in the frontend
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      title: `Review of ${review.restaurant?.title || 'Restaurant'}`,
      date: review.createdAt.toISOString().split('T')[0],
      upvotes: review.upvotes || 0,
      text: review.content,
      restaurant: review.restaurant?.title || 'Unknown Restaurant'
    }));
    
    console.log("Reviews API: User reviews formatted for response", {
      count: formattedReviews.length
    });
    
    return NextResponse.json({ reviews: formattedReviews });
  } catch (error) {
    console.error("Reviews API: Error fetching user reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch user reviews", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST handler for creating reviews
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("Review API: Beginning request processing");
    
    // Get server session with authOptions from lib/auth.ts
    const session = await getServerSession(authOptions);
    console.log("Review API: Session data retrieved:", { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session || !session.user || !session.user.id) {
      console.log("Review API: Unauthorized - No valid session or user ID");
      return NextResponse.json({ error: "Unauthorized - Please log in to submit a review" }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    console.log("Review API: Request body received", {
      restaurant: body.restaurant,
      hasMenuItem: !!body.menuItem,
      contentLength: body.content?.length
    });
    
    const { restaurant, menuItem, standards, content, imageUrl, videoUrl, rating } = body;
    
    // Validate input
    if (!restaurant || !content || content.length < 10) {
      console.log("Review API: Invalid input", { 
        hasRestaurant: !!restaurant, 
        contentLength: content?.length 
      });
      return NextResponse.json({ error: "Invalid input - Restaurant and content are required" }, { status: 400 });
    }
    
    // Find or create restaurant
    console.log("Review API: Finding restaurant", { restaurantName: restaurant });
    let restaurantRecord = await db.restaurant.findFirst({
      where: { title: restaurant }
    });
    
    if (!restaurantRecord) {
      console.log("Review API: Restaurant not found, creating new record");
      restaurantRecord = await db.restaurant.create({
        data: {
          title: restaurant,
          rating: "0", // Initial rating
          num_reviews: "0", // Initial count
          category: [], // No categories initially
        }
      });
      console.log("Review API: New restaurant created", { restaurantId: restaurantRecord.id });
    } else {
      console.log("Review API: Existing restaurant found", { restaurantId: restaurantRecord.id });
    }
    
    // Find menu item if provided
    let menuItemRecord = null;
    if (menuItem) {
      console.log("Review API: Finding menu item", { menuItemName: menuItem });
      menuItemRecord = await db.menuItem.findFirst({
        where: { name: menuItem }
      });
      console.log("Review API: Menu item search result", { found: !!menuItemRecord });
    }
    
    // Convert standards to integers (from 1-5) or use 0 as default
    const asExpectedRating = standards?.asExpected ? parseInt(String(standards.asExpected)) : 0;
    const wouldRecommendRating = standards?.wouldRecommend ? parseInt(String(standards.wouldRecommend)) : 0;
    const valueForMoneyRating = standards?.valueForMoney ? parseInt(String(standards.valueForMoney)) : 0;
    
    // Find patron record to ensure it exists
    const patron = await db.patron.findUnique({
      where: { id: session.user.id }
    });
    
    if (!patron) {
      console.log("Review API: Patron not found with ID:", session.user.id);
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }
    
    // Create review
    const reviewData: any = {
      content,
      rating: rating || 5,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      upvotes: 0,
      asExpected: asExpectedRating,
      wouldRecommend: wouldRecommendRating,
      valueForMoney: valueForMoneyRating,
      
      // Connect to patron
      patron: {
        connect: { id: session.user.id }
      },
      
      // Connect to restaurant
      restaurant: {
        connect: { id: restaurantRecord.id }
      },
    };
    
    console.log("Review API: Preparing review data", { 
      userId: session.user.id,
      restaurantId: restaurantRecord.id,
      hasMenuItemConnection: !!menuItemRecord
    });
    
    // Add menu item connection if found
    if (menuItemRecord) {
      reviewData.menuItem = {
        connect: { id: menuItemRecord.id }
      };
    }
    
    console.log("Review API: Creating review record");
    const review = await db.review.create({
      data: reviewData
    });
    console.log("Review API: Review created successfully", { reviewId: review.id });
    
    // Update restaurant review count
    console.log("Review API: Updating restaurant review count");
    await db.restaurant.update({
      where: { id: restaurantRecord.id },
      data: {
        num_reviews: String(parseInt(restaurantRecord.num_reviews || "0") + 1)
      }
    });
    console.log("Review API: Restaurant review count updated");
    
    return NextResponse.json({
      success: true,
      reviewId: review.id,
      restaurantId: restaurantRecord.id
    });
  } catch (error) {
    console.error("Review API: Error during review creation:", error);
    return NextResponse.json({ 
      error: "Failed to create review", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}