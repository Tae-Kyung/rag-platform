import { requireAdmin, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/sys/revenue
 * System admin: MRR, plan distribution, monthly revenue, churn rate.
 */
export async function GET() {
  try {
    await requireAdmin();
    const supabase = createServiceRoleClient();

    // Get all subscriptions with plan info
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_id, status, created_at, updated_at');

    const subs = subscriptions ?? [];

    // Get plan prices
    const { data: plans } = await supabase
      .from('plans')
      .select('id, name, price_monthly, price_yearly');

    const planMap: Record<string, { name: string; price_monthly: number; price_yearly: number }> = {};
    for (const p of plans ?? []) {
      planMap[p.id] = { name: p.name, price_monthly: p.price_monthly, price_yearly: p.price_yearly };
    }

    // MRR calculation (active subscriptions × monthly price)
    const activeSubs = subs.filter((s) => s.status === 'active');
    let mrr = 0;
    for (const s of activeSubs) {
      const plan = planMap[s.plan_id];
      if (plan) mrr += plan.price_monthly;
    }

    // Plan distribution
    const planDistribution: Record<string, number> = {};
    for (const s of activeSubs) {
      const name = planMap[s.plan_id]?.name ?? s.plan_id;
      planDistribution[name] = (planDistribution[name] || 0) + 1;
    }

    // Monthly revenue from invoices (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: invoices } = await supabase
      .from('invoices')
      .select('amount, status, created_at')
      .eq('status', 'completed')
      .gte('created_at', twelveMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    const monthlyRevenue: Record<string, number> = {};
    for (const inv of invoices ?? []) {
      const month = inv.created_at.slice(0, 7); // YYYY-MM
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + inv.amount;
    }

    const revenueChart = Object.entries(monthlyRevenue).map(([month, amount]) => ({
      month,
      amount: Math.round(amount * 100) / 100,
    }));

    // Churn rate: canceled this month / total active at start of month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const canceledThisMonth = subs.filter(
      (s) => s.status === 'canceled' && s.updated_at >= thisMonthStart
    ).length;
    const totalAtMonthStart = activeSubs.length + canceledThisMonth;
    const churnRate = totalAtMonthStart > 0
      ? Math.round((canceledThisMonth / totalAtMonthStart) * 10000) / 100
      : 0;

    return successResponse({
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      totalSubscribers: activeSubs.length,
      planDistribution: Object.entries(planDistribution).map(([plan, count]) => ({
        plan,
        count,
      })),
      revenueChart,
      churnRate,
      canceledThisMonth,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error('sys/revenue error:', err);
    return errorResponse('Failed to fetch revenue data', 500);
  }
}
