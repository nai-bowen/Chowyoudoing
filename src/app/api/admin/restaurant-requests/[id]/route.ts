/*eslint-disable*/
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { VerificationStatus } from "@prisma/client";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: requestId } = await params;

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

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

    const currentRequest = await db.restaurateur.findUnique({
      where: { id: requestId },
      include: {
        restaurant: true,
        accounts: true,
      },
    });

    if (!currentRequest) {
      return NextResponse.json(
        { error: "Restaurant request not found" },
        { status: 404 }
      );
    }

    if (verificationStatus === VerificationStatus.APPROVED && !currentRequest.businessRegNumber) {
      return NextResponse.json(
        { error: "Business Registration Number is required for approval" },
        { status: 400 }
      );
    }

    const isNewlyApproved = verificationStatus === VerificationStatus.APPROVED && 
                          currentRequest.verificationStatus !== VerificationStatus.APPROVED;
    const needsAccount = isNewlyApproved && currentRequest.accounts.length === 0;

    const result = await db.$transaction(async (prisma) => {
      const updateData: {
        verificationStatus: VerificationStatus;
        approvedAt?: Date | null;
      } = {
        verificationStatus: verificationStatus,
      };

      if (verificationStatus === VerificationStatus.APPROVED) {
        updateData.approvedAt = new Date();
      } else if (verificationStatus === VerificationStatus.REJECTED || verificationStatus === VerificationStatus.PENDING) {
        updateData.approvedAt = null;
      }

      const updatedRequest = await prisma.restaurateur.update({
        where: { id: requestId },
        data: updateData,
        include: {
          restaurant: true,
        },
      });

      if (needsAccount) {
        await prisma.restaurateurAccount.create({
          data: {
            restaurateurId: requestId,
            type: "credentials",
            provider: "credentials",
            providerAccountId: currentRequest.email,
            email: currentRequest.email,
            password: currentRequest.password,
            businessRegNumber: currentRequest.businessRegNumber,
            vatNumber: currentRequest.vatNumber,
            isApproved: true,
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
