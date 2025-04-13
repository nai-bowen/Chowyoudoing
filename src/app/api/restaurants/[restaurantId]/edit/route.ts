// src/app/api/restaurants/[restaurantId]/edit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
): Promise<NextResponse> {
  const { restaurantId } = await params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: restaurant.id,
      title: restaurant.title,
      url: restaurant.url,
      detail: restaurant.detail,
      rating: restaurant.rating,
      num_reviews: restaurant.num_reviews,
      location: restaurant.location,
      category: restaurant.category,
      interests: restaurant.interests,
      widerAreas: restaurant.widerAreas || [],
      createdAt: restaurant.createdAt.toISOString(),
      updatedAt: restaurant.updatedAt.toISOString()
    });
  } catch (error) {
    console.error("Error fetching restaurant for edit:", error);
    return NextResponse.json({ error: "Failed to fetch restaurant data" }, { status: 500 });
  }
}
