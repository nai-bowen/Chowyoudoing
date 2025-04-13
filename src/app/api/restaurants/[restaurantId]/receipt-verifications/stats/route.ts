/*eslint-disable*/
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get query params
    const url = new URL(req.url);
    const restaurateurId = url.searchParams.get("restaurateurId");
    const restaurantId = url.searchParams.get("restaurantId");
    
    if (!restaurateurId && !restaurantId) {
      return NextResponse.json(
        { error: "Either restaurateurId or restaurantId is required" }, 
        { status: 400 }
      );
    }

    // Build the base query conditions
    const whereConditions: any = {};
    
    // If restaurantId is provided directly, use it
    if (restaurantId) {
      whereConditions.restaurantId = restaurantId;
    } 
    // Otherwise, find restaurants associated with the restaurateur
    else if (restaurateurId) {
      // Get restaurant IDs associated with this restaurateur
      const restaurateur = await db.restaurateur.findUnique({
        where: { id: restaurateurId },
        include: {
          restaurant: true,
        },
      });

      if (!restaurateur) {
        return NextResponse.json(
          { error: "Restaurateur not found" }, 
          { status: 404 }
        );
      }

      // Get restaurant IDs this restaurateur manages
      const managedRestaurantIds: string[] = [];
      
      // Add directly connected restaurant if it exists
      if (restaurateur.restaurant) {
        managedRestaurantIds.push(restaurateur.restaurant.id);
      }
      
      // Add restaurants from approved connection requests
      const approvedConnections = await db.restaurantConnectionRequest.findMany({
        where: {
          restaurateurId: restaurateurId,
          status: "approved",
        },
        include: {
          restaurant: true,
        },
      });
      
      approvedConnections.forEach(connection => {
        if (connection.restaurant && !managedRestaurantIds.includes(connection.restaurant.id)) {
          managedRestaurantIds.push(connection.restaurant.id);
        }
      });
      
      // If no restaurants are connected, return empty array
      if (managedRestaurantIds.length === 0) {
        return NextResponse.json({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        });
      }
      
      // Set the filter to use the managed restaurant IDs
      whereConditions.restaurantId = {
        in: managedRestaurantIds,
      };
    }

    // Calculate counts by status
    const total = await db.receiptVerification.count({
      where: whereConditions
    });
    
    const pending = await db.receiptVerification.count({
      where: {
        ...whereConditions,
        status: "pending"
      }
    });
    
    const approved = await db.receiptVerification.count({
      where: {
        ...whereConditions,
        status: "approved"
      }
    });
    
    const rejected = await db.receiptVerification.count({
      where: {
        ...whereConditions,
        status: "rejected"
      }
    });

    return NextResponse.json({
      total,
      pending,
      approved,
      rejected
    });
  } catch (error) {
    console.error("Error fetching receipt verification stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt verification stats" }, 
      { status: 500 }
    );
  }
}