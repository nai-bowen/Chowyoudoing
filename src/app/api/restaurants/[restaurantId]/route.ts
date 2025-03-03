import { NextRequest, NextResponse } from "next/server"; 
import { PrismaClient } from "@prisma/client";  

const prisma = new PrismaClient();  

// Helper function to safely extract coordinates
function extractCoordinates(locationString: string | null | undefined): { lat: number | null, lng: number | null } {
  if (!locationString) return { lat: null, lng: null };
  
  try {
    const parts = locationString.split(',');
    if (parts && parts.length === 2 && parts[0] && parts[1]) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  } catch (e) {
    console.error("Error parsing location string:", e);
  }
  
  return { lat: null, lng: null };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ restaurantId: string }> }
): Promise<NextResponse> {
  const { restaurantId } = await context.params;
    
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        reviews: {
          select: {
            id: true,
            content: true,
            rating: true,
            imageUrl: true,
            latitude: true,    // Include latitude
            longitude: true,   // Include longitude
            patron: { select: { firstName: true, lastName: true } }
          }
        },
        menuSections: {
          select: {
            category: true,
            items: { select: { id: true, name: true, description: true, price: true } }
          }
        }
      },
    });
    
    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    
    // Safely extract coordinates from location string if it exists
    const coordinates = extractCoordinates(restaurant.location);
    
    return NextResponse.json({
      id: restaurant.id,
      name: restaurant.title,
      address: restaurant.location ?? "Address not available",
      reviews: restaurant.reviews || [],
      menuItems: restaurant.menuSections.flatMap(section => section.items) || [],
      // Add coordinates as separate fields
      latitude: coordinates.lat,
      longitude: coordinates.lng
    });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return NextResponse.json({ error: "Failed to fetch restaurant data" }, { status: 500 });
  }
}