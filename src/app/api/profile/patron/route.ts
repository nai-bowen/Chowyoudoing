import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    const patronId = url.searchParams.get("id");
    
    if (!username && !patronId) {
      return NextResponse.json(
        { error: "Either username or id parameter is required" },
        { status: 400 }
      );
    }
    
    // Build where clause based on provided parameter
    if (!username && !patronId) {
      return NextResponse.json(
        { error: "Either username or id parameter is required" },
        { status: 400 }
      );
    }
    
    // Ensure we have a valid condition for findUnique
    let whereCondition;
    if (username) {
      whereCondition = { username };
    } else if (patronId) {
      whereCondition = { id: patronId };
    } else {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }
    
    // Fetch the patron with counts of related records
    const patron = await db.patron.findUnique({
      where: whereCondition,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        profileImage: true,
        bio: true,
        interests: true,
        _count: {
          select: {
            reviews: true,
            favorites: true,
            followers: true,
            following: true
          }
        }
      }
    });
    
    if (!patron) {
      return NextResponse.json(
        { error: "Patron not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ patron });
  } catch (error) {
    console.error("Error fetching patron data:", error);
    return NextResponse.json(
      { error: "Failed to fetch patron data" },
      { status: 500 }
    );
  }
}