// src/app/api/restaurateur/menu-items/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

// Create a new menu item
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get request body
    const body = await req.json();
    const { 
      menuSectionId, 
      name, 
      description, 
      price, 
      img_url, 
      status = "available",
      interestId 
    } = body;
    
    // Validate required fields
    if (!menuSectionId || !name || !price) {
      return NextResponse.json(
        { error: "menuSectionId, name, and price are required" }, 
        { status: 400 }
      );
    }

    // Check if menu section exists
    const menuSection = await db.menuSection.findUnique({
      where: { id: menuSectionId },
    });

    if (!menuSection) {
      return NextResponse.json(
        { error: "Menu section not found" }, 
        { status: 404 }
      );
    }

    // Create the menu item
    const menuItem = await db.menuItem.create({
      data: {
        name,
        description: description || null,
        price,
        img_url: img_url || null,
        status,
        menuSectionId,
        interestId: interestId || null,
      },
    });

    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" }, 
      { status: 500 }
    );
  }
}