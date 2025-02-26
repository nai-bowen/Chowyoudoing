/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig as authOptions } from "@/server/auth/config";
import { db } from "@/server/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { restaurant, menuItem, standards, content, imageUrl, videoUrl, rating } = await req.json();
    
    // Validate input
    if (!restaurant || !content || content.length < 10) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    
    // Find or create restaurant
    let restaurantRecord = await db.restaurant.findFirst({
      where: { title: restaurant }
    });
    
    if (!restaurantRecord) {
      restaurantRecord = await db.restaurant.create({
        data: {
          title: restaurant,
          rating: "0", // Initial rating
          num_reviews: "0", // Initial count
          category: [], // No categories initially
        }
      });
    }
    
    // Find menu item if provided
    let menuItemRecord = null;
    if (menuItem) {
      menuItemRecord = await db.menuItem.findFirst({
        where: { name: menuItem }
      });
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
    
    // Add menu item connection if found
    if (menuItemRecord) {
      reviewData.menuItem = {
        connect: { id: menuItemRecord.id }
      };
    }
    
    const review = await db.review.create({
      data: reviewData
    });
    
    // Update restaurant review count
    await db.restaurant.update({
      where: { id: restaurantRecord.id },
      data: {
        num_reviews: String(parseInt(restaurantRecord.num_reviews || "0") + 1)
      }
    });
    
    return NextResponse.json({
      success: true,
      reviewId: review.id,
      restaurantId: restaurantRecord.id
    });
  } catch (error) {
    console.error("Review creation error:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}