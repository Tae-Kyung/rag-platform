import { NextRequest } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { updateSubscription } from '@/lib/billing/paddle';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * POST /api/owner/billing/update
 * Change subscription plan (upgrade/downgrade).
 * Body: { price_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { price_id } = body;

    if (!price_id || typeof price_id !== 'string') {
      return errorResponse('price_id is required', 400);
    }

    const supabase = await createClient();

    // Get active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return errorResponse('No active subscription found', 404);
    }

    if (!subscription.paddle_subscription_id) {
      return errorResponse('No Paddle subscription linked', 400);
    }

    // Update via Paddle API (prorated immediately)
    await updateSubscription(subscription.paddle_subscription_id, price_id);

    return successResponse({ message: 'Subscription plan updated' });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Update subscription error:', err);
    return errorResponse('Failed to update subscription', 500);
  }
}
