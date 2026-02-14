import { createHash } from 'crypto';
import { createServiceRoleClient } from '@/lib/supabase/service';
import type { PlanId } from '@/types';

export class APIKeyError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface APIKeyAuth {
  userId: string;
  keyId: string;
  plan: PlanId;
}

/**
 * Authenticate a request using an API key from the Authorization header.
 * Expected format: Authorization: Bearer ask_xxxxx
 * Throws APIKeyError on failure.
 */
export async function authenticateAPIKey(request: Request): Promise<APIKeyAuth> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new APIKeyError('Missing Authorization header', 401);
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new APIKeyError('Invalid Authorization format. Use: Bearer <api_key>', 401);
  }

  const rawKey = parts[1];
  if (!rawKey.startsWith('ask_')) {
    throw new APIKeyError('Invalid API key format', 401);
  }

  // Hash the key for lookup
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const supabase = createServiceRoleClient();

  // Look up the key
  const { data: keyRecord } = await supabase
    .from('api_keys')
    .select('id, user_id, expires_at')
    .eq('key_hash', keyHash)
    .single();

  if (!keyRecord) {
    throw new APIKeyError('Invalid API key', 401);
  }

  // Check expiration
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    throw new APIKeyError('API key has expired', 401);
  }

  // Update last_used_at (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRecord.id)
    .then(() => {});

  // Get user's plan
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_id, status')
    .eq('user_id', keyRecord.user_id)
    .in('status', ['active', 'canceled'])
    .single();

  const planId = (sub?.plan_id ?? 'free') as PlanId;

  // Check if plan allows API access (Pro+ only)
  if (planId === 'free' || planId === 'starter') {
    throw new APIKeyError('API access requires Pro plan or higher', 403);
  }

  return {
    userId: keyRecord.user_id,
    keyId: keyRecord.id,
    plan: planId,
  };
}
