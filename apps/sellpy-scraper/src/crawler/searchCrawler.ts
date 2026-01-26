import { URL } from "node:url";
import { extractSearchResults, type SearchOffer } from "../extract/extractSearchResults.js";
import { logger } from "../utils/logger.js";
import { createPage } from "../utils/playwright.js";
import type { AppConfig } from "../config.js";
import type { HttpClient } from "../utils/http.js";

type AlgoliaHit = Record<string, unknown> & {
  objectID?: string;
  itemIO?: string;
};

function buildSearchUrl(config: AppConfig, term: string, page?: number): string {
  const url = new URL(config.searchPath, config.baseUrl);
  url.searchParams.set(config.searchQueryParam, term);
  if (page && page > 1) {
    url.searchParams.set(config.pageParam, String(page));
  }
  if (config.locale) {
    url.searchParams.set("lang", config.locale);
  }
  return url.toString();
}

function buildItemUrl(baseUrl: string, id: string) {
  return new URL(`/item/${id}`, baseUrl).toString();
}

async function collectAlgoliaOffers(
  page: Awaited<ReturnType<typeof createPage>>["page"],
  config: AppConfig,
  maxItems?: number
): Promise<SearchOffer[]> {
  const offers = new Map<string, SearchOffer>();
  const pending: Promise<void>[] = [];

  const handler = (response: { url: () => string; request: () => { method: () => string }; json: () => Promise<unknown> }) => {
    const url = response.url();
    if (!url.includes("algolia.net/1/indexes")) return;
    if (response.request().method() !== "POST") return;

    pending.push(
      response
        .json()
        .then((payload) => {
          const results = (payload as { results?: unknown[] } | null)?.results;
          if (!Array.isArray(results)) return;
          for (const result of results) {
            const hits = (result as { hits?: unknown[] } | null)?.hits;
            if (!Array.isArray(hits)) continue;
            for (const rawHit of hits) {
              const hit = rawHit as AlgoliaHit;
              const id = hit.objectID ?? hit.itemIO;
              if (!id) continue;
              const url = buildItemUrl(config.baseUrl, id);
              if (!offers.has(url)) {
                offers.set(url, {
                  url,
                  nativeExternalId: String(id),
                  raw: hit
                });
              }
              if (maxItems && offers.size >= maxItems) return;
            }
          }
        })
        .catch(() => {
          // ignore parse errors
        })
    );
  };

  page.on("response", handler);
  await page.waitForTimeout(4000);
  page.off("response", handler);
  await Promise.allSettled(pending);

  return Array.from(offers.values()).slice(0, maxItems ?? Number.MAX_SAFE_INTEGER);
}

async function fetchSearchPage(
  http: HttpClient,
  config: AppConfig,
  term: string,
  page: number
) {
  const url = buildSearchUrl(config, term, page);
  const html = await http.getText(url);
  const extracted = extractSearchResults(html, config.baseUrl);
  return { url, extracted };
}

async function crawlWithFetch(
  http: HttpClient,
  config: AppConfig,
  term: string,
  maxPages?: number,
  maxItems?: number
): Promise<SearchOffer[]> {
  const offers: SearchOffer[] = [];
  let page = 1;
  let emptyPages = 0;

  while (true) {
    if (maxPages && page > maxPages) break;
    const { extracted } = await fetchSearchPage(http, config, term, page);

    if (extracted.offers.length === 0) {
      emptyPages += 1;
    } else {
      emptyPages = 0;
      offers.push(...extracted.offers);
    }

    if (maxItems && offers.length >= maxItems) break;
    if (emptyPages >= 2) break;
    page += 1;
  }

  const deduped = new Map<string, SearchOffer>();
  for (const offer of offers) {
    if (!deduped.has(offer.url)) deduped.set(offer.url, offer);
  }
  return Array.from(deduped.values()).slice(0, maxItems ?? Number.MAX_SAFE_INTEGER);
}

async function crawlWithPlaywright(
  config: AppConfig,
  term: string,
  maxItems?: number
): Promise<SearchOffer[]> {
  const { page, context } = await createPage(config);
  const searchUrl = buildSearchUrl(config, term, 1);
  logger.info({ searchUrl }, "Playwright search navigation");
  const algoliaPromise = collectAlgoliaOffers(page, config, maxItems);
  await page.goto(searchUrl, { waitUntil: "networkidle" });

  const algoliaOffers = await algoliaPromise;
  if (algoliaOffers.length > 0) {
    await context.close();
    return algoliaOffers;
  }

  const offers = new Map<string, SearchOffer>();
  let previousCount = 0;
  let stagnantRounds = 0;

  while (true) {
    const urls = await page.$$eval("a[href]", (anchors) =>
      anchors
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((href) =>
          /\/item\//i.test(href) || /\/offer\//i.test(href) || /\/product\//i.test(href)
        )
    );

    for (const url of urls) {
      if (!offers.has(url)) {
        offers.set(url, { url });
      }
    }

    if (maxItems && offers.size >= maxItems) break;

    const currentCount = offers.size;
    if (currentCount === previousCount) {
      stagnantRounds += 1;
    } else {
      stagnantRounds = 0;
    }

    if (stagnantRounds >= 3) break;
    previousCount = currentCount;

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
  }

  await context.close();
  return Array.from(offers.values()).slice(0, maxItems ?? Number.MAX_SAFE_INTEGER);
}

export async function crawlSearch(
  http: HttpClient,
  config: AppConfig,
  term: string,
  maxPages?: number,
  maxItems?: number
): Promise<SearchOffer[]> {
  if (config.usePlaywright === "always") {
    return crawlWithPlaywright(config, term, maxItems);
  }

  const fetched = await crawlWithFetch(http, config, term, maxPages, maxItems);
  if (fetched.length > 0 || config.usePlaywright === "never") {
    return fetched;
  }

  logger.info("Fetch-based search returned no offers; falling back to Playwright.");
  return crawlWithPlaywright(config, term, maxItems);
}
