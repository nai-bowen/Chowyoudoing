/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the session to check if a user is logged in
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Fetch the favorites with related data
    const favorites = await db.favorite.findMany({
      where: {
        patronId: session.user.id
      },
      select: {
        id: true,
        createdAt: true,
        restaurant: {
          select: {
            id: true,
            title: true,
            location: true,
            category: true
          }
        },
        review: {
          select: {
            id: true,
            content: true,
            rating: true,
            restaurant: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the session to check if a user is logged in
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const { restaurantId, reviewId } = body;
    
    // Validate input - must have either restaurantId or reviewId
    if (!restaurantId && !reviewId) {
      return NextResponse.json(
        { error: "Either restaurantId or reviewId is required" },
        { status: 400 }
      );
    }
    
    // Check if this item is already favorited
    const existingFavorite = await db.favorite.findFirst({
      where: {
        patronId: session.user.id,
        ...(restaurantId ? { restaurantId } : { reviewId })
      }
    });
    
    // If already favorited, return success with existing data
    if (existingFavorite) {
      return NextResponse.json({ 
        favorite: existingFavorite,
        message: "Item already in favorites"
      });
    }
    
    // Create new favorite
    const favorite = await db.favorite.create({
      data: {
        patron: {
          connect: { id: session.user.id }
        },
        ...(restaurantId ? { restaurant: { connect: { id: restaurantId } } } : {}),
        ...(reviewId ? { review: { connect: { id: reviewId } } } : {})
      }
    });
    
    return NextResponse.json({ 
      favorite,
      message: "Item added to favorites" 
    });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return NextResponse.json(
      { error: "Failed to add to favorites" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the session to check if a user is logged in
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get favorite ID from URL params
    const url = new URL(req.url);
    const favoriteId = url.searchParams.get("id");
    const restaurantId = url.searchParams.get("restaurantId");
    const reviewId = url.searchParams.get("reviewId");
    
    if (!favoriteId && !restaurantId && !reviewId) {
      return NextResponse.json(
        { error: "Either favoriteId, restaurantId, or reviewId is required" },
        { status: 400 }
      );
    }
    
    // Delete by ID or by content reference
    if (favoriteId) {
      // First check if the favorite belongs to the user
      const favorite = await db.favorite.findFirst({
        where: {
          id: favoriteId,
          patronId: session.user.id
        }
      });
      
      if (!favorite) {
        return NextResponse.json(
          { error: "Favorite not found or not authorized" },
          { status: 404 }
        );
      }
      
      await db.favorite.delete({
        where: { id: favoriteId }
      });
    } else {
      // Delete by content reference
      await db.favorite.deleteMany({
        where: {
          patronId: session.user.id,
          ...(restaurantId ? { restaurantId } : {}),
          ...(reviewId ? { reviewId } : {})
        }
      });
    }
    
    return NextResponse.json({ 
      message: "Item removed from favorites" 
    });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return NextResponse.json(
      { error: "Failed to remove from favorites" },
      { status: 500 }
    );
  }
}