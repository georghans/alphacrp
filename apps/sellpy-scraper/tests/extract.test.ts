import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { extractSearchResults } from "../src/extract/extractSearchResults.js";
import { extractOfferDetails } from "../src/extract/extractOfferDetails.js";
import { extractImagesFromHtml } from "../src/extract/extractImages.js";

const fixturesPath = new URL("./fixtures/", import.meta.url);

describe("extractors", () => {
  it("extracts search offers from HTML", async () => {
    const html = await readFile(new URL("search.html", fixturesPath), "utf8");
    const result = extractSearchResults(html, "https://www.sellpy.com");
    expect(result.offers.length).toBeGreaterThan(1);
    expect(result.offers[0]?.url).toContain("sellpy.com");
  });

  it("extracts offer details from JSON-LD and next data", async () => {
    const html = await readFile(new URL("offer.html", fixturesPath), "utf8");
    const details = extractOfferDetails(html);
    expect(details.title).toBe("Patagonia Jacket");
    expect(details.externalId).toBe("ABC123");
    expect(details.priceAmount).toBe("49.99");
  });

  it("extracts largest images from srcset", async () => {
    const html = await readFile(new URL("offer.html", fixturesPath), "utf8");
    const images = extractImagesFromHtml(html);
    expect(images[0]).toContain("image1.jpg");
  });
});
