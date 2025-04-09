// src/app/api/admin/restaurant-connection-requests/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// Environment variables should be set in your .env file
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Get request ID from URL params
    const requestId = params.id;
    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    // Validate admin authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { status, reviewedBy } = body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending', 'approved', or 'rejected'" },
        { status: 400 }
      );
    }

    // Check if the connection request exists
    const connectionRequest = await db.restaurantConnectionRequest.findUnique({
      where: { id: requestId },
      include: {
        restaurateur: true,
        restaurant: true,
      },
    });

    if (!connectionRequest) {
      return NextResponse.json(
        { error: "Connection request not found" },
        { status: 404 }
      );
    }

    // Update the connection request status
    const updatedRequest = await db.restaurantConnectionRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewedBy || "Admin",
      },
    });

    // If the request was approved, update the restaurateur record to associate with the restaurant
    if (status === "approved") {
      await db.restaurateur.update({
        where: { id: connectionRequest.restaurateurId },
        data: {
          restaurantId: connectionRequest.restaurantId,
        },
      });
    }

    // If the request was rejected, remove any restaurant association
    if (status === "rejected" && connectionRequest.restaurateur.restaurantId === connectionRequest.restaurantId) {
      await db.restaurateur.update({
        where: { id: connectionRequest.restaurateurId },
        data: {
          restaurantId: null,
        },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating connection request:", error);
    return NextResponse.json(
      { error: "Failed to update connection request" },
      { status: 500 }
    );
  }
}