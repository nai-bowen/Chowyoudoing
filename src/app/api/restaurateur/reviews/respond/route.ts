// src/app/api/restaurateur/reviews/respond/route.ts
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
    const { reviewId, response } = body;
    
    console.log(`POST /api/restaurateur/reviews/respond - reviewId: ${reviewId}`);
    
    // Validate required fields
    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId is required" }, 
        { status: 400 }
      );
    }
    
    if (!response || typeof response !== 'string' || response.trim() === '') {
      return NextResponse.json(
        { error: "A valid response is required" }, 
        { status: 400 }
      );
    }

    // Get user ID from session
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" }, 
        { status: 400 }
      );
    }

    console.log(`Finding restaurateur with email: ${userEmail}`);

    // Find the restaurateur by email
    const restaurateur = await db.restaurateur.findFirst({
      where: { 
        OR: [
          { email: userEmail },
          { contactPersonEmail: userEmail }
        ]
      },
      include: {
        restaurant: true,
      },
    });

    if (!restaurateur) {
      console.log(`No restaurateur found with email: ${userEmail}`);
      return NextResponse.json(
        { error: "Restaurateur not found" }, 
        { status: 404 }
      );
    }

    console.log(`Found restaurateur ID: ${restaurateur.id}`);

    // Find the review
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        restaurant: true,
      },
    });

    if (!review) {
      console.log(`Review not found with ID: ${reviewId}`);
      return NextResponse.json(
        { error: "Review not found" }, 
        { status: 404 }
      );
    }

    console.log(`Found review for restaurant: ${review.restaurant.title}`);

    // Check if the restaurateur is authorized to respond to this review
    let isAuthorized = false;
    
    // Check if the review is for the restaurateur's direct restaurant
    if (restaurateur.restaurant && restaurateur.restaurant.id === review.restaurantId) {
      console.log("Restaurateur is directly connected to the restaurant");
      isAuthorized = true;
    } else {
      // Check if the restaurateur has an approved connection to the restaurant
      const connectionRequest = await db.restaurantConnectionRequest.findFirst({
        where: {
          restaurateurId: restaurateur.id,
          restaurantId: review.restaurantId,
          status: "approved",
        },
      });
      
      if (connectionRequest) {
        console.log("Restaurateur has an approved connection to the restaurant");
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      console.log("Restaurateur is not authorized to respond to this review");
      return NextResponse.json(
        { error: "You are not authorized to respond to this review" }, 
        { status: 403 }
      );
    }

    console.log("Updating review with response");

    // Update the review with the response
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        restaurantResponse: response.trim(),
      },
    });

    console.log("Response successfully added");

    return NextResponse.json({
      success: true,
      review: {
        id: updatedReview.id,
        restaurantResponse: updatedReview.restaurantResponse,
      },
    });
  } catch (error) {
    console.error("Error responding to review:", error);
    return NextResponse.json(
      { error: "Failed to respond to review", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}