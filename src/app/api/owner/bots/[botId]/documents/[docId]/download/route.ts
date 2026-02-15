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
      .select('storage_path, file_name')
      .eq('id', docId)
      .eq('bot_id', botId)
      .single();

    if (error || !doc) {
      return errorResponse('Document not found', 404);
    }

    if (!doc.storage_path) {
      return errorResponse('No file available for download', 400);
    }

    const { data: signedData, error: signError } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.storage_path, 60);

    if (signError || !signedData?.signedUrl) {
      return errorResponse('Failed to generate download URL', 500);
    }

    return successResponse({
      url: signedData.signedUrl,
      file_name: doc.file_name,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
