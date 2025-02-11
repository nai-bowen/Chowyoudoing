import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const restaurants = await prisma.restaurant.findMany({
        where: { location: { not: null } },
        take: 5
    });

    return new Response(JSON.stringify(restaurants), { status: 200 });
}
