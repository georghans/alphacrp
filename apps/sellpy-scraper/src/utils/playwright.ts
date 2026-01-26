import { chromium, type Browser } from "playwright";
import type { AppConfig } from "../config.js";
import { logger } from "./logger.js";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const LAUNCH_ARGS = ["--disable-gpu", "--no-zygote", "--single-process"];

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
        args: LAUNCH_ARGS
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

export async function getBrowser(config: AppConfig) {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  if (!browserPromise) {
    browserPromise = launchChromium(config)
      .then((browser) => {
        browserInstance = browser;
        browser.on("disconnected", () => {
          browserInstance = null;
          browserPromise = null;
        });
        return browser;
      })
      .catch((error) => {
        browserPromise = null;
        throw error;
      });
  }
  return browserPromise;
}

export async function createPage(config: AppConfig) {
  const browser = await getBrowser(config);
  const context = await browser.newContext({ userAgent: config.userAgent });
  const page = await context.newPage();
  return { page, context };
}
