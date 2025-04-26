// File: src/app/api/auth/register/route.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { isValidReferralCode } from "@/lib/referral"; // IMPORT THIS

const prisma = new PrismaClient();

interface RegisterRequestBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  interests?: string[];
  referredBy?: string | null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as RegisterRequestBody;

    if (!body.firstName || !body.lastName || !body.email || !body.password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const email = body.email.toLowerCase().trim();

    const existingPatron = await prisma.patron.findUnique({ where: { email } });

    if (existingPatron) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    let referredBy = null;

    if (body.referredBy) {
      const isValid = await isValidReferralCode(body.referredBy);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
      }
      referredBy = body.referredBy;
    }

    const newPatron = await prisma.patron.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email,
        password: hashedPassword,
        interests: Array.isArray(body.interests) ? body.interests : [],
        referredBy: referredBy,
      },
    });

    //  After creating the patron, record the referral
    if (referredBy) {
      const { recordReferral } = await import("@/lib/referral");
      await recordReferral(referredBy, newPatron.id, "patron");
    }

    const { password, ...patronWithoutPassword } = newPatron;

    return NextResponse.json(
      { message: "User registered successfully", user: patronWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

