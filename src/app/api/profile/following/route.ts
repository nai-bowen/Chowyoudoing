// src/app/api/profile/following/route.ts
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
    
    // Fetch users that the current user is following
    const following = await db.follow.findMany({
      where: {
        followerId: session.user.id
      },
      select: {
        following: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profileImage: true,
            isCertifiedFoodie: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    // Extract user data from following relationships
    const followingUsers = following.map(f => f.following);
    
    return NextResponse.json({ following: followingUsers });
  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 }
    );
  }
}