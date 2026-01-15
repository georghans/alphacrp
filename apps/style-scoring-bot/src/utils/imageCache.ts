import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const extToMime: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function isFilePath(value: string): boolean {
  return value.startsWith("/") || value.startsWith(".");
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function readLocalImageAsDataUrl(filePath: string): Promise<string> {
  const resolved = path.resolve(filePath);
  const buffer = await fs.readFile(resolved);
  const ext = path.extname(resolved).toLowerCase();
  const mime = extToMime[ext] ?? "application/octet-stream";
  const base64 = buffer.toString("base64");
  return `data:${mime};base64,${base64}`;
}

export async function downloadImage(
  url: string,
  cacheDir: string,
  maxBytes: number
): Promise<string> {
  await ensureDir(cacheDir);
  const hash = createHash("sha256").update(url).digest("hex");
  const cachePath = path.join(cacheDir, hash);

  try {
    const existing = await fs.readFile(cachePath);
    return existing.toString("utf8");
  } catch {
    // cache miss
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > maxBytes) {
    throw new Error(`Image exceeds max size (${arrayBuffer.byteLength} bytes)`);
  }
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:${contentType};base64,${base64}`;
  await fs.writeFile(cachePath, dataUrl, "utf8");
  return dataUrl;
}
