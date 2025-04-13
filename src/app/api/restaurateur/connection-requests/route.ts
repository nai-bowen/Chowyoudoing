/*eslint-disable*/
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/server/db";

// JWT secret should match what you used in restaurant-login
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  id: string;
  email: string;
  restaurateurId: string;
  role: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get restaurateur token from cookies
    const cookieStore = cookies();
    const token = (await cookieStore).get("restaurateur_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (!decoded || decoded.role !== "restaurateur") {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const restaurateurId = decoded.restaurateurId;
    
    // Get query params
    const url = new URL(req.url);
    const queryRestaurateurId = url.searchParams.get("restaurateurId");
    
    // Use either the query param or the token's restaurateurId
    const targetRestaurateurId = queryRestaurateurId || restaurateurId;
    
    // Check if the requestor has permission to fetch this data
    if (queryRestaurateurId && queryRestaurateurId !== restaurateurId) {
      return NextResponse.json(
        { error: "Unauthorized to access this restaurateur's data" }, 
        { status: 403 }
      );
    }

    // Fetch connection requests for the specified restaurateur
    const connectionRequests = await db.restaurantConnectionRequest.findMany({
      where: {
        restaurateurId: targetRestaurateurId,
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
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    
    console.error("Error fetching connection requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch connection requests" }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get restaurateur token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("restaurateur_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (!decoded || decoded.role !== "restaurateur") {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const restaurateurId = decoded.restaurateurId;
    
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
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    
    console.error("Error creating connection request:", error);
    return NextResponse.json(
      { error: "Failed to create connection request" }, 
      { status: 500 }
    );
  }
}