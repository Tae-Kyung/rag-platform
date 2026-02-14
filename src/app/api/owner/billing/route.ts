import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUsage } from '@/lib/billing/usage';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/owner/billing
 * Returns current subscription info, plan limits, usage, and recent invoices.
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Get active subscription with plan info
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get plan details
    let plan = null;
    if (subscription) {
      const { data } = await supabase
        .from('plans')
        .select('*')
        .eq('id', subscription.plan_id)
        .single();
      plan = data;
    }

    // Get all available plans for comparison
    const { data: allPlans } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    // Get current usage
    const usage = await getCurrentUsage(user.id);

    // Get recent invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return successResponse({
      subscription,
      plan,
      plans: allPlans ?? [],
      usage,
      invoices: invoices ?? [],
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Failed to fetch billing info', 500);
  }
}
