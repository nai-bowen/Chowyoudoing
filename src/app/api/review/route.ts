/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig as authOptions } from "@/server/auth/config";
import { db } from "@/server/db";

export async function POST(req: NextRequest) {
  try {
    console.log("Review API: Beginning request processing");
    
    // Get server session
    const session = await getServerSession(authOptions);
    console.log("Review API: Session retrieved", { 
      hasSession: !!session, 
      userId: session?.user?.id 
    });
    
    if (!session || !session.user) {
      console.log("Review API: Unauthorized - No valid session");
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