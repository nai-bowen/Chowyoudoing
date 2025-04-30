/*eslint-disable*/
// src/app/api/restaurateur/menu-items/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

// Update a menu item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get item ID from URL params
    const { id: itemId } = await params;
    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    // Get request body
    const body = await req.json();
    const { name, description, price, menuSectionId, interestId, img_url } = body;

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: "name and price are required" }, 
        { status: 400 }
      );
    }

    // Check if the item exists
    const existingItem = await db.menuItem.findUnique({
      where: { id: itemId },
      include: {
        menuSection: {
          include: {
            restaurant: true
          }
        }
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    // If image URL is being added or changed, and there wasn't one before, check premium status and quota
    const addingOrChangingImage = img_url && img_url !== existingItem.img_url;
    
    if (addingOrChangingImage && !existingItem.img_url) {
      const restaurateurId = session.user.restaurateurId || session.user.id;

      // Get premium status
      const restaurateur = await db.restaurateur.findUnique({
        where: { id: restaurateurId }
      });

      if (!restaurateur) {
        return NextResponse.json({ error: "Restaurateur not found" }, { status: 404 });
      }

      // If not premium, check if they've exceeded their quota
      if (!restaurateur.isPremium) {
        // Count existing menu items with images
        const restaurants = await db.restaurant.findMany({
          where: {
            OR: [
              { restaurateurs: { some: { id: restaurateurId } } },
              { connectionRequests: { some: { restaurateurId, status: "approved" } } }
            ]
          },
          select: { id: true }
        });
        
        const restaurantIds = restaurants.map(r => r.id);
        
        // Count menu items with images
        const menuItemsWithImages = await db.menuSection.findMany({
          where: {
            restaurantId: { in: restaurantIds }
          },
          include: {
            items: {
              where: {
                img_url: { not: null },
                id: { not: itemId } // Exclude the current item
              },
              select: { id: true }
            }
          }
        });
        
        let totalImagesUsed = 0;
        menuItemsWithImages.forEach(section => {
          totalImagesUsed += section.items.length;
        });
        
        // Non-premium users can only have 2 menu item images
        if (totalImagesUsed >= 2) {
          return NextResponse.json(
            { 
              error: "Image upload limit reached", 
              premiumRequired: true,
              message: "You've reached the limit of 2 menu item images. Upgrade to premium for unlimited images."
            }, 
            { status: 429 }
          );
        }
      }
    }

    // Update the item
    const updatedData: any = {
      name,
      description: description || null,
      price,
      interestId: interestId || null,
    };

    // Only update menuSectionId if provided
    if (menuSectionId) {
      updatedData.menuSectionId = menuSectionId;
    }

    // Only update img_url if provided
    if (img_url !== undefined) {
      updatedData.img_url = img_url || null;
    }

    const updatedItem = await db.menuItem.update({
      where: { id: itemId },
      data: updatedData,
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// Delete a menu item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get item ID from URL params
    const { id: itemId } = await params;
    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    // Check if the item exists
    const item = await db.menuItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    // Delete the item
    await db.menuItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}