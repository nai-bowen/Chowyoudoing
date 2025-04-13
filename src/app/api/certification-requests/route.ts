/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

interface CertificationRequestBody {
  justification: string;
  socialMediaLink?: string;
}

// Submit a certification request
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse request body
    const { justification, socialMediaLink } = await req.json() as CertificationRequestBody;
    
    // Validate justification
    if (!justification || justification.trim().length < 10) {
      return NextResponse.json({ 
        error: "Please provide a justification (minimum 10 characters)" 
      }, { status: 400 });
    }
    
    // Check if user already has a pending or approved request
    const existingRequest = await db.certificationRequest.findUnique({
      where: { patronId: session.user.id },
    });
    
    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return NextResponse.json({ 
          error: "You already have a pending certification request" 
        }, { status: 400 });
      } else if (existingRequest.status === "approved") {
        return NextResponse.json({ 
          error: "You are already a certified foodie" 
        }, { status: 400 });
      }
      
      // If the request was rejected, update it
      await db.certificationRequest.update({
        where: { id: existingRequest.id },
        data: {
          justification,
          socialMediaLink: socialMediaLink || null,
          status: "pending",
          reviewedAt: null,
          reviewedBy: null,
        },
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "Your certification request has been resubmitted" 
      });
    }
    
    // Create a new certification request
    const newRequest = await db.certificationRequest.create({
      data: {
        patronId: session.user.id,
        justification,
        socialMediaLink: socialMediaLink || null,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Your certification request has been submitted",
      request: newRequest
    });
  } catch (error) {
    console.error("Error creating certification request:", error);
    return NextResponse.json(
      { error: "Failed to submit certification request" },
      { status: 500 }
    );
  }
}

// Get current user's certification request status
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check for existing request
    const existingRequest = await db.certificationRequest.findUnique({
      where: { patronId: session.user.id },
    });
    
    // Check user certification status
    const user = await db.patron.findUnique({
      where: { id: session.user.id },
      select: { isCertifiedFoodie: true, certificationDate: true },
    });
    
    return NextResponse.json({
      request: existingRequest,
      isCertified: user?.isCertifiedFoodie || false,
      certificationDate: user?.certificationDate,
    });
  } catch (error) {
    console.error("Error fetching certification request:", error);
    return NextResponse.json(
      { error: "Failed to fetch certification request" },
      { status: 500 }
    );
  }
}