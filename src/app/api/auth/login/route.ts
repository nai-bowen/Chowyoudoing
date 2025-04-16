// src/app/api/auth/login/route.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signJwt } from "@/lib/jwt";

const prisma = new PrismaClient();

interface LoginRequestBody {
  email: string;
  password: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as LoginRequestBody;
    
    // Normalize the email by trimming and converting to lowercase
    const email = body.email.trim().toLowerCase();
    const { password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Try multiple approaches to find the user
    let user = await prisma.patron.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive", // Case-insensitive comparison
        },
      },
    });

    // If user not found with insensitive mode, try direct lowercase comparison
    if (!user) {
      user = await prisma.patron.findFirst({
        where: {
          email: email, // By now, email is already lowercase
        },
      });
    }

    // Log the search process (remove in production)
    console.log(`Login attempt for email: ${email}, user found: ${!!user}`);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signJwt({ id: user.id, email: user.email });
    return NextResponse.json({ message: "Login successful", token }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}