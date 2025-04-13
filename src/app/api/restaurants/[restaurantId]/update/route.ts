/*eslint-disable*/
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
): Promise<NextResponse> {
  const { restaurantId } = await params;

  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID is required" }, { status: 400 });
    }

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

    if (!title?.trim()) {
      return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
    }

    if (url && typeof url === "string" && url.trim() !== "") {
      try {
        new URL(url);
      } catch (e) {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
      }
    }

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

    const isRestaurantOwner = restaurant.restaurateurs.length > 0;
    const hasApprovedConnection = restaurant.connectionRequests.length > 0;

    if (!(isRestaurantOwner || hasApprovedConnection)) {
      return NextResponse.json(
        { error: "You do not have permission to edit this restaurant" },
        { status: 403 }
      );
    }

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
