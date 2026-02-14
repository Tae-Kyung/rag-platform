import { NextRequest } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { checkAPIAccess } from '@/lib/billing/plan-guard';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/owner/api-keys
 * Returns list of API keys (prefix only, never the full key).
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createServiceRoleClient();

    const { data: keys } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, last_used_at, expires_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return successResponse(keys ?? []);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Failed to fetch API keys', 500);
  }
}

/**
 * POST /api/owner/api-keys
 * Creates a new API key. The full key is returned once and never stored.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check API access (Pro+ only)
    const hasAccess = await checkAPIAccess(user.id);
    if (!hasAccess) {
      return errorResponse('API access requires Pro plan or higher', 403);
    }

    const body = await request.json();
    const name = (body.name || '').trim();

    if (!name || name.length > 100) {
      return errorResponse('Name is required (max 100 characters)', 400);
    }

    // Generate key: ask_ + 32 random hex bytes
    const rawKey = `ask_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12); // "ask_" + 8 hex chars

    const supabase = createServiceRoleClient();

    const { data: created, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
      })
      .select('id, name, key_prefix, created_at')
      .single();

    if (error) {
      console.error('API key creation error:', error);
      return errorResponse('Failed to create API key', 500);
    }

    // Return the full key only once
    return successResponse({
      ...created,
      key: rawKey,
    }, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Failed to create API key', 500);
  }
}
