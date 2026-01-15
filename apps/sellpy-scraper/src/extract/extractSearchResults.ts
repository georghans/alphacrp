import { load } from "cheerio";
import { URL } from "node:url";

export type SearchOffer = {
  url: string;
  nativeExternalId?: string;
  metadata?: Record<string, string>;
  raw?: unknown;
};

export type SearchExtract = {
  offers: SearchOffer[];
  nextPageUrl?: string;
  raw?: unknown;
};

function extractExternalIdFromUrl(url: string): string | undefined {
  const match = url.match(/(\d{6,})/);
  return match?.[1];
}

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function parseNextData(html: string): unknown | null {
  const $ = load(html);
  const next = $("#__NEXT_DATA__").text();
  if (next) {
    try {
      return JSON.parse(next);
    } catch {
      return null;
    }
  }
  return null;
}

function collectAnchors(html: string, baseUrl: string): SearchOffer[] {
  const $ = load(html);
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (href.includes("/account") || href.includes("/login")) return;
    if (href.includes("/sell")) return;
    let absolute: string;
    try {
      absolute = new URL(href, baseUrl).toString();
    } catch {
      return;
    }
    if (!absolute.includes("sellpy")) return;
    links.push(absolute);
  });

  const filtered = uniqueUrls(
    links.filter((url) =>
      /\/item\//i.test(url) || /\/offer\//i.test(url) || /\/product\//i.test(url)
    )
  );

  return filtered.map((url) => ({
    url,
    nativeExternalId: extractExternalIdFromUrl(url)
  }));
}

export function extractSearchResults(html: string, baseUrl: string): SearchExtract {
  const offersFromDom = collectAnchors(html, baseUrl);
  const nextData = parseNextData(html);

  const offers: SearchOffer[] = [...offersFromDom];

  // Best-effort extraction from embedded JSON
  if (nextData && typeof nextData === "object") {
    const serialized = JSON.stringify(nextData);
    const urlMatches = serialized.match(/https?:\/\/[^"' ]+/g) || [];
    for (const rawUrl of urlMatches) {
      if (!rawUrl.includes("sellpy")) continue;
      if (!/\/item\//i.test(rawUrl) && !/\/offer\//i.test(rawUrl)) continue;
      offers.push({
        url: rawUrl,
        nativeExternalId: extractExternalIdFromUrl(rawUrl),
        raw: nextData
      });
    }
  }

  const deduped = new Map<string, SearchOffer>();
  for (const offer of offers) {
    if (!deduped.has(offer.url)) {
      deduped.set(offer.url, offer);
    }
  }

  return {
    offers: Array.from(deduped.values()),
    raw: nextData ?? undefined
  };
}
