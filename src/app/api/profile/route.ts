/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the session to check if a user is logged in
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Fetch the patron with counts of related records
    const patron = await db.patron.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
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
      return NextResponse.json({ error: "Patron not found" }, { status: 404 });
    }
    
    return NextResponse.json({ patron });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the session to check if a user is logged in
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    
    // Extract profile data from body
    const { 
      firstName, 
      lastName, 
      username, 
      bio, 
      interests,
      profileImage 
    } = body;
    
    // Validate username (if changed)
    if (username) {
      const existingUser = await db.patron.findFirst({
        where: {
          username,
          id: { not: session.user.id } // Use findFirst with separate id condition instead of findUnique
        }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }
    }
    
    // Update patron record
    const updatedPatron = await db.patron.update({
      where: {
        id: session.user.id
      },
      data: {
        firstName: firstName,
        lastName: lastName,
        username: username,
        bio: bio,
        interests: interests || [],
        profileImage: profileImage
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        profileImage: true,
        bio: true,
        interests: true
      }
    });
    
    return NextResponse.json({ patron: updatedPatron });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}