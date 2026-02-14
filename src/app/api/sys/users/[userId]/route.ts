import { NextRequest } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/sys/users/[userId]
 * System admin: user detail (profile, bots, subscription, usage).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;
    const supabase = createServiceRoleClient();

    const [profileResult, subsResult, botsResult, usageResult, invoicesResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('subscriptions').select('*').eq('user_id', userId).single(),
      supabase
        .from('bots')
        .select('id, name, is_active, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('usage_records')
        .select('*')
        .eq('user_id', userId)
        .order('period_start', { ascending: false })
        .limit(3),
      supabase
        .from('invoices')
        .select('id, amount, currency, status, period_start, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (!profileResult.data) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      profile: profileResult.data,
      subscription: subsResult.data,
      bots: botsResult.data ?? [],
      usage_records: usageResult.data ?? [],
      invoices: invoicesResult.data ?? [],
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Failed to fetch user', 500);
  }
}

/**
 * PUT /api/sys/users/[userId]
 * System admin: update user (suspend/unsuspend, change plan).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;
    const body = await request.json();
    const supabase = createServiceRoleClient();

    // Update profile role/status if provided
    if (body.role) {
      await supabase
        .from('profiles')
        .update({ role: body.role, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    // Update subscription plan if provided
    if (body.plan_id) {
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        await supabase
          .from('subscriptions')
          .update({
            plan_id: body.plan_id,
            status: body.status || 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else {
        await supabase.from('subscriptions').insert({
          user_id: userId,
          plan_id: body.plan_id,
          status: body.status || 'active',
        });
      }
    }

    // Update subscription status only
    if (body.status && !body.plan_id) {
      await supabase
        .from('subscriptions')
        .update({ status: body.status, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    }

    return successResponse({ updated: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Failed to update user', 500);
  }
}
