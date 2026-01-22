import { load } from "cheerio";

export type ImageCandidate = {
  url: string;
  width?: number;
};

function parseSrcSet(srcset: string): ImageCandidate[] {
  return srcset
    .split(",")
    .map((part) => part.trim())
    .map((part) => {
      const [url, size] = part.split(/\s+/);
      const width = size?.endsWith("w") ? Number(size.replace("w", "")) : undefined;
      return { url, width };
    })
    .filter((item) => item.url);
}

export function pickLargestUrl(candidates: ImageCandidate[]): string | null {
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return sorted[0]?.url ?? null;
}

export function extractImagesFromHtml(html: string): string[] {
  const $ = load(html);
  const urls: string[] = [];

  $("img").each((_, el) => {
    const srcset = $(el).attr("srcset") ?? $(el).attr("data-srcset");
    const src =
      $(el).attr("src") ??
      $(el).attr("data-src") ??
      $(el).attr("data-lazy-src") ??
      $(el).attr("data-original");
    if (srcset) {
      const candidates = parseSrcSet(srcset);
      const best = pickLargestUrl(candidates);
      if (best) urls.push(best);
    }
    if (src) {
      urls.push(src);
    }
  });

  return Array.from(new Set(urls));
}
