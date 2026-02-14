-- Rename Stripe columns to Paddle equivalents
-- (Paddle is Merchant of Record; uses "transactions" instead of "invoices")

-- plans: stripe_price_id → paddle_price_id
alter table public.plans rename column stripe_price_id_monthly to paddle_price_id_monthly;
alter table public.plans rename column stripe_price_id_yearly to paddle_price_id_yearly;

-- subscriptions: stripe_* → paddle_*
alter table public.subscriptions rename column stripe_subscription_id to paddle_subscription_id;
alter table public.subscriptions rename column stripe_customer_id to paddle_customer_id;

-- invoices: stripe_invoice_id → paddle_transaction_id
alter table public.invoices rename column stripe_invoice_id to paddle_transaction_id;
