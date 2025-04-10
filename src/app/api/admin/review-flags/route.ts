// src/app/api/admin/review-flags/route.ts
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

    // Get query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "";
    
    // Build query filter
    const filter: any = {};
    if (status === "pending" || status === "reviewed" || status === "dismissed") {
      filter.status = status;
    }

    // Fetch flags with review and patron details
    const flags = await db.reviewFlag.findMany({
      where: filter,
      include: {
        review: {
          include: {
            patron: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            restaurant: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(flags);
  } catch (error) {
    console.error("Error fetching review flags:", error);
    return NextResponse.json(
      { error: "Failed to fetch review flags" }, 
      { status: 500 }
    );
  }
}