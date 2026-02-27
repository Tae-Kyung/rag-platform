import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { refineWebContent } from '@/lib/rag/pipeline-refine';
import { AI_REFINE_MAX_INPUT } from '@/config/constants';

export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    await requireOwner(botId);

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return errorResponse('Text is required');
    }

    if (text.length > AI_REFINE_MAX_INPUT) {
      return errorResponse(`Text exceeds maximum length of ${AI_REFINE_MAX_INPUT} characters`);
    }

    const refined = await refineWebContent(text);
    const wordCount = refined.split(/\s+/).filter(Boolean).length;

    return successResponse({ text: refined, wordCount });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    const message = err instanceof Error ? err.message : 'Refine failed';
    return errorResponse(message, 500);
  }
}
