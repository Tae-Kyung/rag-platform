import { createServiceRoleClient } from '@/lib/supabase/service';
import type { Json } from '@/types/database';
import type {
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
  SubscriptionCanceledEvent,
  SubscriptionPastDueEvent,
  TransactionCompletedEvent,
  TransactionPaymentFailedEvent,
} from '@paddle/paddle-node-sdk';

/**
 * Find the plan_id by matching the Paddle price ID.
 */
async function findPlanByPriceId(priceId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('plans')
    .select('id')
    .or(`paddle_price_id_monthly.eq.${priceId},paddle_price_id_yearly.eq.${priceId}`)
    .single();
  return data?.id ?? null;
}

/**
 * Log an event to system_logs.
 */
async function logEvent(source: string, message: string, metadata: Record<string, unknown> = {}) {
  const supabase = createServiceRoleClient();
  await supabase.from('system_logs').insert({
    level: 'info',
    source,
    message,
    metadata: metadata as unknown as Json,
  });
}

/**
 * Handle subscription.created
 * - Create or update subscription record
 * - Store paddle_customer_id and paddle_subscription_id
 */
export async function handleSubscriptionCreated(event: SubscriptionCreatedEvent) {
  const data = event.data;
  const supabase = createServiceRoleClient();

  const customerId = data.customerId;
  const subscriptionId = data.id;
  const priceId = data.items?.[0]?.price?.id;
  const planId = priceId ? await findPlanByPriceId(priceId) : null;
  const userId = (data.customData as Record<string, string> | null)?.user_id;

  if (!userId) {
    await logEvent('webhook.paddle', 'subscription.created missing user_id in customData', {
      paddle_subscription_id: subscriptionId,
    });
    return;
  }

  const periodStart = data.currentBillingPeriod?.startsAt ?? null;
  const periodEnd = data.currentBillingPeriod?.endsAt ?? null;

  // Upsert subscription
  await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan_id: planId ?? 'free',
        status: 'active',
        paddle_subscription_id: subscriptionId,
        paddle_customer_id: customerId,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  await logEvent('webhook.paddle', 'subscription.created', {
    user_id: userId,
    plan_id: planId,
    paddle_subscription_id: subscriptionId,
  });
}

/**
 * Handle subscription.updated
 * - Update plan_id if price changed
 * - Update billing period
 */
export async function handleSubscriptionUpdated(event: SubscriptionUpdatedEvent) {
  const data = event.data;
  const supabase = createServiceRoleClient();

  const subscriptionId = data.id;
  const priceId = data.items?.[0]?.price?.id;
  const planId = priceId ? await findPlanByPriceId(priceId) : null;

  const periodStart = data.currentBillingPeriod?.startsAt ?? null;
  const periodEnd = data.currentBillingPeriod?.endsAt ?? null;

  const updateData: Record<string, unknown> = {
    status: data.status ?? 'active',
    current_period_start: periodStart,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  };

  if (planId) {
    updateData.plan_id = planId;
  }

  await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('paddle_subscription_id', subscriptionId);

  await logEvent('webhook.paddle', 'subscription.updated', {
    paddle_subscription_id: subscriptionId,
    plan_id: planId,
    status: data.status,
  });
}

/**
 * Handle subscription.canceled
 * - Mark subscription as canceled
 * - Downgrade to free plan
 */
export async function handleSubscriptionCanceled(event: SubscriptionCanceledEvent) {
  const data = event.data;
  const supabase = createServiceRoleClient();

  const subscriptionId = data.id;

  // Get user_id for the free plan downgrade
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('paddle_subscription_id', subscriptionId)
    .single();

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      plan_id: 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', subscriptionId);

  await logEvent('webhook.paddle', 'subscription.canceled', {
    paddle_subscription_id: subscriptionId,
    user_id: sub?.user_id,
  });
}

/**
 * Handle subscription.past_due
 * - Mark subscription as past_due
 */
export async function handleSubscriptionPastDue(event: SubscriptionPastDueEvent) {
  const data = event.data;
  const supabase = createServiceRoleClient();

  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id);

  await logEvent('webhook.paddle', 'subscription.past_due', {
    paddle_subscription_id: data.id,
  });
}

/**
 * Handle transaction.completed
 * - Insert invoice record
 * - Reset usage for new billing period
 */
export async function handleTransactionCompleted(event: TransactionCompletedEvent) {
  const data = event.data;
  const supabase = createServiceRoleClient();

  const transactionId = data.id;
  const subscriptionId = data.subscriptionId;

  // Find the subscription to get user_id
  let userId: string | null = null;
  if (subscriptionId) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('paddle_subscription_id', subscriptionId)
      .single();
    userId = sub?.user_id ?? null;
  }

  if (!userId) {
    userId = (data.customData as Record<string, string> | null)?.user_id ?? null;
  }

  if (!userId) {
    await logEvent('webhook.paddle', 'transaction.completed: cannot find user_id', {
      paddle_transaction_id: transactionId,
    });
    return;
  }

  // Calculate total amount from details
  const amount = data.details?.totals?.total
    ? parseInt(data.details.totals.total, 10) / 100
    : 0;
  const currency = data.currencyCode ?? 'USD';

  const periodStart = data.billingPeriod?.startsAt ?? null;
  const periodEnd = data.billingPeriod?.endsAt ?? null;

  // Insert invoice (paddle_transaction_id is UNIQUE, prevents duplicates)
  await supabase.from('invoices').insert({
    user_id: userId,
    paddle_transaction_id: transactionId,
    amount,
    currency,
    status: 'paid',
    period_start: periodStart,
    period_end: periodEnd,
  });

  // Reset usage records for new billing period if period info available
  if (periodStart && periodEnd) {
    const { data: existing } = await supabase
      .from('usage_records')
      .select('id')
      .eq('user_id', userId)
      .gte('period_start', periodStart)
      .single();

    if (!existing) {
      await supabase.from('usage_records').insert({
        user_id: userId,
        period_start: periodStart,
        period_end: periodEnd,
        messages_used: 0,
        documents_used: 0,
        storage_used_mb: 0,
      });
    }
  }

  await logEvent('webhook.paddle', 'transaction.completed', {
    user_id: userId,
    paddle_transaction_id: transactionId,
    amount,
    currency,
  });
}

/**
 * Handle transaction.payment_failed
 * - Log the failure for monitoring
 */
export async function handleTransactionPaymentFailed(event: TransactionPaymentFailedEvent) {
  const data = event.data;

  await logEvent('webhook.paddle', 'transaction.payment_failed', {
    paddle_transaction_id: data.id,
    subscription_id: data.subscriptionId,
    status: data.status,
  });
}
