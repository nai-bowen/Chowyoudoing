// src/app/api/restaurateur/profile/route.ts
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.userType !== "restaurateur") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurateurId = session.user.restaurateurId;

  const restaurateur = await db.restaurateur.findUnique({
    where: { id: restaurateurId },
    select: {
      id: true,
      email: true,
      restaurantName: true,
      businessRegNumber: true,
      vatNumber: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      postalCode: true,
      country: true,
      contactPersonName: true,
      contactPersonPhone: true,
      contactPersonEmail: true,
      verificationStatus: true,
      submittedAt: true,
      approvedAt: true,
      restaurantId: true,
      _count: {
        select: {
          connectionRequests: true
        }
      }
    }
  });

  if (!restaurateur) {
    return NextResponse.json({ error: "Restaurateur profile not found" }, { status: 404 });
  }

  return NextResponse.json(restaurateur);
}
