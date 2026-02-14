import type { PlanId } from '@/types';

/**
 * Paddle Price IDs for each plan.
 * Replace with actual Paddle Price IDs from the Paddle dashboard.
 * Free plan has no price IDs (no checkout needed).
 */
export const PADDLE_PRICES: Record<
  Exclude<PlanId, 'free'>,
  { monthly: string; yearly: string }
> = {
  starter: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY || 'pri_starter_monthly',
    yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY || 'pri_starter_yearly',
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY || 'pri_pro_monthly',
    yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY || 'pri_pro_yearly',
  },
  enterprise: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_MONTHLY || 'pri_enterprise_monthly',
    yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_YEARLY || 'pri_enterprise_yearly',
  },
};

/**
 * Resolve Paddle price ID from plan ID and billing interval.
 */
export function getPaddlePriceId(
  planId: Exclude<PlanId, 'free'>,
  interval: 'monthly' | 'yearly'
): string {
  return PADDLE_PRICES[planId][interval];
}
