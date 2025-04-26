/*eslint-disable*/

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import crypto from "crypto";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.userType !== "restaurateur") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurateurId = session.user.id;

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
      
      // Add referral-related fields
      referralCode: true,
      referralPoints: true,
      referralBonusesEarned: true,
      referralBonusesUsed: true,
      
      // Include premium status in response
      isPremium: true,
      premiumExpiresAt: true,
      
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

  // Fetch referred restaurateurs (if a referral code exists)
  let referredRestaurateurs: any[] = [];
  if (restaurateur.referralCode) {
    referredRestaurateurs = await db.restaurateur.findMany({
      where: { 
        referredBy: restaurateur.referralCode,
        verificationStatus: "APPROVED" // Only count approved restaurants
      },
      select: {
        id: true,
        restaurantName: true,
        approvedAt: true, // When they were approved
        verificationStatus: true,
        submittedAt: true // When they registered
      },
      orderBy: {
        approvedAt: 'desc' // Order by most recent first
      },
      take: 5 // Limit to the 5 most recent
    });
  }

  // Calculate referral stats for the dashboard
  const referralStats = {
    totalReferrals: restaurateur.referralPoints || 0,
    successfulReferrals: restaurateur.referralPoints || 0, // Same as totalReferrals since we only count successful ones
    bonusesEarned: restaurateur.referralBonusesEarned || 0,
    bonusesAvailable: (restaurateur.referralBonusesEarned || 0) - (restaurateur.referralBonusesUsed || 0),
    nextBonusAt: 5 - ((restaurateur.referralPoints || 0) % 5) // Calculate remaining referrals needed for next bonus
  };

  // Add the referral stats and referred restaurateurs to the response
  const responseData = {
    ...restaurateur,
    referralStats,
    referredRestaurateurs
  };

  return NextResponse.json(responseData);
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a restaurateur
    if (!session || !session.user || session.user.userType !== "restaurateur") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get restaurateur ID from session
    const restaurateurId = session.user.id;
    
    // Parse request body
    const body = await req.json();
    
    // Get current restaurateur to check existing referral code
    const existingRestaurateur = await db.restaurateur.findUnique({
      where: { id: restaurateurId },
      select: { referralCode: true }
    });
    
    // If restaurateur already has a referral code, don't generate a new one
    if (body.referralCode === "generate" && existingRestaurateur?.referralCode) {
      return NextResponse.json({
        message: "Referral code already exists",
        referralCode: existingRestaurateur.referralCode
      });
    }
    
    // Update fields based on request body
    const updateData: Record<string, any> = {};
    
    // Handle referral code - generate a new one if requested
    if (body.referralCode === "generate") {
      // Generate a random referral code
      const code = generateReferralCode();
      updateData.referralCode = code;
    } else if (body.referralCode && body.referralCode !== "generate") {
      // Direct update of referral code (for admin purposes)
      updateData.referralCode = body.referralCode;
    }
    
    // Add other updateable fields here
    // For example:
    if (body.addressLine1) updateData.addressLine1 = body.addressLine1;
    if (body.addressLine2 !== undefined) updateData.addressLine2 = body.addressLine2;
    if (body.city) updateData.city = body.city;
    if (body.postalCode) updateData.postalCode = body.postalCode;
    if (body.country) updateData.country = body.country;
    if (body.contactPersonName) updateData.contactPersonName = body.contactPersonName;
    if (body.contactPersonPhone) updateData.contactPersonPhone = body.contactPersonPhone;
    
    // Only update if there are changes to make
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes to update" });
    }
    
    // Update the restaurateur record
    const updatedRestaurateur = await db.restaurateur.update({
      where: { id: restaurateurId },
      data: updateData,
      select: {
        id: true,
        email: true,
        restaurantName: true,
        referralCode: true,
        referralPoints: true,
        referralBonusesEarned: true,
        referralBonusesUsed: true
      },
    });
    
    // Calculate referral stats for the updated restaurateur
    const referralStats = {
      totalReferrals: updatedRestaurateur.referralPoints || 0,
      successfulReferrals: updatedRestaurateur.referralPoints || 0,
      bonusesEarned: updatedRestaurateur.referralBonusesEarned || 0,
      bonusesAvailable: (updatedRestaurateur.referralBonusesEarned || 0) - (updatedRestaurateur.referralBonusesUsed || 0),
      nextBonusAt: 5 - ((updatedRestaurateur.referralPoints || 0) % 5)
    };
    
    return NextResponse.json({
      ...updatedRestaurateur,
      referralStats
    });
  } catch (error) {
    console.error("Error updating restaurateur profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" }, 
      { status: 500 }
    );
  }
}

// Helper function to generate a random referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed potentially confusing characters like O, 0, 1, I
  const codeLength = 8;
  let code = '';
  
  const randomBytes = crypto.randomBytes(codeLength);
  
  for (let i = 0; i < codeLength; i++) {
    const byte = randomBytes[i]!;
    const randomIndex = byte % chars.length;
    code += chars.charAt(randomIndex);
  }
  
  return code;
}