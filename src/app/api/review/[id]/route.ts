import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

// This is for the API route in /api/review/[id]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params; // Await params in case it's a Promise
    console.log("Get Review API: Fetching review with ID:", id);

    // Get the current user's session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log("Get Review API: Unauthorized - User not logged in");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the review
    const review = await db.review.findUnique({
      where: { id },
      include: {
        patron: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        restaurant: {
          select: {
            id: true,
            title: true
          }
        },
        menuItem: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!review) {
      console.log("Get Review API: Review not found with ID:", id);
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check if the current user owns this review
    const isOwner = review.patronId === session.user.id;

    if (!isOwner) {
      console.log("Get Review API: Permission denied - User doesn't own the review");
      return NextResponse.json({ 
        error: "You don't have permission to view or edit this review" 
      }, { status: 403 });
    }

    // Format the response
    const formattedReview = {
      id: review.id,
      content: review.content,
      rating: review.rating,
      asExpected: review.asExpected,
      wouldRecommend: review.wouldRecommend,
      valueForMoney: review.valueForMoney,
      upvotes: review.upvotes,
      imageUrl: review.imageUrl,
      videoUrl: review.videoUrl,
      date: review.createdAt.toISOString().split("T")[0],
      restaurant: review.restaurant?.title,
      restaurantId: review.restaurantId,
      menuItemId: review.menuItemId,
      menuItemName: review.menuItem?.name,
      patron: review.patron ? {
        id: review.patron.id,
        firstName: review.patron.firstName,
        lastName: review.patron.lastName
      } : undefined
    };

    console.log("Get Review API: Successfully fetched review");

    return NextResponse.json({ review: formattedReview });
  } catch (error) {
    console.error("Get Review API: Error fetching review:", error);
    return NextResponse.json({ 
      error: "Failed to fetch review", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// DELETE handler for removing a review
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = params.id;
    console.log("Delete Review API: Processing delete request for review ID:", id);

    // Get server session with authOptions
    const session = await getServerSession(authOptions);
    console.log("Delete Review API: Session:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id
    });
    
    if (!session?.user?.id) {
      console.log("Delete Review API: Unauthorized - No valid session or user ID");
      return NextResponse.json({ error: "Unauthorized - Please log in to delete a review" }, { status: 401 });
    }
    
    // Find the review
    const review = await db.review.findUnique({
      where: { id },
      select: { id: true, patronId: true }
    });
    
    // Verify review exists
    if (!review) {
      console.log("Delete Review API: Review not found with ID:", id);
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    
    console.log("Delete Review API: Found review, checking authorization");
    console.log("Delete Review API: Review patronId:", review.patronId);
    console.log("Delete Review API: Current user ID:", session.user.id);
    
    // Verify user owns the review
    if (review.patronId !== session.user.id) {
      console.log("Delete Review API: User is not authorized to delete this review");
      return NextResponse.json({ 
        error: "You are not authorized to delete this review" 
      }, { status: 403 });
    }
    
    // Delete the review
    console.log("Delete Review API: Deleting review with ID:", id);
    const deleteResult = await db.review.delete({
      where: { id }
    });
    
    console.log("Delete Review API: Review deleted successfully", deleteResult);
    
    return NextResponse.json({
      success: true,
      message: "Review deleted successfully"
    });
    
  } catch (error) {
    console.error("Delete Review API: Error during review deletion:", error);
    return NextResponse.json({ 
      error: "Failed to delete review", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// PUT handler for updating a review
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = params.id;
    console.log("Update Review API: Processing update for review ID:", id);

    // Get server session with authOptions
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("Update Review API: Unauthorized - No valid session or user ID");
      return NextResponse.json({ error: "Unauthorized - Please log in to update a review" }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const { content, rating, asExpected, wouldRecommend, valueForMoney } = body;
    
    // Find the review
    const review = await db.review.findUnique({
      where: { id },
      select: { id: true, patronId: true }
    });
    
    // Verify review exists
    if (!review) {
      console.log("Update Review API: Review not found with ID:", id);
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    
    // Verify user owns the review
    if (review.patronId !== session.user.id) {
      console.log("Update Review API: User is not authorized to update this review");
      return NextResponse.json({ 
        error: "You are not authorized to update this review" 
      }, { status: 403 });
    }
    
    // Update the review
    console.log("Update Review API: Updating review with ID:", id);
    const updatedReview = await db.review.update({
      where: { id },
      data: {
        content,
        rating,
        asExpected,
        wouldRecommend,
        valueForMoney
      }
    });
    
    console.log("Update Review API: Review updated successfully");
    
    return NextResponse.json({
      success: true,
      message: "Review updated successfully"
    });
    
  } catch (error) {
    console.error("Update Review API: Error during review update:", error);
    return NextResponse.json({ 
      error: "Failed to update review", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}