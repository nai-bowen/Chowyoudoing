import { PrismaClient } from '@prisma/client';
import { scrapeMenu } from './scraper/menuScraper';  // Ensure this path is correct

const prisma = new PrismaClient();

export async function saveScrapedData(url: string, newCategory: string) {  
    const restaurantData = await scrapeMenu(url);

    try {
        // Check if the restaurant already exists
        const existingRestaurant = await prisma.restaurant.findUnique({
            where: { url }
        });

        if (existingRestaurant) {
            // Append new category if it's not already in the array
            const updatedCategories = new Set([...existingRestaurant.category, newCategory]);

            await prisma.restaurant.update({
                where: { url },
                data: {
                    category: Array.from(updatedCategories), // Ensure no duplicates
                    updatedAt: new Date()
                }
            });

            console.log(`✅ Updated categories for: ${restaurantData.title}`);
            return;
        }

        // Create new restaurant if not found
        await prisma.restaurant.create({
            data: {
                title: restaurantData.title ?? 'Unknown',
                url: url,
                detail: restaurantData.detail,
                rating: restaurantData.rating,
                num_reviews: restaurantData.num_reviews,
                location: restaurantData.location ?? 'Unknown',
                category: [newCategory], // Store category as an array
                menuSections: {
                    create: restaurantData.menu.map(section => ({
                        category: section.category,
                        items: {
                            create: section.items.map(item => ({
                                name: item.name,
                                description: item.description,
                                price: item.price,
                                img_url: item.img_url,
                                status: item.status
                            }))
                        }
                    }))
                }
            }
        });

        console.log(`✅ Saved new restaurant: ${restaurantData.title}`);
    } catch (error) {
        console.error('❌ Error saving restaurant data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}
