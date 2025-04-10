// src/app/api/admin/review-flags/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// Environment variables should be set in your .env file
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Get flag ID from URL params
    const flagId = params.id;
    if (!flagId) {
      return NextResponse.json({ error: "Flag ID is required" }, { status: 400 });
    }

    // Validate admin authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { status, deleteReview } = body;

    if (!status || !["pending", "reviewed", "dismissed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending', 'reviewed', or 'dismissed'" },
        { status: 400 }
      );
    }

    // Check if the flag exists
    const flag = await db.reviewFlag.findUnique({
      where: { id: flagId },
      include: {
        review: true,
      },
    });

    if (!flag) {
      return NextResponse.json(
        { error: "Flag not found" },
        { status: 404 }
      );
    }

    // Update the flag status
    const updatedFlag = await db.reviewFlag.update({
      where: { id: flagId },
      data: {
        status,
        reviewedAt: new Date(),
      },
    });

    // If the flag is approved and deleteReview is true, delete the review
    if (status === "reviewed" && deleteReview === true && flag.review) {
      await db.review.delete({
        where: { id: flag.review.id },
      });
    }

    return NextResponse.json(updatedFlag);
  } catch (error) {
    console.error("Error updating flag:", error);
    return NextResponse.json(
      { error: "Failed to update flag" },
      { status: 500 }
    );
  }
}