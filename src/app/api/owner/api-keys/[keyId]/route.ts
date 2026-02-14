import { requireAuth, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * DELETE /api/owner/api-keys/[keyId]
 * Revokes (deletes) an API key.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params;
    const user = await requireAuth();
    const supabase = createServiceRoleClient();

    // Verify ownership
    const { data: key } = await supabase
      .from('api_keys')
      .select('id, user_id')
      .eq('id', keyId)
      .single();

    if (!key) {
      return errorResponse('API key not found', 404);
    }

    if (key.user_id !== user.id) {
      return errorResponse('Forbidden', 403);
    }

    await supabase.from('api_keys').delete().eq('id', keyId);

    return successResponse({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Failed to delete API key', 500);
  }
}
