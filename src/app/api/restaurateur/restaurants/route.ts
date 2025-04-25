import { type NextRequest, NextResponse } from "next/server";
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
    // Get query params
    const url = new URL(req.url);
    const restaurateurId = url.searchParams.get("restaurateurId");
    
    if (!restaurateurId) {
      return NextResponse.json(
        { error: "restaurateurId is required" }, 
        { status: 400 }
      );
    }

    console.log(`API: Querying restaurateur with ID: ${restaurateurId}`);

    // First, try to find the restaurateur with the exact ID
    let restaurateur = await db.restaurateur.findUnique({
      where: {
        id: restaurateurId,
      },
      include: {
        restaurant: {
          include: {
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
    });

    // Log the result of the query
    console.log(`API: findUnique result:`, restaurateur ? "Found" : "Not found");

    // If not found, try a less strict query to see if we can find any matching restaurateur
    if (!restaurateur) {
      console.log("API: No exact match found, trying alternative queries");
      
      // Try to find by email using the session email
      if (session.user.email) {
        console.log(`API: Trying to find by email: ${session.user.email}`);
        restaurateur = await db.restaurateur.findFirst({
          where: {
            email: session.user.email
          },
          include: {
            restaurant: {
              include: {
                _count: {
                  select: {
                    reviews: true,
                  },
                },
              },
            },
          },
        });
        
        if (restaurateur) {
          console.log(`API: Found restaurateur by email with ID: ${restaurateur.id}`);
        }
      }
      
      // If still not found, try a more general query
      if (!restaurateur) {
        console.log("API: Trying a broader search");
        const allRestaurateurs = await db.restaurateur.findMany({
          take: 5, // Limit to 5 to avoid huge results
          include: {
            restaurant: {
              include: {
                _count: {
                  select: {
                    reviews: true,
                  },
                },
              },
            },
          },
        });
        
        console.log(`API: Found ${allRestaurateurs.length} restaurateurs in database`);
        
        // Look for any that might match our criteria
        const possibleMatch = allRestaurateurs.find(r => 
          r.id === restaurateurId || 
          r.email === session.user.email ||
          r.contactPersonName === session.user.name
        );
        
        if (possibleMatch) {
          console.log(`API: Found possible match: ${possibleMatch.id}`);
          restaurateur = possibleMatch;
        }
      }
    }

    // If we still haven't found a restaurateur, return 404
    if (!restaurateur) {
      console.log("API: No restaurateur found with any query method");
      return NextResponse.json(
        { error: "Restaurateur not found" }, 
        { status: 404 }
      );
    }

    // If there's no directly connected restaurant, check for approved connection requests
    if (!restaurateur.restaurant) {
      console.log(`API: No direct restaurant, checking connection requests for ${restaurateur.id}`);
      const approvedConnections = await db.restaurantConnectionRequest.findMany({
        where: {
          restaurateurId: restaurateur.id, // Use the found restaurateur ID
          status: "approved",
        },
        include: {
          restaurant: {
            include: {
              _count: {
                select: {
                  reviews: true,
                },
              },
            },
          },
        },
      });

      console.log(`API: Found ${approvedConnections.length} approved connections`);
      const connectedRestaurants = approvedConnections.map(conn => conn.restaurant);
      return NextResponse.json(connectedRestaurants);
    }

    // Return the single connected restaurant in an array for consistency
    console.log(`API: Returning direct restaurant connection: ${restaurateur.restaurant.id}`);
    return NextResponse.json([restaurateur.restaurant]);
  } catch (error) {
    console.error("Error fetching restaurateur restaurants:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}