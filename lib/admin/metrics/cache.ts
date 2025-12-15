// Simple in-memory cache for metrics
// TODO: Replace with Redis in production

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MetricsCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Clear old entries (run periodically)
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const metricsCache = new MetricsCache();

// Cache key generators
export function getCacheKey(prefix: string, ...params: (string | number)[]): string {
  return `${prefix}:${params.join(':')}`;
}

// Cache TTLs by metric type
export const CACHE_TTL = {
  // Fast-changing metrics (shorter cache)
  executiveSummary: 1 * 60 * 1000, // 1 minute
  periodPerformance: 2 * 60 * 1000, // 2 minutes
  
  // Slower-changing metrics (longer cache)
  allTimeMetrics: 10 * 60 * 1000, // 10 minutes
  stripeData: 5 * 60 * 1000, // 5 minutes (Stripe API rate limits)
  
  // Very slow-changing metrics
  productHealth: 15 * 60 * 1000, // 15 minutes
  businessMetrics: 10 * 60 * 1000, // 10 minutes
};

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    metricsCache.cleanup();
  }, 10 * 60 * 1000);
}

