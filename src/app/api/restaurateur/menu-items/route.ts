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
    const { name, description, price, menuSectionId, interestId, img_url } = body;

    // Validate required fields
    if (!name || !price || !menuSectionId) {
      return NextResponse.json(
        { error: "name, price, and menuSectionId are required" }, 
        { status: 400 }
      );
    }

    // Check if menu section exists
    const menuSection = await db.menuSection.findUnique({
      where: { id: menuSectionId },
      include: { restaurant: true }
    });

    if (!menuSection) {
      return NextResponse.json(
        { error: "Menu section not found" }, 
        { status: 404 }
      );
    }

    // If an image URL is provided, check premium status and quota
    if (img_url) {
      const restaurateurId = session.user.restaurateurId || session.user.id;

      // Get premium status and image quota
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
                img_url: { not: null }
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

    // Create the menu item
    const menuItem = await db.menuItem.create({
      data: {
        name,
        description: description || null,
        price,
        menuSectionId,
        interestId: interestId || null,
        img_url: img_url || null,
        status: "active", // Default status
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