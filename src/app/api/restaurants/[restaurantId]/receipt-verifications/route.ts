// src/app/api/restaurants/[restaurantId]/receipt-verifications/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { restaurantId: string } }
): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get restaurant ID from URL params
    const restaurantId = params.restaurantId;
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID is required" }, { status: 400 });
    }

    // Get query params
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    
    // Build the query conditions
    const whereConditions: any = {
      restaurantId: restaurantId
    };
    
    if (status) {
      whereConditions.status = status;
    }

    // Verify the user has permission to view receipt verifications for this restaurant
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

    // Check if the restaurateur is authorized to view this restaurant's verifications
    let isAuthorized = false;
    
    // Direct restaurant owner check
    if (restaurateur.restaurant && restaurateur.restaurant.id === restaurantId) {
      isAuthorized = true;
    } else {
      // Check for approved connection to this restaurant
      const connectionRequest = await db.restaurantConnectionRequest.findFirst({
        where: {
          restaurateurId: restaurateur.id,
          restaurantId: restaurantId,
          status: "approved",
        },
      });
      
      if (connectionRequest) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "You are not authorized to view receipt verifications for this restaurant" },
        { status: 403 }
      );
    }

    // Fetch receipt verifications for this restaurant
    const receiptVerifications = await db.receiptVerification.findMany({
      where: whereConditions,
      include: {
        review: {
          select: {
            id: true,
            content: true,
            rating: true,
            patron: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        restaurant: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return NextResponse.json(receiptVerifications);
  } catch (error) {
    console.error("Error fetching receipt verifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt verifications" },
      { status: 500 }
    );
  }
}