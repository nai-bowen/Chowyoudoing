import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the current session to identify the user
    const session = await getServerSession(authOptions);
    
    // If no authenticated session, return unauthorized
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to access profile data." },
        { status: 401 }
      );
    }

    // Fetch the user's profile from the database
    const patron = await db.patron.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImage: true, // This field might need to be added to your schema
        bio: true,          // This field might need to be added to your schema
        interests: true     // Including interests which could be useful for UI
      }
    });

    // If no user found, return error
    if (!patron) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Format user profile data for response
    const profileData = {
      id: patron.id,
      name: `${patron.firstName} ${patron.lastName}`,
      firstName: patron.firstName,
      lastName: patron.lastName,
      email: patron.email,
      profileImage: patron.profileImage || null,
      bio: patron.bio || "",
      interests: patron.interests || []
    };

    // Return the profile data
    return NextResponse.json({ profile: profileData });
    
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch profile data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Implement PUT endpoint to update profile data if needed
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to update profile data." },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { profileImage, bio, interests } = await req.json();
    
    // Update the user's profile
    const updatedPatron = await db.patron.update({
      where: {
        id: session.user.id
      },
      data: {
        profileImage: profileImage,
        bio: bio,
        interests: interests
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImage: true,
        bio: true,
        interests: true
      }
    });
    
    return NextResponse.json({
      success: true,
      profile: {
        id: updatedPatron.id,
        name: `${updatedPatron.firstName} ${updatedPatron.lastName}`,
        firstName: updatedPatron.firstName,
        lastName: updatedPatron.lastName,
        email: updatedPatron.email,
        profileImage: updatedPatron.profileImage || null,
        bio: updatedPatron.bio || "",
        interests: updatedPatron.interests || []
      }
    });
    
  } catch (error) {
    console.error("Error updating profile data:", error);
    return NextResponse.json(
      {
        error: "Failed to update profile data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}