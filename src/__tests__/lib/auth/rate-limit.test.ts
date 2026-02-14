import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit } from '@/lib/auth/rate-limit';

describe('checkRateLimit', () => {
  // Each test uses a unique keyId to avoid cross-test contamination
  let testKeyCounter = 0;
  function uniqueKey() {
    return `test-key-${Date.now()}-${testKeyCounter++}`;
  }

  it('allows first request', async () => {
    const result = await checkRateLimit(uniqueKey(), 'pro');
    expect(result.allowed).toBe(true);
  });

  it('returns remaining count after request', async () => {
    const key = uniqueKey();
    const result = await checkRateLimit(key, 'pro');
    // Pro limit is 60: remaining = max(0, 60 - 0) - 1 = 59
    expect(result.remaining).toBe(59);
  });

  it('returns reset time in seconds', async () => {
    const result = await checkRateLimit(uniqueKey(), 'pro');
    expect(result.reset).toBe(60);
  });

  it('tracks multiple requests per key', async () => {
    const key = uniqueKey();
    await checkRateLimit(key, 'pro');
    await checkRateLimit(key, 'pro');
    const result = await checkRateLimit(key, 'pro');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(57); // 60 - 2 (before push) - 1
  });

  it('different keys have independent limits', async () => {
    const key1 = uniqueKey();
    const key2 = uniqueKey();

    // Use up some of key1's limit
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(key1, 'pro');
    }

    // key2 should still have full limit
    const result = await checkRateLimit(key2, 'pro');
    expect(result.remaining).toBe(59);
  });

  it('enterprise plan has higher limit than pro', async () => {
    const proKey = uniqueKey();
    const entKey = uniqueKey();

    const proResult = await checkRateLimit(proKey, 'pro');
    const entResult = await checkRateLimit(entKey, 'enterprise');

    // Enterprise: 300 - 1 - 1 = 298, Pro: 60 - 1 - 1 = 58
    expect(entResult.remaining).toBeGreaterThan(proResult.remaining);
  });

  it('blocks requests when limit is reached', async () => {
    const key = uniqueKey();
    // Pro limit is 60 — exhaust it
    for (let i = 0; i < 60; i++) {
      await checkRateLimit(key, 'pro');
    }

    const result = await checkRateLimit(key, 'pro');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns positive reset seconds when blocked', async () => {
    const key = uniqueKey();
    for (let i = 0; i < 60; i++) {
      await checkRateLimit(key, 'pro');
    }

    const result = await checkRateLimit(key, 'pro');
    expect(result.reset).toBeGreaterThan(0);
    expect(result.reset).toBeLessThanOrEqual(60);
  });

  it('defaults to pro limits for unknown plan', async () => {
    const key = uniqueKey();
    // @ts-expect-error — testing fallback for unknown plan
    const result = await checkRateLimit(key, 'unknown_plan');
    // Should use pro limits (60/min), remaining = 60 - 0 - 1 = 59
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(59);
  });
});
