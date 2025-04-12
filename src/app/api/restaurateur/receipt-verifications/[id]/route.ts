// src/app/api/restaurateur/receipt-verifications/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get verification ID from URL params
    const verificationId = params.id;
    if (!verificationId) {
      return NextResponse.json({ error: "Verification ID is required" }, { status: 400 });
    }

    // Get request body
    const body = await req.json();
    const { status, reviewedBy } = body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending', 'approved', or 'rejected'" },
        { status: 400 }
      );
    }

    // Verify this receipt verification exists
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

    // Verify the user has permission to update this verification
    // This would require checking if the user is associated with the restaurant
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    // Find the restaurateur by email
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

    // Check if the restaurateur is authorized to update this verification
    let isAuthorized = false;
    
    // Direct restaurant owner check
    if (restaurateur.restaurant && restaurateur.restaurant.id === receiptVerification.restaurantId) {
      isAuthorized = true;
    } else {
      // Check for approved connection to this restaurant
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

    // Update the receipt verification
    const updatedVerification = await db.receiptVerification.update({
      where: { id: verificationId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewedBy || restaurateur.id,
      },
    });

    // If the verification is approved and linked to a review, update the review's verified status
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