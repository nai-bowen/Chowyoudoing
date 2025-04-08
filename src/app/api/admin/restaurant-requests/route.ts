import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { VerificationStatus } from "@prisma/client";

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

    // Map string status to enum if provided
    let verificationStatus: VerificationStatus | undefined;
    if (statusParam === "pending") {
      verificationStatus = VerificationStatus.PENDING;
    } else if (statusParam === "approved") {
      verificationStatus = VerificationStatus.APPROVED;
    } else if (statusParam === "rejected") {
      verificationStatus = VerificationStatus.REJECTED;
    }

    // Build the where clause based on the status filter
    const whereClause = verificationStatus
      ? { verificationStatus }
      : {};

    // Fetch restaurateur requests with optional filter
    const restaurantRequests = await db.restaurateur.findMany({
      where: whereClause,
      include: {
        restaurant: {
          select: {
            id: true,
            title: true,
            location: true,
            category: true,
          }
        }
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    // Convert enum values to strings for the frontend
    const formattedRequests = restaurantRequests.map(request => ({
      ...request,
      // Convert enum to string for easier frontend handling
      verificationStatus: request.verificationStatus.toString()
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error("Error fetching restaurant requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurant requests" },
      { status: 500 }
    );
  }
}