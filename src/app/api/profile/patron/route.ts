// src/app/api/profile/patron/route.ts
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
    const searchQuery = url.searchParams.get("q");
    
    console.log("Profile patron request parameters:", { username, patronId, searchQuery });
    
    // Get the current session for auth check
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to access profile data." },
        { status: 401 }
      );
    }
    
    // Handle search query case
    if (searchQuery) {
      // Search for patrons by first name, last name, email, or username
      const patrons = await db.patron.findMany({
        where: {
          OR: [
            { firstName: { contains: searchQuery, mode: "insensitive" } },
            { lastName: { contains: searchQuery, mode: "insensitive" } },
            { email: { contains: searchQuery, mode: "insensitive" } },
            { username: { contains: searchQuery, mode: "insensitive" } }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          profileImage: true,
          isCertifiedFoodie: true
        },
        take: 10 // Limit results
      });
      
      // Format the response
      const formattedPatrons = patrons.map((patron) => ({
        id: patron.id,
        firstName: patron.firstName,
        lastName: patron.lastName,
        username: patron.username || patron.email.split('@')[0], // Use email username as fallback
        profileImage: patron.profileImage,
        isCertifiedFoodie: patron.isCertifiedFoodie
      }));
      
      return NextResponse.json({ patrons: formattedPatrons });
    }
    
    // Handle single patron lookup (original functionality)
    
    // If no id or username, use the current authenticated user
    if (!username && !patronId) {
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
            reviews: true,
            followers: true,  
            following: true 
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