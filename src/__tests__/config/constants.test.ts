import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS, RATE_LIMITS } from '@/config/constants';

describe('PLAN_LIMITS', () => {
  it('defines limits for all four plans', () => {
    expect(PLAN_LIMITS).toHaveProperty('free');
    expect(PLAN_LIMITS).toHaveProperty('starter');
    expect(PLAN_LIMITS).toHaveProperty('pro');
    expect(PLAN_LIMITS).toHaveProperty('enterprise');
  });

  it('free plan has 1 bot limit', () => {
    expect(PLAN_LIMITS.free.maxBots).toBe(1);
  });

  it('free plan has 10 document limit', () => {
    expect(PLAN_LIMITS.free.maxDocuments).toBe(10);
  });

  it('free plan has 100 messages/month', () => {
    expect(PLAN_LIMITS.free.maxMessagesPerMonth).toBe(100);
  });

  it('free plan has 100 MB storage', () => {
    expect(PLAN_LIMITS.free.maxStorageMb).toBe(100);
  });

  it('starter plan has higher limits than free', () => {
    expect(PLAN_LIMITS.starter.maxBots).toBeGreaterThan(PLAN_LIMITS.free.maxBots);
    expect(PLAN_LIMITS.starter.maxDocuments).toBeGreaterThan(PLAN_LIMITS.free.maxDocuments);
    expect(PLAN_LIMITS.starter.maxMessagesPerMonth).toBeGreaterThan(PLAN_LIMITS.free.maxMessagesPerMonth);
  });

  it('pro plan has higher limits than starter', () => {
    expect(PLAN_LIMITS.pro.maxBots).toBeGreaterThan(PLAN_LIMITS.starter.maxBots);
    expect(PLAN_LIMITS.pro.maxDocuments).toBeGreaterThan(PLAN_LIMITS.starter.maxDocuments);
  });

  it('enterprise plan uses -1 for unlimited', () => {
    expect(PLAN_LIMITS.enterprise.maxBots).toBe(-1);
    expect(PLAN_LIMITS.enterprise.maxDocuments).toBe(-1);
    expect(PLAN_LIMITS.enterprise.maxMessagesPerMonth).toBe(-1);
    expect(PLAN_LIMITS.enterprise.maxStorageMb).toBe(-1);
  });

  it('all non-enterprise limits are positive numbers', () => {
    for (const plan of ['free', 'starter', 'pro'] as const) {
      expect(PLAN_LIMITS[plan].maxBots).toBeGreaterThan(0);
      expect(PLAN_LIMITS[plan].maxDocuments).toBeGreaterThan(0);
      expect(PLAN_LIMITS[plan].maxMessagesPerMonth).toBeGreaterThan(0);
      expect(PLAN_LIMITS[plan].maxStorageMb).toBeGreaterThan(0);
    }
  });
});

describe('RATE_LIMITS', () => {
  it('defines limits for all four plans', () => {
    expect(RATE_LIMITS).toHaveProperty('free');
    expect(RATE_LIMITS).toHaveProperty('starter');
    expect(RATE_LIMITS).toHaveProperty('pro');
    expect(RATE_LIMITS).toHaveProperty('enterprise');
  });

  it('all rate limits are positive numbers', () => {
    for (const plan of ['free', 'starter', 'pro', 'enterprise'] as const) {
      expect(RATE_LIMITS[plan]).toBeGreaterThan(0);
    }
  });

  it('rate limits increase with plan level', () => {
    expect(RATE_LIMITS.starter).toBeGreaterThan(RATE_LIMITS.free);
    expect(RATE_LIMITS.pro).toBeGreaterThan(RATE_LIMITS.starter);
    expect(RATE_LIMITS.enterprise).toBeGreaterThan(RATE_LIMITS.pro);
  });

  it('free plan has lowest rate limit', () => {
    expect(RATE_LIMITS.free).toBe(10);
  });

  it('enterprise plan has highest rate limit', () => {
    expect(RATE_LIMITS.enterprise).toBe(500);
  });
});
