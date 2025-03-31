// src/app/api/profile/follow/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const targetPatronId = url.searchParams.get("targetPatronId");
    
    if (!targetPatronId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }
    
    // Check if following
    const existingFollow = await db.follow.findFirst({
      where: {
        followerId: session.user.id,
        followingId: targetPatronId
      }
    });
    
    return NextResponse.json({ isFollowing: !!existingFollow });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json({ error: "Failed to check follow status" }, { status: 500 });
  }
}