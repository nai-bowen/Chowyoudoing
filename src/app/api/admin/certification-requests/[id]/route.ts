// src/app/api/admin/certification-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// Force params to be a Promise if your setup requires it
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get("Authorization");
    const providedPassword = authHeader?.split("Bearer ")?.[1];

    if (!providedPassword || providedPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract the id from the promise
    const { id } = await params;
    const { status, reviewedBy } = (await req.json()) as {
      status: string;
      reviewedBy: string;
    };

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status. Must be 'approved', 'rejected', or 'pending'",
        },
        { status: 400 }
      );
    }

    const certRequest = await db.certificationRequest.findUnique({
      where: { id },
    });

    if (!certRequest) {
      return NextResponse.json(
        { error: "Certification request not found" },
        { status: 404 }
      );
    }

    const updatedRequest = await db.certificationRequest.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewedBy || "Admin",
      },
    });

    if (status === "approved") {
      await db.patron.update({
        where: { id: certRequest.patronId },
        data: {
          isCertifiedFoodie: true,
          certificationDate: new Date(),
        },
      });
    } else if (status === "rejected" && certRequest.status === "approved") {
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
