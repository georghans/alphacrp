import { extractOfferDetails } from "../extract/extractOfferDetails.js";
import { extractImagesFromHtml } from "../extract/extractImages.js";
import { sha256 } from "../utils/hash.js";
import { normalizeUrl } from "../utils/normalize.js";
import type { AppConfig } from "../config.js";
import type { HttpClient } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import { createPage, getBrowser } from "../utils/playwright.js";
import type { ImageRecord, OfferDetails } from "../db/upsertOffer.js";
import path from "node:path";

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
  const { page, context } = await createPage(config);
  await page.goto(url, { waitUntil: "networkidle" });
  const content = await page.content();
  await context.close();
  return content;
}

async function captureImageScreenshots(
  config: AppConfig,
  offerUrl: string,
  maxCount: number
): Promise<string[]> {
  const { page, context } = await createPage(config);
  await page.goto(offerUrl, { waitUntil: "networkidle" });

  try {
    const acceptLabels = [
      "Accept all",
      "Accept All",
      "Accept",
      "Allow all",
      "Allow All",
      "Allow",
      "Alle akzeptieren",
      "Alles akzeptieren",
      "Zustimmen",
      "Ich stimme zu"
    ];
    for (const label of acceptLabels) {
      const button = page.getByRole("button", { name: label, exact: false });
      if (await button.first().isVisible().catch(() => false)) {
        await button.first().click({ timeout: 2000 });
        break;
      }
    }
  } catch {
    // Ignore cookie banner errors
  }

  try {
    await page.evaluate(() => {
      const selectors = [
        "[id*='cookie']",
        "[class*='cookie']",
        "[data-testid*='cookie']",
        "[aria-label*='cookie']"
      ];
      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach((el) => {
          const element = el as HTMLElement;
          element.style.display = "none";
          element.style.visibility = "hidden";
        });
      }
    });
  } catch {
    // best effort
  }

  const handles = await page.$$("img");
  const results: string[] = [];
  for (const handle of handles) {
    if (results.length >= maxCount) break;
    const box = await handle.boundingBox();
    if (!box || box.width < 120 || box.height < 120) continue;
    const buffer = await handle.screenshot({ type: "png" });
    results.push(`data:image/png;base64,${buffer.toString("base64")}`);
  }

  await context.close();
  return results;
}

function inferMime(url: string, contentType?: string | null) {
  if (contentType) return contentType;
  const ext = path.extname(url).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

async function fetchImageWithPlaywright(config: AppConfig, url: string) {
  const browser = await getBrowser(config);
  const context = await browser.newContext({
    userAgent: config.userAgent,
    extraHTTPHeaders: {
      referer: config.baseUrl,
      accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
    }
  });
  const page = await context.newPage();
  try {
    await page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
  } catch {
    // ignore base navigation errors
  }
  const response = await context.request.get(url);
  if (!response.ok()) {
    await context.close();
    throw new Error(`Playwright image fetch failed: ${response.status()} ${response.statusText()}`);
  }
  const buffer = await response.body();
  const contentType = response.headers()["content-type"];
  await context.close();
  return { buffer, contentType };
}

async function fetchImageData(): Promise<{ dataUrl: string; mime: string } | null> {
  return null;
}

export async function crawlOffer(
  http: HttpClient,
  config: AppConfig,
  searchTerm: string,
  url: string,
  nativeExternalId?: string
): Promise<{ offer: OfferDetails; images: ImageRecord[] }> {
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
  const imageUrls = details.imageUrls ?? imagesFromHtml;
  let images = await Promise.all(
    imageUrls.map(async (imageUrl, index) => {
      const downloaded = await fetchImageData();
      return {
        position: index,
        imageUrl,
        imageData: downloaded?.dataUrl ?? null,
        imageMime: downloaded?.mime ?? null
      };
    })
  );

  if (images.length === 0 && config.usePlaywright !== "never") {
    try {
      const screenshots = await captureImageScreenshots(config, url, 5);
      images = screenshots.map((dataUrl, index) => ({
        position: index,
        imageUrl: `${url}#screenshot-${index + 1}`,
        imageData: dataUrl,
        imageMime: "image/png"
      }));
    } catch (error) {
      logger.warn({ url, error }, "Failed to capture fallback screenshots");
    }
  }

  if (config.usePlaywright !== "never") {
    try {
      const screenshots = await captureImageScreenshots(config, url, images.length);
      let cursor = 0;
      for (const img of images) {
        if (cursor < screenshots.length) {
          img.imageData = screenshots[cursor];
          img.imageMime = "image/png";
          cursor += 1;
        }
      }
    } catch (error) {
      logger.warn({ url, error }, "Failed to capture image screenshots");
    }
  }

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

  const offer: OfferDetails = {
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
