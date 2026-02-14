'use client';

import { useEffect, useState, useCallback } from 'react';
import { UsageGauge } from '@/features/dashboard/UsageGauge';
import { PlanCard } from '@/features/dashboard/PlanCard';
import { InvoiceList } from '@/features/dashboard/InvoiceList';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_bots: number;
  max_documents: number;
  max_messages_per_month: number;
  max_storage_mb: number;
  paddle_price_id_monthly: string | null;
  paddle_price_id_yearly: string | null;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  paddle_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
}

interface Usage {
  messages_used: number;
  documents_used: number;
  storage_used_mb: number;
}

interface Invoice {
  id: string;
  paddle_transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  invoice_url: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

interface BillingData {
  subscription: Subscription | null;
  plan: Plan | null;
  plans: Plan[];
  usage: Usage | null;
  invoices: Invoice[];
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [canceling, setCanceling] = useState(false);

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/billing');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error('Failed to fetch billing:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const handleUpgrade = (plan: Plan) => {
    const priceId =
      billingInterval === 'monthly'
        ? plan.paddle_price_id_monthly
        : plan.paddle_price_id_yearly;

    if (!priceId) return;

    // If user already has a Paddle subscription, update it via API
    if (data?.subscription?.paddle_subscription_id) {
      updatePlan(priceId);
      return;
    }

    // Otherwise open Paddle Checkout Overlay for new subscription
    // @ts-expect-error Paddle global
    if (typeof Paddle !== 'undefined') {
      // @ts-expect-error Paddle global
      Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: { user_id: data?.subscription?.id },
        settings: {
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
          allowLogout: false,
        },
      });
    }
  };

  const updatePlan = async (priceId: string) => {
    try {
      const res = await fetch('/api/owner/billing/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchBilling();
      } else {
        alert(json.error || 'Failed to update plan');
      }
    } catch {
      alert('Failed to update plan');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will keep access until the end of the billing period.')) {
      return;
    }
    setCanceling(true);
    try {
      const res = await fetch('/api/owner/billing/cancel', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        await fetchBilling();
      } else {
        alert(json.error || 'Failed to cancel subscription');
      }
    } catch {
      alert('Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500 dark:text-gray-400">Failed to load billing information.</p>;
  }

  const currentPlanId = data.subscription?.plan_id ?? 'free';
  const currentPlan = data.plan;
  const planOrder = ['free', 'starter', 'pro', 'enterprise'];
  const currentPlanIndex = planOrder.indexOf(currentPlanId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your subscription, usage, and invoices.
        </p>
      </div>

      {/* Current Subscription */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Plan</h3>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentPlan?.name ?? 'Free'}
            </span>
            <span className="ml-2 inline-block rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
              {data.subscription?.status ?? 'active'}
            </span>
          </div>
          {data.subscription?.paddle_subscription_id &&
            data.subscription.status === 'active' && (
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="rounded-lg border border-red-300 dark:border-red-600 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
              >
                {canceling ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            )}
        </div>
        {data.subscription?.current_period_end && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {data.subscription.status === 'canceled'
              ? 'Access until: '
              : 'Renews on: '}
            {new Date(data.subscription.current_period_end).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
      </section>

      {/* Usage */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Usage This Period</h3>
        <div className="mt-4 space-y-4">
          <UsageGauge
            label="Messages"
            used={data.usage?.messages_used ?? 0}
            max={currentPlan?.max_messages_per_month ?? 100}
          />
          <UsageGauge
            label="Documents"
            used={data.usage?.documents_used ?? 0}
            max={currentPlan?.max_documents ?? 10}
          />
          <UsageGauge
            label="Storage"
            used={data.usage?.storage_used_mb ?? 0}
            max={currentPlan?.max_storage_mb ?? 100}
            unit="MB"
          />
        </div>
      </section>

      {/* Plan Comparison */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plans</h3>
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                billingInterval === 'monthly'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                billingInterval === 'yearly'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.plans.map((plan) => {
            const planIndex = planOrder.indexOf(plan.id);
            const isCurrent = plan.id === currentPlanId;
            const isDowngrade = planIndex < currentPlanIndex;

            return (
              <PlanCard
                key={plan.id}
                name={plan.name}
                description={plan.description}
                priceMonthly={plan.price_monthly}
                priceYearly={plan.price_yearly}
                maxBots={plan.max_bots}
                maxDocuments={plan.max_documents}
                maxMessagesPerMonth={plan.max_messages_per_month}
                maxStorageMb={plan.max_storage_mb}
                isCurrent={isCurrent}
                billingInterval={billingInterval}
                isDowngrade={isDowngrade}
                onSelect={
                  !isCurrent && plan.id !== 'free'
                    ? () => handleUpgrade(plan)
                    : undefined
                }
              />
            );
          })}
        </div>
      </section>

      {/* Invoices */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Invoices</h3>
        <InvoiceList invoices={data.invoices} />
      </section>
    </div>
  );
}
