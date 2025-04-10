// src/app/api/restaurateur/reviews/respond/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/server/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  id: string;
  email: string;
  restaurateurId: string;
  role: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("restaurateur_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded || decoded.role !== "restaurateur") {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const restaurateurId = decoded.restaurateurId;
    const userEmail = decoded.email;

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

    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        restaurantResponse: response.trim(),
      },
    });

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
