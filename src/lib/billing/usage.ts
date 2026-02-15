import { createServiceRoleClient } from '@/lib/supabase/service';

export interface UsageRecord {
  messages_used: number;
  documents_used: number;
  storage_used_mb: number;
  period_start: string;
  period_end: string;
}

/**
 * Get or create usage record for the current billing period.
 */
async function getOrCreateUsageRecord(userId: string) {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Try to get existing record for current period
  const { data: existing } = await supabase
    .from('usage_records')
    .select('*')
    .eq('user_id', userId)
    .gte('period_start', periodStart)
    .lte('period_start', periodEnd)
    .single();

  if (existing) return existing;

  // Create new usage record
  const { data: created, error } = await supabase
    .from('usage_records')
    .insert({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      messages_used: 0,
      documents_used: 0,
      storage_used_mb: 0,
    })
    .select()
    .single();

  if (error) {
    // Race condition: another request may have created it
    const { data: retry } = await supabase
      .from('usage_records')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', periodStart)
      .lte('period_start', periodEnd)
      .single();
    return retry;
  }

  return created;
}

/**
 * Check if user has remaining message quota.
 */
export async function checkMessageQuota(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createServiceRoleClient();

  // Get user's plan limits
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  let maxMessages = 100; // free tier default
  if (sub) {
    const { data: plan } = await supabase
      .from('plans')
      .select('max_messages_per_month')
      .eq('id', sub.plan_id)
      .single();
    if (plan) maxMessages = plan.max_messages_per_month;
  }

  // Unlimited plan
  if (maxMessages === -1) {
    return { allowed: true, remaining: -1 };
  }

  const usage = await getOrCreateUsageRecord(userId);
  const used = usage?.messages_used ?? 0;
  const remaining = Math.max(0, maxMessages - used);

  return { allowed: remaining > 0, remaining };
}

/**
 * Increment message count for the current billing period.
 */
export async function incrementMessageCount(userId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const usage = await getOrCreateUsageRecord(userId);
  if (!usage) return;

  await supabase
    .from('usage_records')
    .update({ messages_used: (usage.messages_used ?? 0) + 1 })
    .eq('id', usage.id);
}

/**
 * Increment document count for the current billing period.
 */
export async function incrementDocumentCount(userId: string, count: number = 1): Promise<void> {
  const supabase = createServiceRoleClient();
  const usage = await getOrCreateUsageRecord(userId);
  if (!usage) return;

  await supabase
    .from('usage_records')
    .update({ documents_used: (usage.documents_used ?? 0) + count })
    .eq('id', usage.id);
}

/**
 * Decrement document count for the current billing period.
 */
export async function decrementDocumentCount(userId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const usage = await getOrCreateUsageRecord(userId);
  if (!usage) return;

  await supabase
    .from('usage_records')
    .update({ documents_used: Math.max(0, (usage.documents_used ?? 0) - 1) })
    .eq('id', usage.id);
}

/**
 * Update storage usage for the current billing period.
 */
export async function incrementStorageUsage(userId: string, fileSizeBytes: number): Promise<void> {
  const supabase = createServiceRoleClient();
  const usage = await getOrCreateUsageRecord(userId);
  if (!usage) return;

  const addedMb = fileSizeBytes / (1024 * 1024);
  await supabase
    .from('usage_records')
    .update({
      storage_used_mb: Math.round(((usage.storage_used_mb ?? 0) + addedMb) * 100) / 100,
    })
    .eq('id', usage.id);
}

/**
 * Decrease storage usage for the current billing period.
 */
export async function decrementStorageUsage(userId: string, fileSizeBytes: number): Promise<void> {
  const supabase = createServiceRoleClient();
  const usage = await getOrCreateUsageRecord(userId);
  if (!usage) return;

  const removedMb = fileSizeBytes / (1024 * 1024);
  await supabase
    .from('usage_records')
    .update({
      storage_used_mb: Math.max(0, Math.round(((usage.storage_used_mb ?? 0) - removedMb) * 100) / 100),
    })
    .eq('id', usage.id);
}

/**
 * Get current usage for the billing period.
 */
export async function getCurrentUsage(userId: string): Promise<UsageRecord | null> {
  const usage = await getOrCreateUsageRecord(userId);
  if (!usage) return null;
  return {
    messages_used: usage.messages_used,
    documents_used: usage.documents_used,
    storage_used_mb: usage.storage_used_mb,
    period_start: usage.period_start,
    period_end: usage.period_end,
  };
}
