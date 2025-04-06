import { NextRequest, NextResponse } from "next/server"; 
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
  context: { params: { restaurantId: string } }
): Promise<NextResponse> {
  const { restaurantId } = context.params;
  console.log("Restaurant API: Fetching restaurant with ID:", restaurantId);
  
  // Get current user session for user votes
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
    
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
            upvotes: true,
            latitude: true,
            longitude: true,
            asExpected: true,
            wouldRecommend: true,
            valueForMoney: true,
            createdAt: true,
            menuItemId: true,
            isAnonymous: true, // Add this line to select the isAnonymous field
            patron: { select: { firstName: true, lastName: true, id: true } },
            // Include user vote information if user is logged in
            votes: currentUserId ? {
              where: {
                userId: currentUserId
              },
              select: {
                isUpvote: true
              }
            } : undefined
          }
        },
        menuSections: {
          select: {
            id: true,
            category: true,
            items: { 
              select: { 
                id: true, 
                name: true, 
                description: true, 
                price: true 
              } 
            }
          }
        }
      },
    });
    
    if (!restaurant) {
      console.log("Restaurant API: Restaurant not found with ID:", restaurantId);
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    console.log("Restaurant API: Found restaurant:", restaurant.title);
    console.log("Restaurant API: Review count:", restaurant.reviews.length);
    console.log("Restaurant API: Menu section count:", restaurant.menuSections.length);
    
    // Extract all menu items for simpler access
    const menuItems = restaurant.menuSections.flatMap(section => section.items);
    console.log("Restaurant API: Total menu items:", menuItems.length);
    
    // Safely extract coordinates from location string if it exists
    const coordinates = extractCoordinates(restaurant.location);
    
    // Process reviews to format user votes properly
    const formattedReviews = restaurant.reviews.map(review => {
      // Format date
      const date = review.createdAt ? new Date(review.createdAt).toISOString().split("T")[0] : undefined;
      
      // Format user vote with proper type safety
      let userVote = null;
      
      // Type guard: Check if votes exists and has items
      if (review.votes && Array.isArray(review.votes) && review.votes.length > 0) {
        userVote = { isUpvote: Boolean(review.votes[0]?.isUpvote) };
      }
      
      // Make sure upvotes is a number
      const upvotes = typeof review.upvotes === 'number' ? review.upvotes : 0;
        
      // Return formatted review
      return {
        ...review,
        date,
        upvotes,
        userVote,
        votes: undefined // Remove raw votes data
      };
    });
    
    // Process menu items to add hasReviews flag
    const processedMenuItems = menuItems.map(item => {
      // Check if any review references this menu item
      const hasReviews = formattedReviews.some(review => review.menuItemId === item.id);
      
      return {
        ...item,
        hasReviews
      };
    });
    
    const responseData = {
      id: restaurant.id,
      name: restaurant.title,
      address: restaurant.location ?? "Address not available",
      reviews: formattedReviews,
      menuItems: processedMenuItems,
      // Add coordinates as separate fields
      latitude: coordinates.lat,
      longitude: coordinates.lng
    };
    
    console.log("Restaurant API: Returning response with:", {
      reviewCount: responseData.reviews.length,
      menuItemCount: responseData.menuItems.length
    });
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return NextResponse.json({ error: "Failed to fetch restaurant data" }, { status: 500 });
  }
}