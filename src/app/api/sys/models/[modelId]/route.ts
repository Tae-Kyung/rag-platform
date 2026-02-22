import { NextRequest } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';

const updateModelSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  model_id: z.string().min(1).max(200).optional(),
  provider: z.string().max(100).optional(),
  base_url: z.string().url().optional(),
  api_key_env: z.string().max(100).optional(),
  api_key_header: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ modelId: string }> };

/**
 * PUT /api/sys/models/[modelId] — Update a custom model
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { modelId } = await context.params;
    const body = await request.json();
    const parsed = updateModelSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('custom_models')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', modelId)
      .select()
      .single();

    if (error || !data) {
      if (error?.code === '23505') {
        return errorResponse('A model with this model_id already exists', 409);
      }
      return errorResponse('Model not found', 404);
    }

    return successResponse(data);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}

/**
 * DELETE /api/sys/models/[modelId] — Delete a custom model
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { modelId } = await context.params;
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('custom_models')
      .delete()
      .eq('id', modelId);

    if (error) {
      return errorResponse('Failed to delete model', 500);
    }

    return successResponse({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
