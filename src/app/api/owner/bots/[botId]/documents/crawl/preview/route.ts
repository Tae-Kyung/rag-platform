import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { crawlURL } from '@/lib/rag/parser';

export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    await requireOwner(botId);

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return errorResponse('URL is required');
    }

    try {
      new URL(url);
    } catch {
      return errorResponse('Invalid URL format');
    }

    const result = await crawlURL(url);

    const wordCount = result.text.split(/\s+/).filter(Boolean).length;

    return successResponse({
      url,
      title: result.title || '',
      text: result.text,
      wordCount,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    const message = err instanceof Error ? err.message : 'Crawl failed';
    return errorResponse(message, 500);
  }
}
