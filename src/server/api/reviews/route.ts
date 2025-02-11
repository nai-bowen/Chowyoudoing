import { authConfig } from "@/server/auth/config";  // ✅ Corrected import
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {  // ✅ More concise, avoids redundant checks
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const reviews = await prisma.review.findMany({
            where: { patronId: session.user.id },
            orderBy: { upvotes: 'desc' },
            take: 5 // Get the top 5 reviews
        });

        return new Response(JSON.stringify(reviews), { status: 200 });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}
