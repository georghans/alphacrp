import { chromium } from "playwright";
import { extractOfferDetails } from "../extract/extractOfferDetails.js";
import { extractImagesFromHtml } from "../extract/extractImages.js";
import { sha256 } from "../utils/hash.js";
import { normalizeUrl } from "../utils/normalize.js";
import type { AppConfig } from "../config.js";
import type { HttpClient } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import type { ImageRecord, OfferRecord } from "../db/upsertOffer.js";

function extractExternalIdFromUrl(url: string): string | undefined {
  const match = url.match(/(\d{6,})/);
  return match?.[1];
}

function parsePrice(input?: string | null): { amount?: number; currency?: string } {
  if (!input) return {};
  const currencyMatch = input.match(/(EUR|USD|SEK|NOK|DKK|GBP|€|\$|kr)/i);
  const amountMatch = input.match(/[\d.,]+/);
  const amount = amountMatch
    ? Number(amountMatch[0].replace(/,/g, "."))
    : undefined;
  let currency: string | undefined;
  if (currencyMatch) {
    const raw = currencyMatch[0];
    currency = raw === "€" ? "EUR" : raw === "$" ? "USD" : raw.toUpperCase();
  }
  return { amount, currency };
}

async function fetchOfferHtml(http: HttpClient, url: string): Promise<string> {
  return http.getText(url);
}

async function fetchOfferHtmlWithPlaywright(
  config: AppConfig,
  url: string
): Promise<string> {
  const browser = await chromium.launch({ headless: config.headless });
  const page = await browser.newPage({ userAgent: config.userAgent });
  await page.goto(url, { waitUntil: "networkidle" });
  const content = await page.content();
  await browser.close();
  return content;
}

export async function crawlOffer(
  http: HttpClient,
  config: AppConfig,
  searchTerm: string,
  url: string,
  nativeExternalId?: string
): Promise<{ offer: OfferRecord; images: ImageRecord[] }> {
  let html = await fetchOfferHtml(http, url);
  let details = extractOfferDetails(html);

  if (config.usePlaywright === "always") {
    html = await fetchOfferHtmlWithPlaywright(config, url);
    details = extractOfferDetails(html);
  } else if (config.usePlaywright !== "never") {
    if (!details.title && (!details.imageUrls || details.imageUrls.length === 0)) {
      html = await fetchOfferHtmlWithPlaywright(config, url);
      details = extractOfferDetails(html);
    }
  }

  const imagesFromHtml = extractImagesFromHtml(html);
  const images = (details.imageUrls ?? imagesFromHtml).map((imageUrl, index) => ({
    position: index,
    imageUrl
  }));

  const urlId = extractExternalIdFromUrl(url);
  const externalId =
    nativeExternalId || details.externalId || urlId || sha256(normalizeUrl(url));

  const parsedPrice = parsePrice(details.priceAmount ?? undefined);
  const numericPrice = details.priceAmount
    ? Number(details.priceAmount)
    : undefined;
  const priceAmount = Number.isFinite(numericPrice)
    ? numericPrice
    : parsedPrice.amount ?? null;
  const priceCurrency = details.priceCurrency ?? parsedPrice.currency ?? null;

  const offer: OfferRecord = {
    source: "sellpy",
    externalId,
    searchTerm,
    url,
    title: details.title ?? null,
    description: details.description ?? null,
    priceAmount,
    priceCurrency,
    brand: details.brand ?? null,
    category: details.category ?? null,
    subcategory: details.subcategory ?? null,
    condition: details.condition ?? null,
    size: details.size ?? null,
    color: details.color ?? null,
    material: details.material ?? null,
    availability: details.availability ?? null,
    createdAtSource: details.createdAtSource ?? null,
    rawMetadata: details.rawMetadata
  };

  logger.debug({ url, externalId }, "Parsed offer");

  return { offer, images };
}
