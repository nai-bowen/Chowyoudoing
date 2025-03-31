// src/app/api/profile/follow/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

// POST - Follow a user
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { targetPatronId } = body;
    
    if (!targetPatronId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }
    
    // Check if target user exists
    const targetPatron = await db.patron.findUnique({
      where: { id: targetPatronId }
    });
    
    if (!targetPatron) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }
    
    // Check if already following
    const existingFollow = await db.follow.findFirst({
      where: {
        followerId: session.user.id,
        followingId: targetPatronId
      }
    });
    
    if (existingFollow) {
      return NextResponse.json({ message: "Already following this user", isFollowing: true });
    }
    
    // Create follow relationship
    await db.follow.create({
      data: {
        follower: { connect: { id: session.user.id } },
        following: { connect: { id: targetPatronId } }
      }
    });
    
    return NextResponse.json({ message: "Successfully followed user", isFollowing: true });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
  }
}

// DELETE - Unfollow a user
export async function DELETE(req: NextRequest): Promise<NextResponse> {
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
    
    // Delete follow relationship
    await db.follow.deleteMany({
      where: {
        followerId: session.user.id,
        followingId: targetPatronId
      }
    });
    
    return NextResponse.json({ message: "Successfully unfollowed user", isFollowing: false });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 });
  }
}