// src/app/api/admin/restaurant-connection-requests/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// Environment variables should be set in your .env file
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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

    // Get query params
    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status");

    // Build the where clause based on the status filter
    let whereClause: Record<string, any> = {};
    if (statusParam && ["pending", "approved", "rejected"].includes(statusParam)) {
      whereClause.status = statusParam;
    }

    // Fetch all connection requests with optional status filter
    const connectionRequests = await db.restaurantConnectionRequest.findMany({
      where: whereClause,
      include: {
        restaurant: {
          select: {
            id: true,
            title: true,
            location: true,
            category: true,
          },
        },
        restaurateur: {
          select: {
            id: true,
            email: true,
            restaurantName: true,
            contactPersonName: true,
            contactPersonEmail: true,
            verificationStatus: true,
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