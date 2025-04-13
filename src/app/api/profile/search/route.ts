import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to search patrons." },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const query = url.searchParams.get("q") ?? "";
    
    if (!query.trim()) {
      return NextResponse.json({ patrons: [] });
    }
    
    // Search for patrons by first name, last name, email, or username
    const patrons = await db.patron.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } }
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
      username: patron.username 
      ?? patron.email.split('@')[0], // Use email username as fallback
      profileImage: patron.profileImage,
      isCertifiedFoodie: patron.isCertifiedFoodie
    }));
    
    return NextResponse.json({ patrons: formattedPatrons });
    
  } catch (error) {
    console.error("Error searching patrons:", error);
    return NextResponse.json(
      { 
        error: "Failed to search patrons",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}