/* eslint-disable */

import { NextResponse } from 'next/server';
import { scrapeMenu } from '@/server/services/scraper/menuScraper';

export async function POST(req: Request) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  try {
    const data = await scrapeMenu(url);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Scraping failed:', error); // Log the error for debugging
    return NextResponse.json(
      { error: 'Failed to scrape menu', details: (error as Error).message || error },
      { status: 500 }
    );
  }
}
