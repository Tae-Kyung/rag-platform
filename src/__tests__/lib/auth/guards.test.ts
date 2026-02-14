import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthError, requireAuth, requireAdmin, requireOwner, requirePlan } from '@/lib/auth/guards';

// Mock Supabase client
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// Chain helper: from().select().eq().single()
function setupChain(data: unknown, error: unknown = null) {
  mockFrom.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSingle.mockResolvedValue({ data, error });
}

describe('AuthError', () => {
  it('creates error with message and status', () => {
    const err = new AuthError('Unauthorized', 401);
    expect(err.message).toBe('Unauthorized');
    expect(err.status).toBe(401);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user when authenticated', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const result = await requireAuth();
    expect(result).toEqual(mockUser);
  });

  it('throws 401 when no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(requireAuth()).rejects.toThrow(AuthError);
    await expect(requireAuth()).rejects.toThrow('Unauthorized');
  });

  it('throws 401 on auth error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Token expired') });

    try {
      await requireAuth();
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).status).toBe(401);
    }
  });
});

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user when admin', async () => {
    const mockUser = { id: 'admin-1', email: 'admin@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    setupChain({ role: 'admin' });

    const result = await requireAdmin();
    expect(result).toEqual(mockUser);
  });

  it('throws 403 when not admin', async () => {
    const mockUser = { id: 'user-1', email: 'user@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    setupChain({ role: 'user' });

    try {
      await requireAdmin();
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).status).toBe(403);
    }
  });

  it('throws 403 when profile not found', async () => {
    const mockUser = { id: 'user-1', email: 'user@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    setupChain(null);

    try {
      await requireAdmin();
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).status).toBe(403);
    }
  });

  it('throws 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(requireAdmin()).rejects.toThrow(AuthError);
  });
});

describe('requireOwner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user when bot owner', async () => {
    const mockUser = { id: 'user-1', email: 'user@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    setupChain({ id: 'bot-1', user_id: 'user-1' });

    const result = await requireOwner('bot-1');
    expect(result).toEqual(mockUser);
  });

  it('throws 404 when bot not found', async () => {
    const mockUser = { id: 'user-1', email: 'user@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    setupChain(null);

    try {
      await requireOwner('nonexistent-bot');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).status).toBe(404);
    }
  });

  it('throws 403 when not the owner', async () => {
    const mockUser = { id: 'user-1', email: 'user@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    setupChain({ id: 'bot-1', user_id: 'other-user' });

    try {
      await requireOwner('bot-1');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).status).toBe(403);
    }
  });
});

describe('requirePlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns subscription when plan meets minimum', async () => {
    const mockUser = { id: 'user-1', email: 'user@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    setupChain({ plan_id: 'pro', status: 'active' });

    const result = await requirePlan('starter');
    expect(result).toEqual({ plan_id: 'pro', status: 'active' });
  });

  it('returns subscription when plan equals minimum', async () => {
    const mockUser = { id: 'user-1', email: 'user@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    setupChain({ plan_id: 'pro', status: 'active' });

    const result = await requirePlan('pro');
    expect(result).toEqual({ plan_id: 'pro', status: 'active' });
  });

  it('throws 403 when plan is below minimum', async () => {
    const mockUser = { id: 'user-1', email: 'user@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    setupChain({ plan_id: 'free', status: 'active' });

    try {
      await requirePlan('pro');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).status).toBe(403);
      expect((err as AuthError).message).toContain('pro');
    }
  });

  it('throws 403 when no active subscription', async () => {
    const mockUser = { id: 'user-1', email: 'user@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    setupChain(null);

    try {
      await requirePlan('free');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).status).toBe(403);
    }
  });

  it('throws 403 when subscription is canceled', async () => {
    const mockUser = { id: 'user-1', email: 'user@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    setupChain({ plan_id: 'pro', status: 'canceled' });

    try {
      await requirePlan('free');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).status).toBe(403);
    }
  });

  it('enterprise plan satisfies any minimum', async () => {
    const mockUser = { id: 'user-1', email: 'user@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    setupChain({ plan_id: 'enterprise', status: 'active' });

    const result = await requirePlan('enterprise');
    expect(result.plan_id).toBe('enterprise');
  });
});
