import { withRetry } from "./retry.js";
import { createRateLimiter } from "./rateLimit.js";

export type HttpClient = {
  get: (url: string, init?: RequestInit) => Promise<Response>;
  getText: (url: string, init?: RequestInit) => Promise<string>;
  getJson: <T>(url: string, init?: RequestInit) => Promise<T>;
};

export function createHttpClient(opts: {
  userAgent: string;
  rateLimitRps: number;
}): HttpClient {
  const limit = createRateLimiter(opts.rateLimitRps);

  async function request(url: string, init?: RequestInit): Promise<Response> {
    await limit();
    return withRetry(
      async () =>
        fetch(url, {
          ...init,
          headers: {
            "user-agent": opts.userAgent,
            "accept": "text/html,application/json",
            ...init?.headers
          }
        }),
      { retries: 2, minDelayMs: 500, maxDelayMs: 4000 }
    );
  }

  return {
    get: request,
    getText: async (url, init) => {
      const res = await request(url, init);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return res.text();
    },
    getJson: async <T>(url: string, init?: RequestInit) => {
      const res = await request(url, init);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return res.json() as Promise<T>;
    }
  };
}
