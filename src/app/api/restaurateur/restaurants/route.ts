// src/app/api/restaurateur/restaurants/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get query params
    const url = new URL(req.url);
    const restaurateurId = url.searchParams.get("restaurateurId");
    
    if (!restaurateurId) {
      return NextResponse.json(
        { error: "restaurateurId is required" }, 
        { status: 400 }
      );
    }

    // Fetch the restaurateur's connected restaurants
    const restaurateur = await db.restaurateur.findUnique({
      where: {
        id: restaurateurId,
      },
      include: {
        restaurant: {
          include: {
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
    });

    if (!restaurateur) {
      return NextResponse.json(
        { error: "Restaurateur not found" }, 
        { status: 404 }
      );
    }

    // If there's no directly connected restaurant, check for approved connection requests
    if (!restaurateur.restaurant) {
      const approvedConnections = await db.restaurantConnectionRequest.findMany({
        where: {
          restaurateurId,
          status: "approved",
        },
        include: {
          restaurant: {
            include: {
              _count: {
                select: {
                  reviews: true,
                },
              },
            },
          },
        },
      });

      const connectedRestaurants = approvedConnections.map(conn => conn.restaurant);
      return NextResponse.json(connectedRestaurants);
    }

    // Return the single connected restaurant in an array for consistency
    return NextResponse.json([restaurateur.restaurant]);
  } catch (error) {
    console.error("Error fetching restaurateur restaurants:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" }, 
      { status: 500 }
    );
  }
}