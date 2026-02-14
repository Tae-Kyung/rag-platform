import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';

// Mock Supabase service client
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockThen = vi.fn();

vi.mock('@/lib/supabase/service', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

function setupKeyLookup(data: unknown) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'api_keys') {
      return {
        select: () => ({
          eq: () => ({ single: vi.fn().mockResolvedValue({ data, error: null }) }),
        }),
        update: () => ({
          eq: () => ({ then: mockThen }),
        }),
      };
    }
    if (table === 'subscriptions') {
      return {
        select: () => ({
          eq: () => ({
            in: () => ({
              single: vi.fn().mockResolvedValue({
                data: { plan_id: 'pro', status: 'active' },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    return { select: mockSelect };
  });
}

function setupKeyLookupWithPlan(keyData: unknown, planData: unknown) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'api_keys') {
      return {
        select: () => ({
          eq: () => ({ single: vi.fn().mockResolvedValue({ data: keyData, error: null }) }),
        }),
        update: () => ({
          eq: () => ({ then: mockThen }),
        }),
      };
    }
    if (table === 'subscriptions') {
      return {
        select: () => ({
          eq: () => ({
            in: () => ({
              single: vi.fn().mockResolvedValue({
                data: planData,
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    return { select: mockSelect };
  });
}

import { authenticateAPIKey, APIKeyError } from '@/lib/auth/api-key';

describe('APIKeyError', () => {
  it('creates error with message and status', () => {
    const err = new APIKeyError('Missing key', 401);
    expect(err.message).toBe('Missing key');
    expect(err.status).toBe(401);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('authenticateAPIKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 401 when Authorization header is missing', async () => {
    const req = new Request('http://localhost/api/v1/chat', {
      method: 'POST',
    });

    try {
      await authenticateAPIKey(req);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(APIKeyError);
      expect((err as APIKeyError).status).toBe(401);
      expect((err as APIKeyError).message).toContain('Missing');
    }
  });

  it('throws 401 for non-Bearer auth format', async () => {
    const req = new Request('http://localhost/api/v1/chat', {
      headers: { Authorization: 'Basic abc123' },
    });

    try {
      await authenticateAPIKey(req);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(APIKeyError);
      expect((err as APIKeyError).status).toBe(401);
    }
  });

  it('throws 401 for key not starting with ask_', async () => {
    const req = new Request('http://localhost/api/v1/chat', {
      headers: { Authorization: 'Bearer invalid_key_123' },
    });

    try {
      await authenticateAPIKey(req);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(APIKeyError);
      expect((err as APIKeyError).message).toContain('format');
    }
  });

  it('throws 401 when key not found in database', async () => {
    setupKeyLookup(null);

    const req = new Request('http://localhost/api/v1/chat', {
      headers: { Authorization: 'Bearer ask_deadbeef' },
    });

    try {
      await authenticateAPIKey(req);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(APIKeyError);
      expect((err as APIKeyError).status).toBe(401);
    }
  });

  it('throws 401 when key is expired', async () => {
    setupKeyLookup({
      id: 'key-1',
      user_id: 'user-1',
      expires_at: '2020-01-01T00:00:00Z',
    });

    const req = new Request('http://localhost/api/v1/chat', {
      headers: { Authorization: 'Bearer ask_expired123' },
    });

    try {
      await authenticateAPIKey(req);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(APIKeyError);
      expect((err as APIKeyError).message).toContain('expired');
    }
  });

  it('throws 403 for free plan users', async () => {
    setupKeyLookupWithPlan(
      { id: 'key-1', user_id: 'user-1', expires_at: null },
      { plan_id: 'free', status: 'active' }
    );

    const req = new Request('http://localhost/api/v1/chat', {
      headers: { Authorization: 'Bearer ask_freeuser123' },
    });

    try {
      await authenticateAPIKey(req);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(APIKeyError);
      expect((err as APIKeyError).status).toBe(403);
      expect((err as APIKeyError).message).toContain('Pro');
    }
  });

  it('throws 403 for starter plan users', async () => {
    setupKeyLookupWithPlan(
      { id: 'key-1', user_id: 'user-1', expires_at: null },
      { plan_id: 'starter', status: 'active' }
    );

    const req = new Request('http://localhost/api/v1/chat', {
      headers: { Authorization: 'Bearer ask_starteruser' },
    });

    try {
      await authenticateAPIKey(req);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(APIKeyError);
      expect((err as APIKeyError).status).toBe(403);
    }
  });

  it('returns auth data for valid pro plan key', async () => {
    setupKeyLookupWithPlan(
      { id: 'key-1', user_id: 'user-1', expires_at: null },
      { plan_id: 'pro', status: 'active' }
    );

    const req = new Request('http://localhost/api/v1/chat', {
      headers: { Authorization: 'Bearer ask_validprokey' },
    });

    const result = await authenticateAPIKey(req);
    expect(result).toEqual({
      userId: 'user-1',
      keyId: 'key-1',
      plan: 'pro',
    });
  });

  it('returns auth data for enterprise plan key', async () => {
    setupKeyLookupWithPlan(
      { id: 'key-2', user_id: 'user-2', expires_at: null },
      { plan_id: 'enterprise', status: 'active' }
    );

    const req = new Request('http://localhost/api/v1/chat', {
      headers: { Authorization: 'Bearer ask_enterprisekey' },
    });

    const result = await authenticateAPIKey(req);
    expect(result.plan).toBe('enterprise');
  });
});
