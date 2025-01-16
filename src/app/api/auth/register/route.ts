import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as { 
          firstName: string; 
          lastName: string; 
          email: string; 
          password: string; 
          interests?: string 
        };
    
        if (!body.firstName || !body.lastName || !body.email || !body.password) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
      const existingPatron = await prisma.patron.findUnique({
        where: { email: body.email },
      });
  
      if (existingPatron) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 });
      }
  
      const hashedPassword = await bcrypt.hash(body.password, 10);
  
      const newPatron = await prisma.patron.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          password: hashedPassword,
          interests: body.interests ?? null, // Ensure `interests` is either a string or null
        },
      });
  
      return NextResponse.json({ message: "User registered successfully", user: newPatron }, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
  