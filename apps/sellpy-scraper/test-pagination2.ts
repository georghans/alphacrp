import { loadConfig } from "./src/config.js";
import { createPage } from "./src/utils/playwright.js";
import { logger } from "./src/utils/logger.js";

async function testPagination() {
  const config = { ...loadConfig(), headless: false };
  const { page, context } = await createPage(config);

  const searchUrl = "https://www.sellpy.de/search?query=jacket&lang=en";
  logger.info({ searchUrl }, "Loading search page");

  await page.goto(searchUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Check all pagination links
  const paginationLinks = await page.$$eval('nav a, .pagination a, [aria-label*="page"], [class*="pagination"] a',
    (links) => links.map(l => ({
      text: l.textContent?.trim(),
      href: l.getAttribute('href'),
      ariaLabel: l.getAttribute('aria-label')
    }))
  );

  logger.info({ paginationLinks }, "All pagination links");

  // Try to find and click "next" or "page 2"
  const page2Link = await page.$('a[href*="page=2"], a:has-text("2")').catch(() => null);

  if (page2Link) {
    logger.info("Found page 2 link, clicking...");

    const itemsBefore = await page.$$('a[href*="/item/"]');
    logger.info({ itemsBefore: itemsBefore.length }, "Items before clicking page 2");

    await page2Link.click();
    await page.waitForTimeout(5000);

    const itemsAfter = await page.$$('a[href*="/item/"]');
    logger.info({ itemsAfter: itemsAfter.length }, "Items after clicking page 2");

    const currentUrl = page.url();
    logger.info({ currentUrl }, "Current URL after clicking page 2");
  } else {
    logger.info("No page 2 link found");
  }

  logger.info("Keeping browser open for 20 seconds...");
  await page.waitForTimeout(20000);

  await context.close();
}

testPagination().catch(console.error);
