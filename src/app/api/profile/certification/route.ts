// /src/app/api/profile/certification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

// Define types for our API responses
interface CertificationEligibility {
  eligible: boolean;
  automaticApproval: boolean;
  reviewCount: number;
  upvoteCount: number;
  isAlreadyCertified: boolean;
  hasPendingRequest: boolean;
  certificationRequest?: {
    id: string;
    status: string;
    createdAt: string;
  };
}

interface CertificationRequestBody {
  justification?: string;
  socialMediaLink?: string;
}

// GET route - check eligibility for certification
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const patronId = session.user.id;
    
    // Check if user is already certified
    const patron = await db.patron.findUnique({
      where: { id: patronId },
      select: { 
        isCertifiedFoodie: true,
        certificationRequest: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    });
    
    if (!patron) {
      return NextResponse.json({ error: "Patron not found" }, { status: 404 });
    }
    
    // Count user's reviews
    const reviewCount = await db.review.count({
      where: { patronId }
    });
    
    // Sum total upvotes from user's reviews
    const reviews = await db.review.findMany({
      where: { patronId },
      select: { upvotes: true }
    });
    
    // Ensure upvotes is always a number, defaulting to 0 if null/undefined
    const upvoteCount = reviews.reduce((sum, review) => 
      sum + (typeof review.upvotes === 'number' ? review.upvotes : 0), 0);
    
    // Determine if user meets automatic approval criteria
    const meetsReviewCountCriteria = reviewCount >= 100;
    const meetsUpvoteCountCriteria = upvoteCount >= 100;
    const automaticApproval = meetsReviewCountCriteria || meetsUpvoteCountCriteria;
    
    // Prepare response
    const eligibilityData: CertificationEligibility = {
      eligible: true, // Everyone is eligible to apply
      automaticApproval,
      reviewCount,
      upvoteCount,
      isAlreadyCertified: patron.isCertifiedFoodie,
      hasPendingRequest: !!patron.certificationRequest && patron.certificationRequest.status === 'pending'
    };
    
    // Include certification request if it exists
    if (patron.certificationRequest) {
      eligibilityData.certificationRequest = {
        id: patron.certificationRequest.id,
        status: patron.certificationRequest.status,
        createdAt: patron.certificationRequest.createdAt.toISOString()
      };
    }
    
    return NextResponse.json(eligibilityData);
  } catch (error) {
    console.error("Error checking certification eligibility:", error);
    return NextResponse.json({ 
      error: "Failed to check eligibility", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// POST route - submit certification request
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const patronId = session.user.id;
    
    // Check if user is already certified
    const patron = await db.patron.findUnique({
      where: { id: patronId },
      select: { 
        isCertifiedFoodie: true,
        certificationRequest: true
      }
    });
    
    if (!patron) {
      return NextResponse.json({ error: "Patron not found" }, { status: 404 });
    }
    
    if (patron.isCertifiedFoodie) {
      return NextResponse.json({ 
        error: "Already certified", 
        message: "You are already a certified foodie!"
      }, { status: 400 });
    }
    
    if (patron.certificationRequest && patron.certificationRequest.status === 'pending') {
      return NextResponse.json({ 
        error: "Request pending", 
        message: "You already have a pending certification request"
      }, { status: 400 });
    }
    
    // Parse request body
    const body: CertificationRequestBody = await req.json();
    
    // Count user's reviews
    const reviewCount = await db.review.count({
      where: { patronId }
    });
    
    // Sum total upvotes from user's reviews
    const reviews = await db.review.findMany({
      where: { patronId },
      select: { upvotes: true }
    });
    
    const upvoteCount = reviews.reduce((sum, review) => 
      sum + (typeof review.upvotes === 'number' ? review.upvotes : 0), 0);
    
    // Determine if user meets automatic approval criteria
    const meetsReviewCountCriteria = reviewCount >= 100;
    const meetsUpvoteCountCriteria = upvoteCount >= 100;
    const automaticApproval = meetsReviewCountCriteria || meetsUpvoteCountCriteria;
    
    if (automaticApproval) {
      // If user meets criteria, automatically certify them
      await db.patron.update({
        where: { id: patronId },
        data: {
          isCertifiedFoodie: true,
          certificationDate: new Date(),
          certificationRequest: {
            create: {
              status: 'approved',
              justification: body.justification,
              socialMediaLink: body.socialMediaLink,
              reviewedAt: new Date(),
              reviewedBy: 'system:automatic'
            }
          }
        }
      });
      
      return NextResponse.json({
        success: true,
        message: "Congratulations! You are now a certified foodie.",
        automaticApproval: true
      });
    } else {
      // Otherwise, create a pending request
      await db.certificationRequest.create({
        data: {
          status: 'pending',
          justification: body.justification,
          socialMediaLink: body.socialMediaLink,
          patronId
        }
      });
      
      return NextResponse.json({
        success: true,
        message: "Your certification request has been submitted and is pending review.",
        automaticApproval: false
      });
    }
  } catch (error) {
    console.error("Error processing certification request:", error);
    return NextResponse.json({ 
      error: "Failed to process certification request", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}