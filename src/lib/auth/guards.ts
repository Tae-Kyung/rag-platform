import { createClient } from '@/lib/supabase/server';
import type { PlanId } from '@/types';

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Require authenticated user. Throws AuthError if not authenticated.
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError('Unauthorized', 401);
  }

  return user;
}

/**
 * Require system admin role. Throws AuthError if not admin.
 */
export async function requireAdmin() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new AuthError('Forbidden: admin access required', 403);
  }

  return user;
}

/**
 * Require bot ownership. Throws AuthError if user doesn't own the bot.
 */
export async function requireOwner(botId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: bot } = await supabase
    .from('bots')
    .select('id, user_id')
    .eq('id', botId)
    .single();

  if (!bot) {
    throw new AuthError('Bot not found', 404);
  }

  if (bot.user_id !== user.id) {
    throw new AuthError('Forbidden: not the bot owner', 403);
  }

  return user;
}

/**
 * Require minimum plan level. Throws AuthError if subscription is insufficient.
 */
export async function requirePlan(minPlan: PlanId) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id, status')
    .eq('user_id', user.id)
    .single();

  if (!subscription || subscription.status !== 'active') {
    throw new AuthError('No active subscription', 403);
  }

  const planOrder: PlanId[] = ['free', 'starter', 'pro', 'enterprise'];
  const currentIndex = planOrder.indexOf(subscription.plan_id as PlanId);
  const requiredIndex = planOrder.indexOf(minPlan);

  if (currentIndex < requiredIndex) {
    throw new AuthError(
      `Plan upgrade required: ${minPlan} or higher`,
      403
    );
  }

  return subscription;
}
