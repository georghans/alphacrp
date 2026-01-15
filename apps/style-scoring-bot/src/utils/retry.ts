export type RetryOptions = {
  retries: number;
  minDelayMs: number;
  maxDelayMs: number;
};

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= options.retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === options.retries) break;
      const backoff = Math.min(
        options.maxDelayMs,
        options.minDelayMs * 2 ** attempt
      );
      const jitter = Math.round(backoff * (0.2 * Math.random()));
      await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
      attempt += 1;
    }
  }

  throw lastError;
}
