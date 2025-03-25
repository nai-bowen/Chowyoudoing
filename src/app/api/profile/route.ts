/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";

// Define types for our API responses
interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string | null;
  profileImage: string | null;
  bio: string | null;
  interests: string[];
  _count?: {
    reviews: number;
    followers: number;
    following: number;
    favorites: number;
  };
}

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

    console.log("Fetching profile for user ID:", session.user.id);

    // Fetch the user's profile from the database with counts
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
            followers: true,
            following: true,
            favorites: true
          }
        }
      }
    });

    // If no user found, return error
    if (!patron) {
      console.log("User profile not found for ID:", session.user.id);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    console.log("Profile found:", patron);

    // Format user profile data for response
    const profileData: ProfileResponse = {
      id: patron.id,
      firstName: patron.firstName || "",
      lastName: patron.lastName || "",
      email: patron.email,
      username: patron.username,
      profileImage: patron.profileImage,
      bio: patron.bio,
      interests: patron.interests || [],
      _count: patron._count
    };

    // Return the profile data
    return NextResponse.json(profileData);
    
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

// PUT endpoint to update profile data
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
    const updateData = await req.json();
    console.log("Update profile request body:", updateData);
    
    // Extract fields that can be updated
    const allowedFields: Prisma.PatronUpdateInput = {};
    
    // Only add fields that were provided in the request
    if (updateData.username !== undefined) allowedFields.username = updateData.username;
    if (updateData.profileImage !== undefined) allowedFields.profileImage = updateData.profileImage;
    if (updateData.bio !== undefined) allowedFields.bio = updateData.bio;
    if (updateData.interests !== undefined) allowedFields.interests = updateData.interests;
    
    console.log("Updating fields:", allowedFields);
    
    // Update the user's profile
    const updatedPatron = await db.patron.update({
      where: {
        id: session.user.id
      },
      data: allowedFields,
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
            followers: true,
            following: true,
            favorites: true
          }
        }
      }
    });
    
    console.log("Profile updated successfully:", updatedPatron);
    
    const profileResponse: ProfileResponse = {
      id: updatedPatron.id,
      firstName: updatedPatron.firstName || "",
      lastName: updatedPatron.lastName || "",
      email: updatedPatron.email,
      username: updatedPatron.username,
      profileImage: updatedPatron.profileImage,
      bio: updatedPatron.bio,
      interests: updatedPatron.interests || [],
      _count: updatedPatron._count
    };
    
    return NextResponse.json(profileResponse);
    
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