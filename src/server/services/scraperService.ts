import { PrismaClient } from '@prisma/client';
import { scrapeMenu } from './scraper/menuScraper';  // Ensure this path is correct

const prisma = new PrismaClient();

// Function to save restaurant data to the database
export async function saveScrapedData(url: string, interest?: string) {  
    const restaurantData = await scrapeMenu(url);

    try {
        // Check if restaurant already exists based on URL
        const existingRestaurant = await prisma.restaurant.findUnique({
            where: { url }
        });

        if (existingRestaurant) {
            throw new Error("Menu already saved");  // Throw error if the menu is already in the database
        }

        // Create the restaurant if it does not exist
        const newRestaurant = await prisma.restaurant.create({
            data: {
                title: restaurantData.title ?? 'Unknown',
                url: url,
                detail: restaurantData.detail,
                rating: restaurantData.rating,
                num_reviews: restaurantData.num_reviews,
                location: restaurantData.location ?? 'Unknown', // Save location
                menuSections: {
                    create: restaurantData.menu.map(section => ({
                        category: section.category,
                        interest: interest ? { connect: { name: interest } } : undefined,
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
        return newRestaurant;
    } catch (error) {
        console.error('Error saving restaurant data:', error);
        throw error;  // Ensure the error is propagated
    } finally {
        await prisma.$disconnect();
    }
}
