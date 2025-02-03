import { PrismaClient } from '@prisma/client';
import { scrapeMenu } from './scraper/menuScraper';  // Ensure this path is correct

const prisma = new PrismaClient();

// Function to save restaurant data to the database
export async function saveScrapedData(url: string) {
    const restaurantData = await scrapeMenu(url);

    try {
        // Create the restaurant
        const newRestaurant = await prisma.restaurant.create({
            data: {
                title: restaurantData.title ?? 'Unknown',
                detail: restaurantData.detail,
                rating: restaurantData.rating,
                num_reviews: restaurantData.num_reviews,
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

        console.log('Restaurant and menu saved successfully:', newRestaurant);
    } catch (error) {
        console.error('Error saving restaurant data:', error);
    } finally {
        await prisma.$disconnect();
    }
}
