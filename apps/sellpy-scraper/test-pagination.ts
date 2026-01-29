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

  // Check for "Load More" or pagination buttons
  const loadMoreButton = await page.$('button:has-text("Load"), button:has-text("More"), button:has-text("Mehr")');
  const nextButton = await page.$('button:has-text("Next"), a:has-text("Next"), button:has-text("Weiter")');
  const paginationLinks = await page.$$('nav a, .pagination a, [aria-label*="page"]');

  logger.info({
    hasLoadMore: !!loadMoreButton,
    hasNext: !!nextButton,
    paginationLinks: paginationLinks.length
  }, "Pagination elements found");

  // Check page structure
  const html = await page.content();
  const hasInfiniteScroll = html.includes('infinite') || html.includes('lazy');

  logger.info({ hasInfiniteScroll }, "Page features");

  // Count current items
  const itemLinks = await page.$$('a[href*="/item/"]');
  logger.info({ itemCount: itemLinks.length }, "Items on page");

  // Try scrolling and see if items increase
  logger.info("Scrolling to bottom...");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);

  const itemLinksAfterScroll = await page.$$('a[href*="/item/"]');
  logger.info({
    itemCountBefore: itemLinks.length,
    itemCountAfter: itemLinksAfterScroll.length
  }, "Items after scroll");

  // Check for "Load More" button again
  const loadMoreAfterScroll = await page.$('button:has-text("Load"), button:has-text("More"), button:has-text("Mehr")');
  if (loadMoreAfterScroll) {
    logger.info("Found Load More button after scroll, clicking it...");
    await loadMoreAfterScroll.click();
    await page.waitForTimeout(3000);

    const itemLinksAfterClick = await page.$$('a[href*="/item/"]');
    logger.info({ itemCountAfterClick: itemLinksAfterClick.length }, "Items after clicking Load More");
  }

  logger.info("Keeping browser open for 30 seconds for manual inspection...");
  await page.waitForTimeout(30000);

  await context.close();
}

testPagination().catch(console.error);
