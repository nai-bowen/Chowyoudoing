/*eslint-disable*/
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/server/db";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
): Promise<NextResponse> {
  const { restaurantId } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID is required" }, { status: 400 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    const whereConditions: any = {
      restaurantId: restaurantId
    };

    if (status) {
      whereConditions.status = status;
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    const restaurateur = await db.restaurateur.findFirst({
      where: { 
        OR: [
          { email: userEmail },
          { contactPersonEmail: userEmail }
        ]
      },
      include: {
        restaurant: true,
      },
    });

    if (!restaurateur) {
      return NextResponse.json(
        { error: "Restaurateur not found" },
        { status: 404 }
      );
    }

    let isAuthorized = false;

    if (restaurateur.restaurant && restaurateur.restaurant.id === restaurantId) {
      isAuthorized = true;
    } else {
      const connectionRequest = await db.restaurantConnectionRequest.findFirst({
        where: {
          restaurateurId: restaurateur.id,
          restaurantId: restaurantId,
          status: "approved",
        },
      });

      if (connectionRequest) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "You are not authorized to view receipt verifications for this restaurant" },
        { status: 403 }
      );
    }

    const receiptVerifications = await db.receiptVerification.findMany({
      where: whereConditions,
      include: {
        review: {
          select: {
            id: true,
            content: true,
            rating: true,
            patron: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        restaurant: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return NextResponse.json(receiptVerifications);
  } catch (error) {
    console.error("Error fetching receipt verifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt verifications" },
      { status: 500 }
    );
  }
}
