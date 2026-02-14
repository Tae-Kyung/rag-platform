import { NextRequest } from 'next/server';
import { authenticateAPIKey, APIKeyError } from '@/lib/auth/api-key';
import { getCurrentUsage } from '@/lib/billing/usage';
import { createServiceRoleClient } from '@/lib/supabase/service';

/**
 * GET /api/v1/usage
 * Returns current usage for the authenticated user (public API).
 */
export async function GET(request: NextRequest) {
  let auth;
  try {
    auth = await authenticateAPIKey(request);
  } catch (err) {
    if (err instanceof APIKeyError) {
      return Response.json({ success: false, error: err.message }, { status: err.status });
    }
    return Response.json({ success: false, error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();

    // Get plan limits
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('user_id', auth.userId)
      .in('status', ['active', 'canceled'])
      .single();

    const planId = sub?.plan_id ?? 'free';

    const { data: plan } = await supabase
      .from('plans')
      .select('max_bots, max_documents, max_messages_per_month, max_storage_mb')
      .eq('id', planId)
      .single();

    // Get current usage
    const usage = await getCurrentUsage(auth.userId);

    // Get bot count
    const { count: botCount } = await supabase
      .from('bots')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId);

    return Response.json({
      success: true,
      data: {
        plan: planId,
        limits: plan ?? {
          max_bots: 1,
          max_documents: 10,
          max_messages_per_month: 100,
          max_storage_mb: 100,
        },
        usage: {
          messages_used: usage?.messages_used ?? 0,
          documents_used: usage?.documents_used ?? 0,
          storage_used_mb: usage?.storage_used_mb ?? 0,
          bots: botCount ?? 0,
          period_start: usage?.period_start ?? null,
          period_end: usage?.period_end ?? null,
        },
      },
    });
  } catch (err) {
    console.error('v1/usage error:', err);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
