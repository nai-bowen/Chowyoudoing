import puppeteer from 'puppeteer';

export async function scrapeRestaurants(cityUrl: string): Promise<string[]> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(cityUrl, { waitUntil: 'networkidle2' });

    // Extract category links
    const categoryLinks = await page.$$eval('a[data-test]', links =>
        links
            .filter(link => link.getAttribute('href')?.startsWith('/gb/category/'))
            .map(link => link.getAttribute('href') ?? '')
    );

    const uniqueCategoryLinks = [...new Set(categoryLinks)];

    const restaurantUrls: string[] = [];

    for (const categoryLink of uniqueCategoryLinks) {
        try {
            const categoryPage = await browser.newPage();
            await categoryPage.goto(`https://www.ubereats.com${categoryLink}`, { waitUntil: 'networkidle2' });

            const urls = await categoryPage.$$eval('a[data-testid="store-card"]', links =>
                links.map(link => link.getAttribute('href') ?? '')
            );

            restaurantUrls.push(...urls);
            await categoryPage.close();
        } catch (error) {
            console.error(`Error scraping category: ${categoryLink}`, error);
        }
    }

    await browser.close();
    return [...new Set(restaurantUrls)]; // Remove duplicates
}
