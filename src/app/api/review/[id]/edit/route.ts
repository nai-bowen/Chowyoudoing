/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";

// Define the expected request body structure
interface EditReviewRequestBody {
  reviewId: string;
  content: string;
  rating?: number;
  asExpected?: number;
  wouldRecommend?: number;
  valueForMoney?: number;
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("Edit Review API: Beginning request processing");
    
    // Get server session with authOptions
    const session = await getServerSession(authOptions);
    console.log("Edit Review API: Session data retrieved:", { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    // Verify user is authenticated
    if (!session || !session.user || !session.user.id) {
      console.log("Edit Review API: Unauthorized - No valid session or user ID");
      return NextResponse.json({ error: "Unauthorized - Please log in to edit a review" }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json() as EditReviewRequestBody;
    const { reviewId, content, rating, asExpected, wouldRecommend, valueForMoney } = body;
    
    console.log("Edit Review API: Request data received:", {
      reviewId,
      contentLength: content?.length,
      rating,
      asExpected,
      wouldRecommend,
      valueForMoney
    });
    
    // Validate required fields
    if (!reviewId || !content || content.length < 10) {
      console.log("Edit Review API: Invalid input data");
      return NextResponse.json({ 
        error: "Invalid input - Review ID and content are required. Content must be at least 10 characters."
      }, { status: 400 });
    }
    
    // Find the review
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, patronId: true }
    });
    
    // Verify review exists
    if (!review) {
      console.log("Edit Review API: Review not found with ID:", reviewId);
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    
    // Verify user owns the review
    if (review.patronId !== session.user.id) {
      console.log("Edit Review API: User is not authorized to edit this review");
      return NextResponse.json({ 
        error: "You are not authorized to edit this review" 
      }, { status: 403 });
    }
    
    // Prepare update data with proper typing
    const updateData: Prisma.ReviewUpdateInput = {
      content: content
    };
    
    // Add optional fields if provided
    if (rating !== undefined) {
      updateData.rating = rating;
    }
    
    if (asExpected !== undefined) {
      updateData.asExpected = asExpected;
    }
    
    if (wouldRecommend !== undefined) {
      updateData.wouldRecommend = wouldRecommend;
    }
    
    if (valueForMoney !== undefined) {
      updateData.valueForMoney = valueForMoney;
    }
    
    // Update the review
    console.log("Edit Review API: Updating review with ID:", reviewId);
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: updateData
    });
    
    console.log("Edit Review API: Review updated successfully");
    
    return NextResponse.json({
      success: true,
      reviewId: updatedReview.id,
      message: "Review updated successfully"
    });
    
  } catch (error) {
    console.error("Edit Review API: Error during review update:", error);
    return NextResponse.json({ 
      error: "Failed to update review", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}