import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createServiceRoleClient } from '@/lib/supabase/service';

interface RouteParams {
  params: Promise<{ botId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { botId } = await params;
    await requireOwner(botId);

    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('ids array is required');
    }

    if (ids.length > 100) {
      return errorResponse('Maximum 100 documents per bulk delete');
    }

    const supabase = createServiceRoleClient();

    // Get storage paths for files that need storage cleanup
    const { data: docs } = await supabase
      .from('documents')
      .select('id, storage_path')
      .eq('bot_id', botId)
      .in('id', ids);

    // Delete from storage
    const storagePaths = (docs ?? [])
      .map((d) => d.storage_path)
      .filter((p): p is string => !!p);

    if (storagePaths.length > 0) {
      await supabase.storage.from('documents').remove(storagePaths);
    }

    // Delete documents (CASCADE deletes chunks + qa_pairs via document_id FK)
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('bot_id', botId)
      .in('id', ids);

    if (error) {
      return errorResponse(`Failed to delete documents: ${error.message}`, 500);
    }

    return successResponse({ deleted: ids.length });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
