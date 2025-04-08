// src/server/services/scraperService.ts

import { PrismaClient } from '@prisma/client';
import { scrapeMenu } from './scraper/menuScraper';

const prisma = new PrismaClient();

interface ScrapedDataParams {
    url: string;
    categories: string[];
    widerAreas?: string[];
}

export async function saveScrapedData(params: ScrapedDataParams): Promise<void> {
    const { url, categories, widerAreas = [] } = params;
    const restaurantData = await scrapeMenu(url);

    try {
        // Check if the restaurant already exists
        const existingRestaurant = await prisma.restaurant.findUnique({
            where: { url }
        });

        if (existingRestaurant) {
            // Combine existing and new categories and wider areas
            const updatedCategories = [...new Set([...existingRestaurant.category, ...categories])];
            const updatedWiderAreas = [...new Set([...existingRestaurant.widerAreas, ...widerAreas])];

            await prisma.restaurant.update({
                where: { url },
                data: {
                    category: updatedCategories,
                    widerAreas: updatedWiderAreas,
                    updatedAt: new Date()
                }
            });

            console.log(`✅ Updated restaurant: ${restaurantData.title}`);
            console.log(`   Categories: ${updatedCategories.join(', ')}`);
            if (updatedWiderAreas.length > 0) {
                console.log(`   Wider Areas: ${updatedWiderAreas.join(', ')}`);
            }
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
                location: restaurantData.location, // Keep original scraped location
                category: categories,
                widerAreas: widerAreas,
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
        console.log(`   Categories: ${categories.join(', ')}`);
        console.log(`   Location: ${restaurantData.location}`);
        if (widerAreas.length > 0) {
            console.log(`   Wider Areas: ${widerAreas.join(', ')}`);
        }
    } catch (error) {
        console.error('❌ Error saving restaurant data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}