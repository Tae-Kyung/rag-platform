import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { processDocument } from '@/lib/rag/pipeline';

export const maxDuration = 300;

export async function POST(request: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const { botId } = await params;
    await requireOwner(botId);

    const body = await request.json();
    const { url, text, title } = body;

    if (!url) {
      return errorResponse('URL is required');
    }

    try {
      new URL(url);
    } catch {
      return errorResponse('Invalid URL format');
    }

    const supabase = createServiceRoleClient();

    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        bot_id: botId,
        file_name: title || url,
        file_type: 'url',
        source_url: url,
        status: 'pending',
      })
      .select()
      .single();

    if (error || !doc) {
      return errorResponse('Failed to create document record', 500);
    }

    // Process immediately — skip re-crawling if prefetched text is provided
    try {
      const options = text ? { prefetchedText: text, prefetchedTitle: title } : {};
      const result = await processDocument(doc.id, botId, options);
      return successResponse({ ...doc, ...result }, 201);
    } catch (processError) {
      // Document is already marked as failed by pipeline
      const message = processError instanceof Error ? processError.message : 'Crawl failed';
      return errorResponse(message, 500);
    }
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
