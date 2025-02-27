import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Using the structure that properly handles Promise params
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ restaurantId: string }> }
): Promise<NextResponse> {
  // Await the params before accessing its properties
  const { restaurantId } = await context.params;
  
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        reviews: { 
          select: { 
            content: true, 
            rating: true, 
            patron: { select: { firstName: true, lastName: true } } 
          } 
        },
        menuSections: { 
          select: { 
            category: true,
            items: { select: { name: true, description: true, price: true } }
          } 
        }
      },
    });

    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

    return NextResponse.json({
      id: restaurant.id,
      name: restaurant.title, 
      address: restaurant.location ?? "Address not available", 
      reviews: restaurant.reviews || [],
      menuItems: restaurant.menuSections.flatMap(section => section.items) || [],
    });

  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return NextResponse.json({ error: "Failed to fetch restaurant data" }, { status: 500 });
  }
}