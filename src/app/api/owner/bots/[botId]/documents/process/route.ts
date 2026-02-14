import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { processDocument } from '@/lib/rag/pipeline';

export const maxDuration = 300;

export async function POST(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    await requireOwner(botId);

    const body = await request.json();
    const { documentId, useVision = false } = body;

    if (!documentId) {
      return errorResponse('Document ID required');
    }

    const result = await processDocument(documentId, botId, { useVision });
    return successResponse(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    const message = err instanceof Error ? err.message : 'Processing failed';
    return errorResponse(message, 500);
  }
}
