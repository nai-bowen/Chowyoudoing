/*eslint-disable*/
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: verificationId } = await params;

  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!verificationId) {
      return NextResponse.json({ error: "Verification ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { status, reviewedBy } = body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending', 'approved', or 'rejected'" },
        { status: 400 }
      );
    }

    const receiptVerification = await db.receiptVerification.findUnique({
      where: { id: verificationId },
      include: {
        restaurant: true,
      },
    });

    if (!receiptVerification) {
      return NextResponse.json(
        { error: "Receipt verification not found" },
        { status: 404 }
      );
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    const restaurateur = await db.restaurateur.findFirst({
      where: { 
        OR: [
          { email: userEmail },
          { contactPersonEmail: userEmail }
        ]
      },
      include: {
        restaurant: true,
      },
    });

    if (!restaurateur) {
      return NextResponse.json(
        { error: "Restaurateur not found" },
        { status: 404 }
      );
    }

    let isAuthorized = false;

    if (restaurateur.restaurant && restaurateur.restaurant.id === receiptVerification.restaurantId) {
      isAuthorized = true;
    } else {
      const connectionRequest = await db.restaurantConnectionRequest.findFirst({
        where: {
          restaurateurId: restaurateur.id,
          restaurantId: receiptVerification.restaurantId,
          status: "approved",
        },
      });

      if (connectionRequest) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "You are not authorized to update this receipt verification" },
        { status: 403 }
      );
    }

    const updatedVerification = await db.receiptVerification.update({
      where: { id: verificationId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewedBy || restaurateur.id,
      },
    });

    if (status === "approved" && receiptVerification.reviewId) {
      await db.review.update({
        where: { id: receiptVerification.reviewId },
        data: {
          isVerified: true,
        },
      });
    }

    return NextResponse.json(updatedVerification);
  } catch (error) {
    console.error("Error updating receipt verification:", error);
    return NextResponse.json(
      { error: "Failed to update receipt verification" },
      { status: 500 }
    );
  }
}
