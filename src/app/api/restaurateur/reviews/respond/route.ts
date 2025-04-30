/* eslint-disable */
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.userType !== "restaurateur") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userEmail = session.user.email as string;

    const body = await req.json();
    const { reviewId, response } = body;

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    if (!response || typeof response !== "string" || response.trim() === "") {
      return NextResponse.json({ error: "A valid response is required" }, { status: 400 });
    }

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
      return NextResponse.json({ error: "Restaurateur not found" }, { status: 404 });
    }

    // Check premium status and response quota
    if (!restaurateur.isPremium) {
      // Check if they've already used their daily quota
      if (restaurateur.responseQuotaRemaining <= 0) {
        const now = new Date();
        const quotaReset = restaurateur.responseQuotaReset;

        // If quota reset time is in the future, return quota exceeded error
        if (quotaReset && quotaReset > now) {
          return NextResponse.json({
            error: "Daily response quota exceeded",
            premiumRequired: true,
            resetTime: quotaReset.toISOString()
          }, { status: 429 }); // 429 Too Many Requests
        } else {
          // If quota reset time is in the past, reset the quota
          await db.restaurateur.update({
            where: { id: restaurateur.id },
            data: {
              responseQuotaRemaining: 1,
              responseQuotaReset: new Date(now.setHours(24, 0, 0, 0)) // Reset at midnight
            }
          });
        }
      }
    }

    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: { restaurant: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    let isAuthorized = false;

    if (restaurateur.restaurant && restaurateur.restaurant.id === review.restaurantId) {
      isAuthorized = true;
    } else {
      const connectionRequest = await db.restaurantConnectionRequest.findFirst({
        where: {
          restaurateurId: restaurateur.id,
          restaurantId: review.restaurantId,
          status: "approved",
        },
      });

      if (connectionRequest) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "You are not authorized to respond to this review" }, { status: 403 });
    }

    // Update the review with the response
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        restaurantResponse: response.trim(),
      },
    });

    // Decrement quota if not premium
    if (!restaurateur.isPremium) {
      await db.restaurateur.update({
        where: { id: restaurateur.id },
        data: {
          responseQuotaRemaining: restaurateur.responseQuotaRemaining - 1
        }
      });
    }

    return NextResponse.json({
      success: true,
      review: {
        id: updatedReview.id,
        restaurantResponse: updatedReview.restaurantResponse,
      },
    });
  } catch (error) {
    console.error("Error responding to review:", error);
    return NextResponse.json({
      error: "Failed to respond to review",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}