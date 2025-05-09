// src/lib/rate-limit.ts
type RateLimitEntry = {
  count: number;
  lastReset: number;
};

type RateLimitStore = {
  [key: string]: RateLimitEntry;
};

type Options = {
  intervalInMs?: number;
  maxRequests?: number;
};

/**
 * A simple in-memory rate limiter that doesn't require external dependencies
 */
export function rateLimit(options?: Options) {
  const store: RateLimitStore = {};
  const intervalMs = options?.intervalInMs || 60000; // Default: 1 minute
  const maxRequests = options?.maxRequests || 100; // Default: 100 requests per interval

  // Cleanup old entries every hour
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (now - store[key].lastReset > intervalMs * 10) {
        delete store[key];
      }
    }
  }, 3600000); // Cleanup every hour

  return {
    check: (token: string) => {
      const now = Date.now();
      const entry = store[token] || { count: 0, lastReset: now };

      // Reset count if interval has passed
      if (now - entry.lastReset > intervalMs) {
        entry.count = 0;
        entry.lastReset = now;
      }

      // Increment count
      entry.count += 1;
      store[token] = entry;

      // Check if rate limit exceeded
      if (entry.count > maxRequests) {
        return false;
      }

      return true;
    },
  };
}
