import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { VerificationStatus } from "@prisma/client";

// Environment variables should be set in your .env file
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const requestId = params.id;
    
    // Validate admin authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { status } = body;

    // Map string status to enum
    let verificationStatus: VerificationStatus;
    if (status === "pending") {
      verificationStatus = VerificationStatus.PENDING;
    } else if (status === "approved") {
      verificationStatus = VerificationStatus.APPROVED;
    } else if (status === "rejected") {
      verificationStatus = VerificationStatus.REJECTED;
    } else {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Get the current request to check if we need to update the restaurant
    const currentRequest = await db.restaurateur.findUnique({
      where: { id: requestId },
      include: {
        restaurant: true,
        accounts: true, // Include existing accounts to check if we need to create one
      },
    });

    if (!currentRequest) {
      return NextResponse.json(
        { error: "Restaurant request not found" },
        { status: 404 }
      );
    }

    // If approving, check for business registration number (required for approval)
    if (verificationStatus === VerificationStatus.APPROVED && !currentRequest.businessRegNumber) {
      return NextResponse.json(
        { error: "Business Registration Number is required for approval" },
        { status: 400 }
      );
    }
    
    // Check if we're changing the status to APPROVED and there's no account yet
    const isNewlyApproved = verificationStatus === VerificationStatus.APPROVED && 
                          currentRequest.verificationStatus !== VerificationStatus.APPROVED;
    const needsAccount = isNewlyApproved && currentRequest.accounts.length === 0;

    // Use transaction to ensure all updates happen together
    const result = await db.$transaction(async (prisma) => {
      // Update the restaurateur record
      const updateData: {
        verificationStatus: VerificationStatus;
        approvedAt?: Date | null;
      } = {
        verificationStatus: verificationStatus,
      };

      // If approving, set the approval date
      if (verificationStatus === VerificationStatus.APPROVED) {
        updateData.approvedAt = new Date();
      } else if (verificationStatus === VerificationStatus.REJECTED || verificationStatus === VerificationStatus.PENDING) {
        // If rejecting or resetting to pending, clear the approval date
        updateData.approvedAt = null;
      }

      const updatedRequest = await prisma.restaurateur.update({
        where: { id: requestId },
        data: updateData,
        include: {
          restaurant: true,
        },
      });

      // If we need to create a RestaurateurAccount for credentials-based login
      if (needsAccount) {
        // Copy the relevant fields from Restaurateur to RestaurateurAccount
        await prisma.restaurateurAccount.create({
          data: {
            restaurateurId: requestId,
            type: "credentials",
            provider: "credentials",
            providerAccountId: currentRequest.email, // Use email as the provider account ID
            
            // Copy these fields from the Restaurateur model
            email: currentRequest.email,
            password: currentRequest.password, // Already hashed from registration
            businessRegNumber: currentRequest.businessRegNumber,
            vatNumber: currentRequest.vatNumber,
            isApproved: true, // Set to true since we're approving it
          }
        });

        console.log(`Created RestaurateurAccount for restaurateur ${requestId} with complete business data`);
      }

      return updatedRequest;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating restaurant request:", error);
    return NextResponse.json(
      { error: "Failed to update restaurant request" },
      { status: 500 }
    );
  }
}