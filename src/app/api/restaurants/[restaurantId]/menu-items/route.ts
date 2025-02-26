import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// Define item type to avoid TypeScript errors
interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string | null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ restaurantId: string }> }
): Promise<NextResponse> {
  const { restaurantId } = await context.params;  // Await in case params is a Promise

  try {
    // Find all menu sections for this restaurant
    const menuSections = await db.menuSection.findMany({
      where: { restaurantId },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true
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
      
      // Process items in this section
      for (const item of section.items) {
        const formattedItem: MenuItem = {
          id: item.id,
          name: item.name,
          price: item.price,
          category,
          description: item.description
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