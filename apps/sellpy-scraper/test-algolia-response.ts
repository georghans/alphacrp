import { loadConfig } from "./src/config.js";
import { createPage } from "./src/utils/playwright.js";
import { logger } from "./src/utils/logger.js";

async function testAlgoliaResponse() {
  const config = loadConfig();
  const { page, context } = await createPage(config);

  const searchUrl = "https://www.sellpy.de/search?query=jacket&lang=en";

  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("algolia.net/1/indexes")) return;
    if (response.request().method() !== "POST") return;

    try {
      const payload = await response.json();
      logger.info({ payload: JSON.stringify(payload, null, 2) }, "Algolia response");

      if (payload && typeof payload === 'object') {
        const results = (payload as any).results;
        if (Array.isArray(results)) {
          for (const result of results) {
            logger.info({
              nbHits: result.nbHits,
              hitsPerPage: result.hitsPerPage,
              page: result.page,
              nbPages: result.nbPages,
              hits: result.hits?.length
            }, "Algolia result metadata");
          }
        }
      }
    } catch (e) {
      logger.error({ error: e }, "Failed to parse Algolia response");
    }
  });

  logger.info({ searchUrl }, "Loading search page");
  await page.goto(searchUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);

  await context.close();
}

testAlgoliaResponse().catch(console.error);
