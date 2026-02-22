import { NextRequest } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';

const createModelSchema = z.object({
  name: z.string().min(1).max(200),
  model_id: z.string().min(1).max(200),
  provider: z.string().max(100).default('Custom'),
  base_url: z.string().url(),
  api_key_env: z.string().max(100).default(''),
  api_key_header: z.string().max(100).default('x-api-key'),
  is_active: z.boolean().default(true),
});

/**
 * GET /api/sys/models — List all custom models
 */
export async function GET() {
  try {
    await requireAdmin();

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('custom_models')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse(`Failed to fetch models: ${error.message}`, 500);
    }

    return successResponse({ models: data ?? [] });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}

/**
 * POST /api/sys/models — Create a new custom model
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = createModelSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('custom_models')
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return errorResponse('A model with this model_id already exists', 409);
      }
      return errorResponse(`Failed to create model: ${error.message}`, 500);
    }

    return successResponse(data, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
