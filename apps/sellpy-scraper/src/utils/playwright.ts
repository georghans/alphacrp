import { chromium, type Browser } from "playwright";
import type { AppConfig } from "../config.js";
import { logger } from "./logger.js";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
let browserInstance: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

function isEagain(error: unknown) {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("EAGAIN") || message.includes("Resource temporarily unavailable");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function launchChromium(config: AppConfig) {
  let attempt = 0;
  while (true) {
    try {
      return await chromium.launch({
        headless: config.headless,
        args: [
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-sandbox",
          "--disable-setuid-sandbox"
        ]
      });
    } catch (error) {
      if (!isEagain(error) || attempt >= MAX_RETRIES) {
        throw error;
      }
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      logger.warn({ attempt: attempt + 1, delay, error }, "Playwright launch failed; retrying");
      await sleep(delay);
      attempt += 1;
    }
  }
}

function resetBrowser() {
  browserInstance = null;
  browserPromise = null;
}

export async function getBrowser(config: AppConfig) {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  if (!browserPromise) {
    browserPromise = launchChromium(config)
      .then((browser) => {
        browserInstance = browser;
        browser.on("disconnected", () => {
          resetBrowser();
        });
        return browser;
      })
      .catch((error) => {
        resetBrowser();
        throw error;
      });
  }
  return browserPromise;
}

export async function createPage(config: AppConfig) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let context: Awaited<ReturnType<Browser["newContext"]>> | null = null;
    try {
      const browser = await getBrowser(config);
      context = await browser.newContext({ userAgent: config.userAgent });
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(90000);
      return { page, context };
    } catch (error) {
      lastError = error;
      if (context) {
        await context.close().catch(() => undefined);
      }
      resetBrowser();
    }
  }

  throw lastError;
}
