import { createServiceRoleClient } from '@/lib/supabase/service';
import type { BotChannel } from '@/types';

interface PlanLimits {
  max_bots: number;
  max_documents: number;
  max_messages_per_month: number;
  max_storage_mb: number;
  features: Record<string, unknown>;
}

/**
 * Get the plan limits for a user. Falls back to free tier defaults.
 */
async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const supabase = createServiceRoleClient();

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', userId)
    .in('status', ['active', 'canceled']) // canceled users keep access until period end
    .single();

  const planId = sub?.plan_id ?? 'free';

  const { data: plan } = await supabase
    .from('plans')
    .select('max_bots, max_documents, max_messages_per_month, max_storage_mb, features')
    .eq('id', planId)
    .single();

  if (plan) {
    return {
      max_bots: plan.max_bots,
      max_documents: plan.max_documents,
      max_messages_per_month: plan.max_messages_per_month,
      max_storage_mb: plan.max_storage_mb,
      features: (plan.features as Record<string, unknown>) ?? {},
    };
  }

  // Free tier defaults
  return {
    max_bots: 1,
    max_documents: 10,
    max_messages_per_month: 100,
    max_storage_mb: 100,
    features: {},
  };
}

/**
 * Check if user can create another bot.
 */
export async function checkBotLimit(
  userId: string
): Promise<{ allowed: boolean; current: number; max: number }> {
  const supabase = createServiceRoleClient();
  const limits = await getUserPlanLimits(userId);

  if (limits.max_bots === -1) {
    return { allowed: true, current: 0, max: -1 };
  }

  const { count } = await supabase
    .from('bots')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const current = count ?? 0;
  return {
    allowed: current < limits.max_bots,
    current,
    max: limits.max_bots,
  };
}

/**
 * Check if user can add another document to a bot.
 */
export async function checkDocumentLimit(
  userId: string,
  botId: string
): Promise<{ allowed: boolean; current: number; max: number }> {
  const supabase = createServiceRoleClient();
  const limits = await getUserPlanLimits(userId);

  if (limits.max_documents === -1) {
    return { allowed: true, current: 0, max: -1 };
  }

  // Count documents across ALL bots (plan limit is per-user)
  const { data: bots } = await supabase
    .from('bots')
    .select('id')
    .eq('user_id', userId);

  const botIds = (bots ?? []).map((b) => b.id);
  if (botIds.length === 0) {
    return { allowed: true, current: 0, max: limits.max_documents };
  }

  const { count } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .in('bot_id', botIds);

  const current = count ?? 0;
  return {
    allowed: current < limits.max_documents,
    current,
    max: limits.max_documents,
  };
}

/**
 * Check if user has storage capacity for a new file.
 */
export async function checkStorageLimit(
  userId: string,
  fileSizeBytes: number
): Promise<{ allowed: boolean; usedMb: number; maxMb: number }> {
  const supabase = createServiceRoleClient();
  const limits = await getUserPlanLimits(userId);

  if (limits.max_storage_mb === -1) {
    return { allowed: true, usedMb: 0, maxMb: -1 };
  }

  // Calculate total storage across all user bots
  const { data: bots } = await supabase
    .from('bots')
    .select('id')
    .eq('user_id', userId);

  const botIds = (bots ?? []).map((b) => b.id);
  let totalBytes = 0;

  if (botIds.length > 0) {
    const { data: docs } = await supabase
      .from('documents')
      .select('file_size')
      .in('bot_id', botIds);

    totalBytes = (docs ?? []).reduce((sum, d) => sum + (d.file_size ?? 0), 0);
  }

  const usedMb = totalBytes / (1024 * 1024);
  const newTotalMb = usedMb + fileSizeBytes / (1024 * 1024);

  return {
    allowed: newTotalMb <= limits.max_storage_mb,
    usedMb: Math.round(usedMb * 100) / 100,
    maxMb: limits.max_storage_mb,
  };
}

/**
 * Check if user has remaining message quota.
 * (Delegates to existing checkMessageQuota in usage.ts)
 */
export async function checkMessageLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  // Import dynamically to avoid circular dependency
  const { checkMessageQuota } = await import('./usage');
  return checkMessageQuota(userId);
}

/**
 * Check if user can add another Q&A pair (counts as a document).
 */
export async function checkQALimit(
  userId: string,
  botId: string
): Promise<{ allowed: boolean }> {
  const result = await checkDocumentLimit(userId, botId);
  return { allowed: result.allowed };
}

/**
 * Check if user's plan allows a specific channel type.
 * Free: web only. Starter: web + telegram. Pro+: all channels.
 */
export async function checkChannelAccess(
  userId: string,
  channel: BotChannel
): Promise<boolean> {
  if (channel === 'web') return true; // web is always available

  const supabase = createServiceRoleClient();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', userId)
    .in('status', ['active', 'canceled'])
    .single();

  const planId = sub?.plan_id ?? 'free';

  // Channel access by plan
  const channelAccess: Record<string, BotChannel[]> = {
    free: ['web'],
    starter: ['web', 'telegram'],
    pro: ['web', 'telegram', 'kakao', 'whatsapp', 'wechat', 'api'],
    enterprise: ['web', 'telegram', 'kakao', 'whatsapp', 'wechat', 'api'],
  };

  const allowed = channelAccess[planId] ?? channelAccess.free;
  return allowed.includes(channel);
}

/**
 * Check if user's plan allows API access.
 */
export async function checkAPIAccess(userId: string): Promise<boolean> {
  return checkChannelAccess(userId, 'api');
}

/**
 * Get usage alert level for a user.
 * Returns null if no alert, '80' for warning, '100' for limit reached.
 */
export async function getUsageAlertLevel(
  userId: string
): Promise<{ messageAlert: number | null; storageAlert: number | null; botAlert: number | null }> {
  const supabase = createServiceRoleClient();
  const limits = await getUserPlanLimits(userId);

  // Message usage
  let messageAlert: number | null = null;
  if (limits.max_messages_per_month !== -1) {
    const { checkMessageQuota } = await import('./usage');
    const quota = await checkMessageQuota(userId);
    if (!quota.allowed) {
      messageAlert = 100;
    } else if (quota.remaining !== -1) {
      const used = limits.max_messages_per_month - quota.remaining;
      const pct = (used / limits.max_messages_per_month) * 100;
      if (pct >= 80) messageAlert = Math.round(pct);
    }
  }

  // Storage usage
  let storageAlert: number | null = null;
  if (limits.max_storage_mb !== -1) {
    const storageCheck = await checkStorageLimit(userId, 0);
    const pct = (storageCheck.usedMb / limits.max_storage_mb) * 100;
    if (pct >= 80) storageAlert = Math.round(pct);
  }

  // Bot count
  let botAlert: number | null = null;
  if (limits.max_bots !== -1) {
    const { count } = await supabase
      .from('bots')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    const current = count ?? 0;
    if (current >= limits.max_bots) botAlert = 100;
  }

  return { messageAlert, storageAlert, botAlert };
}
