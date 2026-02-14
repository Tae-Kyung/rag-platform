import { Paddle, Environment } from '@paddle/paddle-node-sdk';

let paddleInstance: Paddle | null = null;

/**
 * Get the Paddle server-side client (lazy initialized).
 */
export function getPaddle(): Paddle {
  if (!paddleInstance) {
    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      throw new Error('PADDLE_API_KEY environment variable is not set');
    }
    paddleInstance = new Paddle(apiKey, {
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENV === 'production'
          ? Environment.production
          : Environment.sandbox,
    });
  }
  return paddleInstance;
}

/**
 * Get a subscription by its Paddle subscription ID.
 */
export async function getSubscription(subscriptionId: string) {
  const paddle = getPaddle();
  return paddle.subscriptions.get(subscriptionId);
}

/**
 * Cancel a subscription at the end of the current billing period.
 */
export async function cancelSubscription(subscriptionId: string) {
  const paddle = getPaddle();
  return paddle.subscriptions.cancel(subscriptionId, {
    effectiveFrom: 'next_billing_period',
  });
}

/**
 * Update a subscription's items (e.g., plan change).
 * Pass the new Paddle price ID to switch plans.
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
) {
  const paddle = getPaddle();

  // First get current subscription to find existing item
  const sub = await paddle.subscriptions.get(subscriptionId);
  const currentItem = sub.items?.[0];

  return paddle.subscriptions.update(subscriptionId, {
    items: [
      {
        priceId: newPriceId,
        quantity: currentItem?.quantity ?? 1,
      },
    ],
    prorationBillingMode: 'prorated_immediately',
  });
}
