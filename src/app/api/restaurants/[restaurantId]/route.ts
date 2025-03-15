import { NextRequest, NextResponse } from "next/server"; 
import { PrismaClient } from "@prisma/client";
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
  context: { params: Promise<{ restaurantId: string }> }
): Promise<NextResponse> {
  const { restaurantId } = await context.params;
  
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
            upvotes: true,    // Added upvotes field
            latitude: true,
            longitude: true,
            asExpected: true, // Include other review metrics
            wouldRecommend: true,
            valueForMoney: true,
            createdAt: true,   // For date information
            patron: { select: { firstName: true, lastName: true } },
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
            category: true,
            items: { select: { id: true, name: true, description: true, price: true } }
          }
        }
      },
    });
    
    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    
    // Safely extract coordinates from location string if it exists
    const coordinates = extractCoordinates(restaurant.location);
    
  // Process reviews to format user votes properly
  const formattedReviews = restaurant.reviews.map(review => {
  // Format date
  const date = review.createdAt ? new Date(review.createdAt).toISOString().split("T")[0] : undefined;
  
      // Format user vote with proper type safety
      let userVote: { isUpvote: boolean } | undefined = undefined;
      
      // Type guard: Check if votes exists and has items
      if (review.votes) {
        // TypeScript still doesn't know if votes is an array, so we'll check that too
        const votesArray = Array.isArray(review.votes) ? review.votes : [];
        if (votesArray.length > 0 && votesArray[0]?.isUpvote !== undefined) {
          userVote = { isUpvote: Boolean(votesArray[0].isUpvote) };
        }
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
    return NextResponse.json({
      id: restaurant.id,
      name: restaurant.title,
      address: restaurant.location ?? "Address not available",
      reviews: formattedReviews,
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