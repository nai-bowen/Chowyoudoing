import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// Define comprehensive types
interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string | null;
  reviewCount: number;  // Add this to track number of reviews
  reviews?: Array<{     // Optional reviews array
    id: string;
    content: string;
    rating: number;
  }>;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ restaurantId: string }> }
): Promise<NextResponse> {
  const { restaurantId } = await context.params;

  try {
    const menuSections = await db.menuSection.findMany({
      where: { restaurantId },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
            reviews: {
              select: {
                id: true,
                content: true,
                rating: true,
                upvotes: true
              }
            }
          }
        }
      },
      orderBy: { category: 'asc' }
    });

    // Format the data with proper TypeScript types
    const allItems: MenuItem[] = [];
    const itemsByCategory: Record<string, MenuItem[]> = {};

    // Process menu sections
    for (const section of menuSections) {
      const category = section.category;
      
      // Initialize the category array
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      
      // Process items in this section with reviews data
      for (const item of section.items) {
        const formattedItem: MenuItem = {
          id: item.id,
          name: item.name,
          price: item.price,
          category,
          description: item.description,
          reviewCount: item.reviews ? item.reviews.length : 0,
          reviews: item.reviews
        };

        allItems.push(formattedItem);
        itemsByCategory[category].push(formattedItem);
      }
    }

    return NextResponse.json({
      restaurantId,
      items: allItems,
      itemsByCategory
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}