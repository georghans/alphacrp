import { AppConfig } from "../config.js";
import { RateLimiter } from "../utils/rateLimit.js";
import { retry } from "../utils/retry.js";
import { downloadImage, isHttpUrl, isFilePath, readLocalImageAsDataUrl } from "../utils/imageCache.js";

export type OpenRouterImage = {
  url: string;
};

export type OpenRouterMessage = {
  role: "system" | "user";
  content:
    | string
    | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: OpenRouterImage }>;
};

export type OpenRouterResponse = {
  content: string;
  model: string;
  raw: unknown;
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    decision: { type: "string", enum: ["MATCH", "NO_MATCH"] },
    style_score: { type: "number", minimum: 0, maximum: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    match_reasons: { type: "array", items: { type: "string" } },
    mismatch_reasons: { type: "array", items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } }
  },
  required: [
    "decision",
    "style_score",
    "confidence",
    "match_reasons",
    "mismatch_reasons",
    "tags"
  ]
};

export class OpenRouterClient {
  private config: AppConfig;
  private limiter: RateLimiter;

  constructor(config: AppConfig) {
    this.config = config;
    this.limiter = new RateLimiter(config.OPENROUTER_RATE_LIMIT_PER_MIN);
  }

  async prepareImage(input: string): Promise<OpenRouterImage> {
    if (isHttpUrl(input) && !this.config.FORCE_BASE64_IMAGES) {
      return { url: input };
    }

    if (isFilePath(input)) {
      const dataUrl = await readLocalImageAsDataUrl(input);
      return { url: dataUrl };
    }

    if (isHttpUrl(input) && this.config.FORCE_BASE64_IMAGES) {
      const dataUrl = await downloadImage(
        input,
        this.config.IMAGE_CACHE_DIR,
        this.config.IMAGE_MAX_BYTES
      );
      return { url: dataUrl };
    }

    return { url: input };
  }

  async chat(messages: OpenRouterMessage[]): Promise<OpenRouterResponse> {
    const payload = {
      model: this.config.OPENROUTER_MODEL,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "style_match_decision",
          strict: true,
          schema
        }
      },
      temperature: 0.1
    };

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    };

    if (this.config.OPENROUTER_REFERER) {
      headers["HTTP-Referer"] = this.config.OPENROUTER_REFERER;
    }
    if (this.config.OPENROUTER_TITLE) {
      headers["X-Title"] = this.config.OPENROUTER_TITLE;
    }

    await this.limiter.waitTurn();

    const response = await retry(
      async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.OPENROUTER_TIMEOUT_MS);
        try {
          const res = await fetch(`${this.config.OPENROUTER_BASE_URL}/chat/completions`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`OpenRouter error ${res.status}: ${text}`);
          }

          return res.json();
        } finally {
          clearTimeout(timeout);
        }
      },
      { retries: this.config.OPENROUTER_MAX_RETRIES, minDelayMs: 500, maxDelayMs: 8000 }
    );

    const choice = response.choices?.[0];
    const content = choice?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("OpenRouter response missing content");
    }

    return { content, model: response.model ?? this.config.OPENROUTER_MODEL, raw: response };
  }
}
