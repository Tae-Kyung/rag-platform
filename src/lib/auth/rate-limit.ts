import type { PlanId } from '@/types';

/**
 * In-memory sliding window rate limiter.
 * For production with multiple instances, replace with @upstash/ratelimit + @upstash/redis.
 */

interface WindowEntry {
  timestamps: number[];
}

// In-memory store (reset on server restart)
const windows = new Map<string, WindowEntry>();

// Plan-specific rate limits (requests per minute)
const RATE_LIMITS: Record<string, number> = {
  pro: 60,
  enterprise: 300,
};

const WINDOW_MS = 60_000; // 1 minute

// Clean up old entries periodically
function cleanup() {
  const now = Date.now();
  for (const [key, entry] of windows) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
    if (entry.timestamps.length === 0) {
      windows.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
let cleanupInterval: ReturnType<typeof setInterval> | null = null;
function ensureCleanup() {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(cleanup, 5 * 60_000);
    // Don't prevent process exit
    if (typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
      cleanupInterval.unref();
    }
  }
}

/**
 * Check rate limit for an API key.
 * Returns { allowed, remaining, reset } where reset is seconds until window resets.
 */
export async function checkRateLimit(
  keyId: string,
  planId: PlanId
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  ensureCleanup();

  const limit = RATE_LIMITS[planId] ?? RATE_LIMITS.pro;
  const now = Date.now();

  let entry = windows.get(keyId);
  if (!entry) {
    entry = { timestamps: [] };
    windows.set(keyId, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  const remaining = Math.max(0, limit - entry.timestamps.length);

  if (entry.timestamps.length >= limit) {
    // Find when the oldest request in the window will expire
    const oldestInWindow = entry.timestamps[0];
    const resetMs = WINDOW_MS - (now - oldestInWindow);
    const resetSeconds = Math.ceil(resetMs / 1000);

    return { allowed: false, remaining: 0, reset: resetSeconds };
  }

  // Allow and record
  entry.timestamps.push(now);

  return { allowed: true, remaining: remaining - 1, reset: 60 };
}
