/* eslint-disable */

import { NextResponse } from 'next/server';
import { saveScrapedData } from '@/server/services/scraperService';  // Ensure the import path is correct

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
        }

        await saveScrapedData(url);

        return NextResponse.json({ message: 'Scraping and saving successful!' });
    } catch (error) {
        console.error('Error during scraping:', error);
        return NextResponse.json({ error: 'Failed to scrape and save data' }, { status: 500 });
    }
}
