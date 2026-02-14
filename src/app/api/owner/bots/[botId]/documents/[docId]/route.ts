import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createServiceRoleClient } from '@/lib/supabase/service';

interface RouteParams {
  params: Promise<{ botId: string; docId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { botId, docId } = await params;
    await requireOwner(botId);

    const supabase = createServiceRoleClient();

    const { data: doc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docId)
      .eq('bot_id', botId)
      .single();

    if (error || !doc) {
      return errorResponse('Document not found', 404);
    }

    return successResponse(doc);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { botId, docId } = await params;
    await requireOwner(botId);

    const supabase = createServiceRoleClient();

    // Get document to find storage path
    const { data: doc } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', docId)
      .eq('bot_id', botId)
      .single();

    if (!doc) {
      return errorResponse('Document not found', 404);
    }

    // Delete from storage if exists
    if (doc.storage_path) {
      await supabase.storage
        .from('documents')
        .remove([doc.storage_path]);
    }

    // Delete document (CASCADE deletes chunks)
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)
      .eq('bot_id', botId);

    if (error) {
      return errorResponse(`Failed to delete document: ${error.message}`, 500);
    }

    return successResponse({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
