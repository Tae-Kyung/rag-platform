import { NextRequest } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/sys/users?page=1&limit=20&search=&plan=&status=
 * System admin: list all users with plan, status, bot count, usage.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20')));
    const search = sp.get('search') || '';
    const planFilter = sp.get('plan') || '';
    const offset = (page - 1) * limit;

    const supabase = createServiceRoleClient();

    // Get profiles with pagination
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: profiles, count } = await query;

    if (!profiles || profiles.length === 0) {
      return successResponse({ users: [], total: count ?? 0, page, limit });
    }

    const userIds = profiles.map((p) => p.id);

    // Fetch subscriptions, bot counts, usage in parallel
    const [subsResult, botsResult, usageResult] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('user_id, plan_id, status')
        .in('user_id', userIds),
      supabase
        .from('bots')
        .select('user_id')
        .in('user_id', userIds),
      supabase
        .from('usage_records')
        .select('user_id, messages_used, period_start')
        .in('user_id', userIds)
        .order('period_start', { ascending: false }),
    ]);

    const subs = subsResult.data ?? [];
    const bots = botsResult.data ?? [];
    const usages = usageResult.data ?? [];

    // Build maps
    const subMap: Record<string, { plan_id: string; status: string }> = {};
    for (const s of subs) {
      if (!subMap[s.user_id]) subMap[s.user_id] = { plan_id: s.plan_id, status: s.status };
    }

    const botCountMap: Record<string, number> = {};
    for (const b of bots) {
      botCountMap[b.user_id] = (botCountMap[b.user_id] || 0) + 1;
    }

    const usageMap: Record<string, number> = {};
    for (const u of usages) {
      if (!usageMap[u.user_id]) usageMap[u.user_id] = u.messages_used;
    }

    let users = profiles.map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: p.role,
      created_at: p.created_at,
      plan_id: subMap[p.id]?.plan_id ?? 'free',
      subscription_status: subMap[p.id]?.status ?? 'none',
      bot_count: botCountMap[p.id] ?? 0,
      messages_used: usageMap[p.id] ?? 0,
    }));

    // Filter by plan
    if (planFilter) {
      users = users.filter((u) => u.plan_id === planFilter);
    }

    return successResponse({ users, total: count ?? 0, page, limit });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error('sys/users error:', err);
    return errorResponse('Failed to fetch users', 500);
  }
}
