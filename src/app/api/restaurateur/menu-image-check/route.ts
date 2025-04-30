// src/app/api/restaurateur/menu-image-check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Get the session
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get restaurateur ID from session or query
    const restaurateurId = session.user.restaurateurId || session.user.id;
    
    if (!restaurateurId) {
      return NextResponse.json({ error: "Restaurateur ID not found" }, { status: 400 });
    }

    // Fetch restaurateur record to check premium status
    const restaurateur = await db.restaurateur.findUnique({
      where: { id: restaurateurId },
    });

    if (!restaurateur) {
      return NextResponse.json({ error: "Restaurateur not found" }, { status: 404 });
    }

    // Check if restaurateur is premium
    const isPremium = restaurateur.isPremium;

    if (isPremium) {
      // Premium users have unlimited image uploads
      return NextResponse.json({
        isPremium: true,
        canUpload: true,
        remainingUploads: "unlimited",
        totalImagesUsed: 0
      });
    } else {
      // Non-premium users are limited to 2 menu item images
      // Count existing menu items with images across all restaurants managed by this restaurateur
      
      // First get all restaurants managed by this restaurateur
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
      
      // Now count menu items with images in these restaurants
      const menuItemsWithImages = await db.menuSection.findMany({
        where: {
          restaurantId: { in: restaurantIds }
        },
        include: {
          items: {
            where: {
              img_url: { not: null }
            },
            select: {
              id: true,
              img_url: true
            }
          }
        }
      });
      
      // Count total menu items with images
      let totalImagesUsed = 0;
      menuItemsWithImages.forEach(section => {
        totalImagesUsed += section.items.length;
      });
      
      const maxImagesAllowed = 2;
      const remainingUploads = Math.max(0, maxImagesAllowed - totalImagesUsed);
      
      return NextResponse.json({
        isPremium: false,
        canUpload: remainingUploads > 0,
        remainingUploads,
        totalImagesUsed,
        maxImagesAllowed
      });
    }
  } catch (error) {
    console.error("Error checking menu image upload status:", error);
    return NextResponse.json(
      { error: "Failed to check menu image upload status" }, 
      { status: 500 }
    );
  }
}