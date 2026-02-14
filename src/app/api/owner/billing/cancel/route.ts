import { requireAuth, AuthError } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { cancelSubscription } from '@/lib/billing/paddle';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * POST /api/owner/billing/cancel
 * Cancel the current subscription at end of billing period.
 */
export async function POST() {
  try {
    const user = await requireAuth();
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

    // Cancel via Paddle API (effective at end of billing period)
    await cancelSubscription(subscription.paddle_subscription_id);

    // Update local status to reflect scheduled cancellation
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('id', subscription.id);

    return successResponse({ message: 'Subscription will cancel at end of billing period' });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Cancel subscription error:', err);
    return errorResponse('Failed to cancel subscription', 500);
  }
}
