/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const MAX_FEATURED = 4;

    const featuredRestaurants = await db.restaurant.findMany({
      where: {
        isFeatured: true,
      },
      include: {
        restaurateurs: {
          select: {
            id: true,
            restaurantName: true,
            isPremium: true,
          },
        },
      },
      take: MAX_FEATURED,
    });

    let restaurants = [...featuredRestaurants];

    if (restaurants.length < MAX_FEATURED) {
      const premiumRestaurants = await db.restaurant.findMany({
        where: {
          restaurateurs: {
            some: {
              isPremium: true,
              premiumExpiresAt: {
                gt: new Date(),
              },
            },
          },
          id: {
            notIn: restaurants.map((r) => r.id),
          },
        },
        include: {
          restaurateurs: {
            select: {
              id: true,
              restaurantName: true,
              isPremium: true,
            },
          },
        },
        take: MAX_FEATURED - restaurants.length,
      });

      restaurants = [...restaurants, ...premiumRestaurants];
    }

    if (restaurants.length < MAX_FEATURED) {
      const regularRestaurants = await db.restaurant.findMany({
        where: {
          id: {
            notIn: restaurants.map((r) => r.id),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: MAX_FEATURED - restaurants.length,
        include: {
          restaurateurs: {
            select: {
              id: true,
              restaurantName: true,
              isPremium: true,
            },
          },
        },
      });

      restaurants = [...restaurants, ...regularRestaurants];
    }

    if (restaurants.length > MAX_FEATURED) {
      for (let i = restaurants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = restaurants[i]!;
        restaurants[i] = restaurants[j]!;
        restaurants[j] = temp;
      }
    
      restaurants = restaurants.slice(0, MAX_FEATURED);
    }
    

    const formattedRestaurants = restaurants.map((restaurant) => ({
      id: restaurant.id,
      title: restaurant.title,
      location: restaurant.location,
      rating: restaurant.rating,
      num_reviews: restaurant.num_reviews,
      category: restaurant.category,
      isPremium: restaurant.restaurateurs?.some((r) => r.isPremium) || false,
      isFeatured: Boolean(restaurant.isFeatured),
    }));

    return NextResponse.json({
      restaurants: formattedRestaurants,
    });
  } catch (error) {
    console.error("Error fetching featured restaurants:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch featured restaurants",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
