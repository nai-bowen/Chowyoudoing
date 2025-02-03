import puppeteer from 'puppeteer';
import fs from 'fs';

export async function scrapeRestaurants(baseUrl: string, location: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${baseUrl}${location}`, { waitUntil: 'networkidle2' });

  const categories = await page.$$eval('div[data-test-id="categories"] > *', elements =>
    elements.map(el => (el.textContent ?? '').replace(/\s+/g, '-').toLowerCase())
  );

  const restaurantUrls: string[] = [];

  for (const category of categories) {
    try {
      await page.goto(`${baseUrl}${location}/${category}`, { waitUntil: 'networkidle2' });
      const urls = await page.$$eval('a[data-test-id="restaurant-link"]', links =>
        links.map(link => link.getAttribute('href') ?? '')
      );
      restaurantUrls.push(...urls);
    } catch (error) {
      console.error(`Skipped ${category} due to an error:`, error);
    }
  }

  // Remove duplicates and save to file
  const uniqueUrls = Array.from(new Set(restaurantUrls));
  fs.writeFileSync(`src/data/${location}_restaurant_urls.json`, JSON.stringify(uniqueUrls, null, 2));

  await browser.close();
  return uniqueUrls;
}
