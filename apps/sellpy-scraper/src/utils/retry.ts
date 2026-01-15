export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries: number; minDelayMs: number; maxDelayMs: number }
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= opts.retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === opts.retries) {
        break;
      }
      const delay = Math.min(
        opts.maxDelayMs,
        opts.minDelayMs * Math.pow(2, attempt)
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }
  throw lastError;
}
