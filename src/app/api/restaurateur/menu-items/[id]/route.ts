/*eslint-disable*/
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

// Update a menu item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: itemId } = await params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { 
      name, 
      description, 
      price, 
      img_url, 
      status,
      menuSectionId,
      interestId 
    } = body;

    console.log("Update menu item request:", { itemId, body });

    if (!name || !price) {
      return NextResponse.json(
        { error: "name and price are required" }, 
        { status: 400 }
      );
    }

    const item = await db.menuItem.findUnique({
      where: { id: itemId },
      include: {
        menuSection: {
          select: {
            restaurantId: true
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    const restaurantId = item.menuSection.restaurantId;
    console.log("Restaurant ID from menu section:", restaurantId);

    const updatedItem = await db.menuItem.update({
      where: { id: itemId },
      data: {
        name,
        description: description || null,
        price,
        img_url: img_url || item.img_url,
        status: status || item.status,
        menuSectionId: menuSectionId || item.menuSectionId,
        interestId: interestId || null,
      },
    });

    console.log("Updated menu item:", updatedItem);
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Delete a menu item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: itemId } = await params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const item = await db.menuItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    await db.menuItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
