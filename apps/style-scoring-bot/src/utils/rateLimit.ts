export class RateLimiter {
  private minIntervalMs: number;
  private nextAvailable = 0;

  constructor(perMinute: number) {
    const safePerMinute = Math.max(1, perMinute);
    this.minIntervalMs = Math.ceil(60000 / safePerMinute);
  }

  async waitTurn(): Promise<void> {
    const now = Date.now();
    if (now < this.nextAvailable) {
      await new Promise((resolve) => setTimeout(resolve, this.nextAvailable - now));
    }
    this.nextAvailable = Date.now() + this.minIntervalMs;
  }
}
