// src/app/api/restaurateur/interests/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

// GET all interests
export async function GET(_req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all interests
    const interests = await db.interest.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(interests);
  } catch (error) {
    console.error("Error fetching interests:", error);
    return NextResponse.json(
      { error: "Failed to fetch interests" }, 
      { status: 500 }
    );
  }
}