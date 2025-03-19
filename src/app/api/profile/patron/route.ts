/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    let patronId = url.searchParams.get("id");
    
    console.log("Profile patron request parameters:", { username, patronId });
    
    // If no search parameters, use the current authenticated user
    if (!username && !patronId) {
      // Get the current session user
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Unauthorized. Please log in to access profile data." },
          { status: 401 }
        );
      }
      
      patronId = session.user.id;
    }
    
    // Build our query conditions
    let whereCondition;
    
    if (patronId) {
      whereCondition = { id: patronId };
    } else if (username) {
      // Try to find by email first (since we're using email as username)
      whereCondition = { email: username };
    } else {
      return NextResponse.json(
        { error: "No valid search parameters provided" },
        { status: 400 }
      );
    }
    
    console.log("Using where condition:", whereCondition);
    
    // Fetch the patron with related counts
    const patron = await db.patron.findUnique({
      where: whereCondition,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImage: true,
        bio: true,
        interests: true,
        _count: {
          select: {
            reviews: true
          }
        }
      }
    });
    
    if (!patron) {
      console.log("No patron found with criteria:", whereCondition);
      return NextResponse.json(
        { error: "Patron not found" },
        { status: 404 }
      );
    }
    
    // Return the patron data with email used as username
    return NextResponse.json({
      patron: {
        ...patron,
        username: patron.email
      }
    });
    
  } catch (error) {
    console.error("Error fetching patron data:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch patron data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}