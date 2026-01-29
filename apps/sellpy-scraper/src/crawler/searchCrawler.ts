import { URL } from "node:url";
import { logger } from "../utils/logger.js";
import type { AppConfig } from "../config.js";
import type { HttpClient } from "../utils/http.js";

export type SearchOffer = {
  url: string;
  nativeExternalId?: string;
  metadata?: Record<string, string>;
  raw?: unknown;
};

type AlgoliaHit = Record<string, unknown> & {
  objectID?: string;
  itemIO?: string;
};

type AlgoliaSearchResponse = {
  results: Array<{
    hits: AlgoliaHit[];
    nbHits: number;
    page: number;
    nbPages: number;
    hitsPerPage: number;
  }>;
};

function buildItemUrl(baseUrl: string, id: string) {
  return new URL(`/item/${id}`, baseUrl).toString();
}

async function crawlWithAlgoliaApi(
  http: HttpClient,
  config: AppConfig,
  term: string,
  maxPages?: number,
  maxItems?: number
): Promise<SearchOffer[]> {
  const endpoint = `https://${config.algoliaAppId}-dsn.algolia.net/1/indexes/*/queries`;
  const allOffers = new Map<string, SearchOffer>();
  let currentPage = 0;
  const effectiveMaxPages = maxPages ?? 20;

  while (currentPage < effectiveMaxPages) {
    const body = JSON.stringify({
      requests: [{
        indexName: config.algoliaIndex,
        query: term,
        hitsPerPage: config.algoliaHitsPerPage,
        page: currentPage
      }]
    });

    logger.info({ page: currentPage, term }, "Algolia API search request");

    const res = await http.get(endpoint, {
      method: "POST",
      headers: {
        "x-algolia-application-id": config.algoliaAppId,
        "x-algolia-api-key": config.algoliaSearchKey,
        "content-type": "application/json"
      },
      body
    });

    if (!res.ok) {
      logger.warn({ status: res.status }, "Algolia API request failed");
      break;
    }

    const data = await res.json() as AlgoliaSearchResponse;
    const result = data.results?.[0];
    if (!result || !Array.isArray(result.hits) || result.hits.length === 0) {
      logger.info({ page: currentPage }, "No more Algolia hits, stopping");
      break;
    }

    for (const hit of result.hits) {
      const id = hit.objectID ?? hit.itemIO;
      if (!id) continue;

      const itemUrl = buildItemUrl(config.baseUrl, String(id));
      if (allOffers.has(itemUrl)) continue;

      allOffers.set(itemUrl, {
        url: itemUrl,
        nativeExternalId: String(id),
        raw: hit
      });

      if (maxItems && allOffers.size >= maxItems) break;
    }

    logger.info({ page: currentPage, hits: result.hits.length, total: allOffers.size, nbPages: result.nbPages }, "Algolia API page results");

    if (maxItems && allOffers.size >= maxItems) break;
    if (currentPage + 1 >= result.nbPages) break;

    currentPage++;
  }

  return Array.from(allOffers.values()).slice(0, maxItems ?? Number.MAX_SAFE_INTEGER);
}

export async function crawlSearch(
  http: HttpClient,
  config: AppConfig,
  term: string,
  maxPages?: number,
  maxItems?: number
): Promise<SearchOffer[]> {
  return crawlWithAlgoliaApi(http, config, term, maxPages, maxItems);
}
