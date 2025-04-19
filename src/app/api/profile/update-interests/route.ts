/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the user ID from the session
    const userId = session.user.id;
    
    // Parse the request body to get interests
    const body = await req.json();
    
    // Ensure interests is an array
    if (!Array.isArray(body.interests)) {
      return NextResponse.json({ error: "Interests must be an array" }, { status: 400 });
    }
    
    // Update the patron with the new interests
    const updatedPatron = await prisma.patron.update({
      where: { id: userId },
      data: { interests: body.interests }
    });
    
    return NextResponse.json({
      success: true,
      interests: updatedPatron.interests
    });
  } catch (error) {
    console.error("Error updating interests:", error);
    return NextResponse.json(
      { error: "Failed to update interests" },
      { status: 500 }
    );
  }
}