/*eslint-disable*/
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.userType !== "restaurateur") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get query params
    const url = new URL(req.url);
    const queryRestaurateurId = url.searchParams.get("restaurateurId");
    
    // Use either the query param or the session user's id
    const restaurateurId = queryRestaurateurId || session.user.id;
    
    // Check if the requestor has permission to fetch this data
    if (queryRestaurateurId && queryRestaurateurId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this restaurateur's data" }, 
        { status: 403 }
      );
    }

    // Fetch connection requests for the specified restaurateur
    const connectionRequests = await db.restaurantConnectionRequest.findMany({
      where: {
        restaurateurId: restaurateurId,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            title: true,
            location: true,
            category: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json(connectionRequests);
  } catch (error) {
    console.error("Error fetching connection requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch connection requests" }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.userType !== "restaurateur") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get request body
    const body = await req.json();
    const { restaurantId, message } = body;
    
    console.log("Processing connection request for restaurant:", restaurantId);
    
    // Validate required fields
    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId is required" }, 
        { status: 400 }
      );
    }

    const restaurateurId = session.user.id;

    // Check if restaurateur exists
    const restaurateur = await db.restaurateur.findUnique({
      where: { id: restaurateurId },
    });

    if (!restaurateur) {
      return NextResponse.json(
        { error: "Restaurateur not found" }, 
        { status: 404 }
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

    // Check if a connection request already exists
    const existingRequest = await db.restaurantConnectionRequest.findFirst({
      where: {
        restaurateurId,
        restaurantId,
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "A connection request for this restaurant already exists" }, 
        { status: 409 }
      );
    }

    // Create the connection request
    const connectionRequest = await db.restaurantConnectionRequest.create({
      data: {
        restaurateurId,
        restaurantId,
        message: message || null,
        status: "pending",
      },
    });

    return NextResponse.json(connectionRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating connection request:", error);
    return NextResponse.json(
      { error: "Failed to create connection request" }, 
      { status: 500 }
    );
  }
}