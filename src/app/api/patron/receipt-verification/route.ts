// src/app/api/patron/receipt-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

interface ReceiptVerificationRequest {
  reviewId: string;
  restaurantId: string;
  receiptImage: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the request body
    const body = await req.json() as ReceiptVerificationRequest;
    const { reviewId, restaurantId, receiptImage } = body;

    // Validate required fields
    if (!reviewId || !restaurantId || !receiptImage) {
      return NextResponse.json({ 
        error: "Missing required fields: reviewId, restaurantId, and receiptImage are required" 
      }, { status: 400 });
    }

    // Verify that the review exists and belongs to the user
    const review = await db.review.findUnique({
      where: {
        id: reviewId,
        patronId: session.user.id // Make sure the review belongs to the current user
      }
    });

    if (!review) {
      return NextResponse.json({ 
        error: "Review not found or does not belong to the current user" 
      }, { status: 404 });
    }

    // Check if restaurant exists
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Check if a verification request already exists for this review
    const existingVerification = await db.receiptVerification.findFirst({
      where: {
        reviewId: reviewId
      }
    });

    if (existingVerification) {
      return NextResponse.json({ 
        error: "A verification request already exists for this review",
        verificationId: existingVerification.id,
        status: existingVerification.status
      }, { status: 409 }); // 409 Conflict
    }

    // Create the receipt verification record
    const receiptVerification = await db.receiptVerification.create({
      data: {
        receiptImage: receiptImage,
        status: "pending",
        review: {
          connect: { id: reviewId }
        },
        restaurant: {
          connect: { id: restaurantId }
        }
      }
    });

    return NextResponse.json({
      success: true,
      verificationId: receiptVerification.id,
      message: "Receipt verification submitted successfully"
    });
    
  } catch (error) {
    console.error("Error creating receipt verification:", error);
    return NextResponse.json({ 
      error: "Failed to submit receipt verification",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// GET endpoint to check verification status for a review
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the review ID from the query parameters
    const url = new URL(req.url);
    const reviewId = url.searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    // Verify that the review exists and belongs to the user
    const review = await db.review.findUnique({
      where: {
        id: reviewId,
        patronId: session.user.id
      }
    });

    if (!review) {
      return NextResponse.json({ 
        error: "Review not found or does not belong to the current user" 
      }, { status: 404 });
    }

    // Get the verification status for this review
    const verification = await db.receiptVerification.findFirst({
      where: {
        reviewId: reviewId
      }
    });

    if (!verification) {
      return NextResponse.json({ 
        exists: false, 
        message: "No verification request found for this review" 
      });
    }

    return NextResponse.json({
      exists: true,
      verification: {
        id: verification.id,
        status: verification.status,
        submittedAt: verification.submittedAt,
        reviewedAt: verification.reviewedAt,
        receiptImage: verification.receiptImage
      }
    });
    
  } catch (error) {
    console.error("Error checking receipt verification status:", error);
    return NextResponse.json({ 
      error: "Failed to check verification status",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}