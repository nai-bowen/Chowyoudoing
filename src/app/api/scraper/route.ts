/*eslint-disable*/

import { NextRequest, NextResponse } from 'next/server';
import { scrapeUberEatsData } from '@/server/services/scraper/uberEatsScraper';

// Define the expected request payload type
interface ScrapeRequest {
    url: string;
    widerAreas?: string[];
    type: "category" | "restaurant";
}

// Simple admin auth middleware
const validateAdminToken = (request: NextRequest): boolean => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    
    const token = authHeader.substring(7);
    // In a real app, this would be a more secure validation
    // For now, we'll just check if the token exists
    return !!token;
};

// Validate Uber Eats URL
const isValidUberEatsUrl = (url: string): boolean => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname.includes('ubereats.com');
    } catch (error) {
        return false;
    }
};

export async function POST(request: NextRequest) {
    try {
        // Validate admin token
        if (!validateAdminToken(request)) {
            return NextResponse.json(
                { error: 'Unauthorized access' }, 
                { status: 401 }
            );
        }
        
        // Parse request body
        const requestData = await request.json() as ScrapeRequest;
        const { url, widerAreas = [], type = "category" } = requestData;

        if (!url) {
            return NextResponse.json(
                { error: 'No URL provided' }, 
                { status: 400 }
            );
        }
        
        // Validate URL format
        if (!isValidUberEatsUrl(url)) {
            return NextResponse.json(
                { error: 'Invalid Uber Eats URL format' }, 
                { status: 400 }
            );
        }

        // Call the scraper with all the data
        await scrapeUberEatsData({
            url,
            widerAreas,
            type
        });
        
        const successMessage = type === "restaurant" 
            ? "Restaurant scraping completed successfully!" 
            : "Category scraping and saving successful!";

        return NextResponse.json({ 
            message: successMessage,
            widerAreas: widerAreas,
            type: type
        });
    } catch (error) {
        console.error('Error during scraping:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to scrape and save data';
        
        return NextResponse.json(
            { error: errorMessage }, 
            { status: 500 }
        );
    }
}