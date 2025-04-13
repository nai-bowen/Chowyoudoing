/*eslint-disable*/
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

// GET menu sections for a restaurant
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get query params
    const url = new URL(req.url);
    const restaurantId = url.searchParams.get("restaurantId");
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId is required" }, 
        { status: 400 }
      );
    }

    // Fetch menu sections with items for the specified restaurant
    const menuSections = await db.menuSection.findMany({
      where: {
        restaurantId: restaurantId,
      },
      include: {
        items: true,
        interest: true,
      },
      orderBy: {
        id: "asc", // You might want to add a sortOrder field in the future
      },
    });

    return NextResponse.json(menuSections);
  } catch (error) {
    console.error("Error fetching menu sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu sections" }, 
      { status: 500 }
    );
  }
}

// Create a new menu section
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get request body
    const body = await req.json();
    const { restaurantId, category, interestId } = body;
    
    // Validate required fields
    if (!restaurantId || !category) {
      return NextResponse.json(
        { error: "restaurantId and category are required" }, 
        { status: 400 }
      );
    }

    // Check if restaurant exists
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" }, 
        { status: 404 }
      );
    }

    // Create the menu section
    const menuSection = await db.menuSection.create({
      data: {
        category,
        restaurantId,
        interestId: interestId || null,
      },
    });

    return NextResponse.json(menuSection, { status: 201 });
  } catch (error) {
    console.error("Error creating menu section:", error);
    return NextResponse.json(
      { error: "Failed to create menu section" }, 
      { status: 500 }
    );
  }
}






