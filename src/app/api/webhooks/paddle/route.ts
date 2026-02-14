import { NextRequest, NextResponse } from 'next/server';
import { EventName } from '@paddle/paddle-node-sdk';
import { getPaddle } from '@/lib/billing/paddle';
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionCanceled,
  handleSubscriptionPastDue,
  handleTransactionCompleted,
  handleTransactionPaymentFailed,
} from '@/lib/billing/webhook-handlers';
import { createServiceRoleClient } from '@/lib/supabase/service';

import type {
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
  SubscriptionCanceledEvent,
  SubscriptionPastDueEvent,
  TransactionCompletedEvent,
  TransactionPaymentFailedEvent,
} from '@paddle/paddle-node-sdk';

/**
 * POST /api/webhooks/paddle
 * Receives and processes Paddle webhook events.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('paddle-signature') ?? '';

    const secretKey = process.env.PADDLE_WEBHOOK_SECRET;
    if (!secretKey) {
      console.error('PADDLE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Verify signature and parse event
    const paddle = getPaddle();
    let event;
    try {
      event = paddle.webhooks.unmarshal(rawBody, secretKey, signature);
    } catch {
      console.error('Paddle webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (!event) {
      return NextResponse.json({ error: 'Could not parse event' }, { status: 400 });
    }

    // Log the raw event
    const supabase = createServiceRoleClient();
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'webhook.paddle',
      message: `Received ${event.eventType}`,
      metadata: { eventId: event.eventId, eventType: event.eventType },
    });

    // Route event to handler
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event as SubscriptionCreatedEvent);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event as SubscriptionUpdatedEvent);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event as SubscriptionCanceledEvent);
        break;
      case EventName.SubscriptionPastDue:
        await handleSubscriptionPastDue(event as SubscriptionPastDueEvent);
        break;
      case EventName.TransactionCompleted:
        await handleTransactionCompleted(event as TransactionCompletedEvent);
        break;
      case EventName.TransactionPaymentFailed:
        await handleTransactionPaymentFailed(event as TransactionPaymentFailedEvent);
        break;
      default:
        // Unhandled event type — acknowledge but don't process
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('Paddle webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
