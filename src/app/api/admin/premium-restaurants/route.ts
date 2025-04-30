/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// Environment variables should be set in your .env file
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// GET: Fetch current premium restaurants for the homepage
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Validate admin authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    // Fetch premium restaurants (those with restaurateurs who have premium status)
    const premiumRestaurants = await db.restaurant.findMany({
      where: {
        restaurateurs: {
          some: {
            isPremium: true,
            premiumExpiresAt: {
              gt: new Date() // Only include active premium subscriptions
            }
          }
        }
      },
      include: {
        restaurateurs: {
          select: {
            id: true,
            restaurantName: true,
            isPremium: true,
            premiumExpiresAt: true
          }
        }
      }
    });

    // Fetch currently featured restaurants
    const featuredRestaurants = await db.restaurant.findMany({
      where: {
        isFeatured: true
      },
      select: {
        id: true,
        title: true
      }
    });

    return NextResponse.json({
      premiumRestaurants,
      featuredRestaurants
    });
  } catch (error) {
    console.error("Error fetching premium restaurants:", error);
    return NextResponse.json({ 
      error: "Failed to fetch premium restaurants", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// POST: Update featured restaurants for the homepage
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Validate admin authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    // Parse request body to get the featured restaurant IDs
    const { restaurantIds } = await req.json();
    
    if (!Array.isArray(restaurantIds)) {
      return NextResponse.json({ error: "restaurantIds must be an array" }, { status: 400 });
    }

    // First, unfeature all restaurants
    await db.restaurant.updateMany({
      where: {
        isFeatured: true
      },
      data: {
        isFeatured: false
      }
    });

    // Then, feature the selected restaurants
    await db.restaurant.updateMany({
      where: {
        id: {
          in: restaurantIds
        }
      },
      data: {
        isFeatured: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Featured restaurants updated successfully",
      featuredIds: restaurantIds
    });
  } catch (error) {
    console.error("Error updating featured restaurants:", error);
    return NextResponse.json({ 
      error: "Failed to update featured restaurants", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}