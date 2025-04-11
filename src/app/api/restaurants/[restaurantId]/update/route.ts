// src/app/api/restaurants/[restaurantId]/update/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { restaurantId: string } }
): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get restaurant ID from URL params
    const restaurantId = params.restaurantId;
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID is required" }, { status: 400 });
    }

    // Get request body
    const body = await req.json();
    const { 
      title, 
      url, 
      detail, 
      location, 
      category, 
      interests, 
      widerAreas 
    } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
    }

    // Check if URL is valid if provided
    if (url && typeof url === "string" && url.trim() !== "") {
      try {
        new URL(url);
      } catch (e) {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
      }
    }

    // Verify the restaurant exists and user has permission to edit it
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        restaurateurs: {
          where: { id: (session.user as any).id },
        },
        connectionRequests: {
          where: {
            restaurateurId: (session.user as any).id,
            status: "approved",
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Check if user has permission to edit this restaurant
    const isRestaurantOwner = restaurant.restaurateurs.length > 0;
    const hasApprovedConnection = restaurant.connectionRequests.length > 0;

    if (!(isRestaurantOwner || hasApprovedConnection)) {
      return NextResponse.json(
        { error: "You do not have permission to edit this restaurant" },
        { status: 403 }
      );
    }

    // Update the restaurant
    const updatedRestaurant = await db.restaurant.update({
      where: { id: restaurantId },
      data: {
        title: title.trim(),
        url: url?.trim() || null,
        detail: detail?.trim() || null,
        location: location?.trim() || null,
        category: Array.isArray(category) ? category : [],
        interests: Array.isArray(interests) ? interests : [],
        widerAreas: Array.isArray(widerAreas) ? widerAreas : [],
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedRestaurant);
  } catch (error) {
    console.error("Error updating restaurant:", error);
    return NextResponse.json(
      { error: "Failed to update restaurant" },
      { status: 500 }
    );
  }
}