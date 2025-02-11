import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const topMenus = await prisma.menuItem.findMany({
        orderBy: { totalUpvotes: 'desc' },
        take: 3 // Show only top 3
    });

    return new Response(JSON.stringify(topMenus), { status: 200 });
}
