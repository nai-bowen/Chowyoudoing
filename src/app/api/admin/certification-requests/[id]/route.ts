// src/app/api/admin/certification-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

interface RouteParams {
  params: {
    id: string;
  };
}

// Update certification request status
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // Check admin password
    const authHeader = req.headers.get("Authorization");
    const providedPassword = authHeader?.split("Bearer ")?.[1];

    if (!providedPassword || providedPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { status, reviewedBy } = await req.json() as { status: string; reviewedBy: string };

    // Validate input
    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'approved', 'rejected', or 'pending'" },
        { status: 400 }
      );
    }

    // Get the certification request to check if it exists
    const certRequest = await db.certificationRequest.findUnique({
      where: { id },
    });

    if (!certRequest) {
      return NextResponse.json(
        { error: "Certification request not found" },
        { status: 404 }
      );
    }

    // Update the certification request
    const updatedRequest = await db.certificationRequest.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewedBy || "Admin",
      },
    });

    // If approved, update the patron's certification status
    if (status === "approved") {
      await db.patron.update({
        where: { id: certRequest.patronId },
        data: {
          isCertifiedFoodie: true,
          certificationDate: new Date(),
        },
      });
    } else if (status === "rejected" && certRequest.status === "approved") {
      // If previously approved and now rejected, remove certification
      await db.patron.update({
        where: { id: certRequest.patronId },
        data: {
          isCertifiedFoodie: false,
          certificationDate: null,
        },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating certification request:", error);
    return NextResponse.json(
      { error: "Failed to update certification request" },
      { status: 500 }
    );
  }
}