import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a restaurateur
    if (!session || !session.user || session.user.userType !== "restaurateur") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get restaurateur ID from session
    const restaurateurId = session.user.id;
    
    // Get current restaurateur to check bonuses available
    const restaurateur = await db.restaurateur.findUnique({
      where: { id: restaurateurId },
      select: { 
        referralBonusesEarned: true,
        referralBonusesUsed: true,
        isPremium: true,
        premiumExpiresAt: true
      }
    });
    
    if (!restaurateur) {
      return NextResponse.json({ error: "Restaurateur not found" }, { status: 404 });
    }
    
    // Calculate available bonuses
    const availableBonuses = (restaurateur.referralBonusesEarned || 0) - (restaurateur.referralBonusesUsed || 0);
    
    // Check if the restaurateur has any bonuses to use
    if (availableBonuses <= 0) {
      return NextResponse.json(
        { error: "No premium bonuses available to redeem" }, 
        { status: 400 }
      );
    }
    
    // Calculate new premium expiry date
    let newExpiryDate: Date;
    
    if (restaurateur.isPremium && restaurateur.premiumExpiresAt) {
      // If already premium, extend by 1 month
      newExpiryDate = new Date(restaurateur.premiumExpiresAt);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
    } else {
      // If not premium, set expiry to 1 month from now
      newExpiryDate = new Date();
      newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
    }
    
    // Update the restaurateur record
    const updatedRestaurateur = await db.restaurateur.update({
      where: { id: restaurateurId },
      data: {
        isPremium: true,
        premiumExpiresAt: newExpiryDate,
        referralBonusesUsed: { increment: 1 }
      },
      select: {
        id: true,
        isPremium: true,
        premiumExpiresAt: true,
        referralBonusesEarned: true,
        referralBonusesUsed: true
      }
    });
    
    // Calculate remaining available bonuses after redemption
    const remainingBonuses = 
      (updatedRestaurateur.referralBonusesEarned || 0) - 
      (updatedRestaurateur.referralBonusesUsed || 0);
    
    return NextResponse.json({
      success: true,
      message: "Premium month redeemed successfully",
      premiumStatus: {
        isPremium: updatedRestaurateur.isPremium,
        expiresAt: updatedRestaurateur.premiumExpiresAt,
        remainingBonuses
      }
    });
  } catch (error) {
    console.error("Error redeeming premium month:", error);
    return NextResponse.json(
      { error: "Failed to redeem premium month" }, 
      { status: 500 }
    );
  }
}