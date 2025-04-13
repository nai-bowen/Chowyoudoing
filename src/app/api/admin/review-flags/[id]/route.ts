/*eslint-disable*/
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: flagId } = await params;

    if (!flagId) {
      return NextResponse.json({ error: "Flag ID is required" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    const body = await req.json();
    const { status, deleteReview } = body;

    if (!status || !["pending", "reviewed", "dismissed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending', 'reviewed', or 'dismissed'" },
        { status: 400 }
      );
    }

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

    const updatedFlag = await db.reviewFlag.update({
      where: { id: flagId },
      data: {
        status,
        reviewedAt: new Date(),
      },
    });

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
