// src/app/api/restaurateur/menu-sections/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

// Update a menu section
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get section ID from URL params
    const sectionId = params.id;
    if (!sectionId) {
      return NextResponse.json({ error: "Section ID is required" }, { status: 400 });
    }

    // Get request body
    const body = await req.json();
    const { category, interestId } = body;
    
    // Validate required fields
    if (!category) {
      return NextResponse.json(
        { error: "category is required" }, 
        { status: 400 }
      );
    }

    // Check if the menu section exists
    const section = await db.menuSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return NextResponse.json(
        { error: "Menu section not found" },
        { status: 404 }
      );
    }

    // Update the menu section
    const updatedSection = await db.menuSection.update({
      where: { id: sectionId },
      data: {
        category,
        interestId: interestId || null,
      },
    });

    return NextResponse.json(updatedSection);
  } catch (error) {
    console.error("Error updating menu section:", error);
    return NextResponse.json(
      { error: "Failed to update menu section" },
      { status: 500 }
    );
  }
}

// Delete a menu section
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get section ID from URL params
    const sectionId = params.id;
    if (!sectionId) {
      return NextResponse.json({ error: "Section ID is required" }, { status: 400 });
    }

    // Check if the menu section exists
    const section = await db.menuSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return NextResponse.json(
        { error: "Menu section not found" },
        { status: 404 }
      );
    }

    // Delete the menu section (cascades to menu items)
    await db.menuSection.delete({
      where: { id: sectionId },
    });

    return NextResponse.json({ message: "Menu section deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu section:", error);
    return NextResponse.json(
      { error: "Failed to delete menu section" },
      { status: 500 }
    );
  }
}