export function createRateLimiter(rps: number): () => Promise<void> {
  if (!Number.isFinite(rps) || rps <= 0) {
    return async () => undefined;
  }

  const intervalMs = 1000 / rps;
  let nextAllowed = Date.now();

  return async () => {
    const now = Date.now();
    const waitMs = Math.max(0, nextAllowed - now);
    nextAllowed = Math.max(nextAllowed + intervalMs, now + intervalMs);
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  };
}
