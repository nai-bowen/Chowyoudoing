/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { signIn } from "next-auth/react";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";

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

   // Check if a NextAuth session already exists
   const existingSession = await getServerSession(authOptions);
   if (existingSession) {
     return NextResponse.json({
       user: {
         id: existingSession.user.id,
         email: existingSession.user.email,
         restaurantName: (existingSession.user as any).restaurantName || "",
       },
       message: "Already authenticated",
     });
   }

   // Find RestaurateurAccount by email for validation
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

   // Verify password - This verification is redundant as NextAuth will do it,
   // but we can keep it for additional validation
   const passwordMatch = await bcrypt.compare(password, restaurateurAccount.password || "");
   if (!passwordMatch) {
     return NextResponse.json(
       { error: "Invalid credentials" },
       { status: 401 }
     );
   }

   // We can't use signIn directly from an API route since it's a client function
   // Instead, we'll guide the client to use NextAuth's signIn function

   return NextResponse.json({
     user: {
       id: restaurateurAccount.restaurateurId,
       email: restaurateurAccount.email,
       restaurantName: restaurateurAccount.restaurateur?.restaurantName || "",
     },
     nextAuthRequired: true,
     message: "Validation successful, please use NextAuth signIn on the client",
   });
 } catch (error) {
   console.error("Restaurateur login error:", error);
   return NextResponse.json(
     { error: "Authentication failed", details: error instanceof Error ? error.message : String(error) },
     { status: 500 }
   );
 }
}