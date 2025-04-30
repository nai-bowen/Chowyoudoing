/*eslint-disable*/
// src/app/api/restaurateur/premium/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.userType !== "restaurateur") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const restaurateurId = session.user.id;
    const { planType } = await req.json();

    
    const now = new Date();
    const expiresAt = new Date();
    // Set expiration 30 days from now (example, adjust as needed)
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const updatedRestaurateur = await db.restaurateur.update({
      where: { id: restaurateurId },
      data: {
        isPremium: true,
        premiumSince: now,
        premiumExpiresAt: expiresAt,
      }
    });
    
    return NextResponse.json({
      success: true,
      premium: {
        since: updatedRestaurateur.premiumSince,
        expiresAt: updatedRestaurateur.premiumExpiresAt
      }
    });
  } catch (error) {
    console.error("Error updating premium status:", error);
    return NextResponse.json(
      { error: "Failed to update premium status" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.userType !== "restaurateur") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const restaurateurId = session.user.id;
    
    const restaurateur = await db.restaurateur.findUnique({
      where: { id: restaurateurId },
      select: {
        isPremium: true,
        premiumSince: true,
        premiumExpiresAt: true,
        responseQuotaRemaining: true,
        responseQuotaReset: true
      }
    });
    
    if (!restaurateur) {
      return NextResponse.json({ error: "Restaurateur not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      isPremium: restaurateur.isPremium,
      premiumSince: restaurateur.premiumSince,
      premiumExpiresAt: restaurateur.premiumExpiresAt,
      responseQuota: {
        remaining: restaurateur.responseQuotaRemaining,
        resetAt: restaurateur.responseQuotaReset
      }
    });
  } catch (error) {
    console.error("Error fetching premium status:", error);
    return NextResponse.json(
      { error: "Failed to fetch premium status" },
      { status: 500 }
    );
  }
}