// src/app/api/restaurateur/validate-referral/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the code from query string
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    if (!code) {
      return NextResponse.json({ 
        valid: false, 
        message: "No code provided" 
      });
    }
    
    // Check if the code exists in the database
    const restaurateur = await prisma.restaurateur.findUnique({
      where: { referralCode: code },
      select: {
        id: true,
        restaurantName: true,
        verificationStatus: true
      }
    });
    
    // Valid only if restaurateur exists and is approved
    if (restaurateur && restaurateur.verificationStatus === "APPROVED") {
      return NextResponse.json({
        valid: true,
        restaurateurName: restaurateur.restaurantName
      });
    }
    
    // If the restaurateur exists but isn't approved, give a different message
    if (restaurateur) {
      return NextResponse.json({
        valid: false,
        message: "This code belongs to an account that is not yet approved"
      });
    }
    
    // If no restaurateur found with this code
    return NextResponse.json({
      valid: false,
      message: "Invalid referral code"
    });
    
  } catch (error) {
    console.error("Error validating referral code:", error);
    return NextResponse.json(
      { 
        valid: false, 
        message: "Error validating code" 
      }, 
      { status: 500 }
    );
  }
}