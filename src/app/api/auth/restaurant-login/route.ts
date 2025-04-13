/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// JWT secret should be in your env variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email, password, businessRegNumber, vatNumber } = await req.json();

    // Validate required fields
    if (!email || !password || !businessRegNumber) {
      return NextResponse.json(
        { error: "Email, password, and business registration number are required" },
        { status: 400 }
      );
    }

    // Find RestaurateurAccount by email
    const restaurateurAccount = await db.restaurateurAccount.findUnique({
      where: { email },
      include: {
        restaurateur: true,
      },
    });

    // If no account found or not approved
    if (!restaurateurAccount || !restaurateurAccount.isApproved) {
      return NextResponse.json(
        { error: "Invalid credentials or account not approved" },
        { status: 401 }
      );
    }

    // Verify business registration number
    if (restaurateurAccount.businessRegNumber !== businessRegNumber) {
      return NextResponse.json(
        { error: "Invalid business registration number" },
        { status: 401 }
      );
    }

    // If VAT number is provided, verify it (if the account has one)
    if (vatNumber && restaurateurAccount.vatNumber && vatNumber !== restaurateurAccount.vatNumber) {
      return NextResponse.json(
        { error: "Invalid VAT number" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, restaurateurAccount.password || "");
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: restaurateurAccount.id,
        email: restaurateurAccount.email,
        restaurateurId: restaurateurAccount.restaurateurId,
        role: "restaurateur",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create a session cookie
    const cookieStore = cookies();
    (await cookieStore).set("restaurateur_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Return user info (excluding sensitive data)
    return NextResponse.json({
      user: {
        id: restaurateurAccount.restaurateurId,
        email: restaurateurAccount.email,
        restaurantName: restaurateurAccount.restaurateur?.restaurantName || "",
      },
      message: "Authentication successful",
    });
  } catch (error) {
    console.error("Restaurateur login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}