import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signJwt } from "@/lib/jwt"; // Helper for JWT signing

const prisma = new PrismaClient();

interface LoginRequestBody {
  email: string;
  password: string;
}

export async function POST(req: Request) {
  try {
    // Parse the request body with explicit typing
    const body = (await req.json()) as LoginRequestBody;
    const { email, password } = body;
    
    // Check if both email and password are provided
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Look up the user in the database
    const user = await prisma.patron.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid: boolean = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create a session token (JWT) with typed user properties
    const token: string = signJwt({ id: user.id, email: user.email });

    // Return token to the frontend (or set as a cookie if preferred)
    return NextResponse.json({ message: "Login successful", token }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
