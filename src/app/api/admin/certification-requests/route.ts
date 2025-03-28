// src/app/api/admin/certification-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// Fetch certification requests
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Check admin password
    const authHeader = req.headers.get("Authorization");
    const providedPassword = authHeader?.split("Bearer ")?.[1];

    if (!providedPassword || providedPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for filtering
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    
    // Build where clause for filtering
    const whereClause: Record<string, any> = statusFilter ? { status: statusFilter } : {};

    // Fetch certification requests with patron information
    const requests = await db.certificationRequest.findMany({
      where: whereClause,
      include: {
        patron: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            interests: true,
            reviews: {
              select: {
                id: true,
              },
              take: 1, // Just to count them
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Enhance the data with review counts
    const enhancedRequests = await Promise.all(
      requests.map(async (request) => {
        // Get review count for this patron
        const reviewCount = await db.review.count({
          where: { patronId: request.patronId },
        });

        return {
          ...request,
          patron: {
            ...request.patron,
            reviewCount,
          },
        };
      })
    );

    return NextResponse.json(enhancedRequests);
  } catch (error) {
    console.error("Error fetching certification requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch certification requests" },
      { status: 500 }
    );
  }
}