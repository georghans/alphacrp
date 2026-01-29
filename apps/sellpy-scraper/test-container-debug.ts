import { loadConfig } from "./src/config.js";
import { createPage } from "./src/utils/playwright.js";
import { chromium } from "playwright";
import { logger } from "./src/utils/logger.js";

async function testWithCreatePage() {
  const config = loadConfig();

  console.log("=== Test 1: Using createPage (like scraper) ===");
  const { page, context } = await createPage(config);

  let algoliaCount = 0;
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("algolia.net/1/indexes") || url.includes("algolianet.com/1/indexes")) {
      algoliaCount++;
      console.log(`[createPage] Algolia API response #${algoliaCount}: ${url.substring(0, 100)}`);
    }
  });

  console.log("Navigating...");
  await page.goto("https://www.sellpy.de/search?query=jacket&lang=en", { waitUntil: "networkidle", timeout: 180000 });
  await page.waitForTimeout(3000);

  const itemLinks = await page.$$('a[href*="/item/"]');
  console.log(`[createPage] Items: ${itemLinks.length}, Algolia responses: ${algoliaCount}`);
  await context.close();

  console.log("\n=== Test 2: Using chromium.launch directly (like debug script) ===");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
  });
  const ctx2 = await browser.newContext({ userAgent: config.userAgent });
  const page2 = await ctx2.newPage();
  page2.setDefaultNavigationTimeout(180000);

  let algoliaCount2 = 0;
  page2.on("response", (response) => {
    const url = response.url();
    if (url.includes("algolia.net/1/indexes") || url.includes("algolianet.com/1/indexes")) {
      algoliaCount2++;
      console.log(`[direct] Algolia API response #${algoliaCount2}: ${url.substring(0, 100)}`);
    }
  });

  console.log("Navigating...");
  await page2.goto("https://www.sellpy.de/search?query=jacket&lang=en", { waitUntil: "networkidle", timeout: 180000 });
  await page2.waitForTimeout(3000);

  const itemLinks2 = await page2.$$('a[href*="/item/"]');
  console.log(`[direct] Items: ${itemLinks2.length}, Algolia responses: ${algoliaCount2}`);
  await ctx2.close();
  await browser.close();

  console.log("\nDone");
}

testWithCreatePage().catch((e) => { console.error("Error:", e.message); process.exit(1); });
