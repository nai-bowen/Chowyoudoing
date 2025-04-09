// src/app/api/restaurateur/profile/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/server/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  id: string;
  email: string;
  restaurateurId: string;
  role: string;
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    // Get restaurateur token from cookies
    const cookieStore = cookies();
    const token = (await cookieStore).get("restaurateur_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (!decoded || decoded.role !== "restaurateur") {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const restaurateurId = decoded.restaurateurId;
    
    // Fetch restaurateur profile
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
      },
    });

    if (!restaurateur) {
      return NextResponse.json({ error: "Restaurateur profile not found" }, { status: 404 });
    }

    return NextResponse.json(restaurateur);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    
    console.error("Error fetching restaurateur profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurateur profile" }, 
      { status: 500 }
    );
  }
}