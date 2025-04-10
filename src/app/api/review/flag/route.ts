// src/app/api/review/flag/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get request body
    const body = await req.json();
    const { reviewId, reason, details } = body;
    
    // Validate required fields
    if (!reviewId || !reason) {
      return NextResponse.json(
        { error: "reviewId and reason are required" }, 
        { status: 400 }
      );
    }

    if (reason === "other" && !details) {
      return NextResponse.json(
        { error: "Details are required for 'other' reason" }, 
        { status: 400 }
      );
    }

    // Get user ID from session
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" }, 
        { status: 400 }
      );
    }

    // Check if the review exists
    const review = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" }, 
        { status: 404 }
      );
    }

    // Check if this user has already flagged this review
    const existingFlag = await db.reviewFlag.findFirst({
      where: {
        reviewId,
        flaggedBy: userId,
      },
    });

    if (existingFlag) {
      return NextResponse.json(
        { error: "You have already flagged this review" }, 
        { status: 409 }
      );
    }

    // Create the flag
    const reviewFlag = await db.reviewFlag.create({
      data: {
        reviewId,
        reason,
        details: details || null,
        flaggedBy: userId,
        status: "pending",
      },
    });

    return NextResponse.json(reviewFlag, { status: 201 });
  } catch (error) {
    console.error("Error creating flag:", error);
    return NextResponse.json(
      { error: "Failed to flag review" }, 
      { status: 500 }
    );
  }
}