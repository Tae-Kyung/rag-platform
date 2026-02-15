import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

type RouteParams = { params: Promise<{ conversationId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('bot_id');

    const supabase = createServiceRoleClient();

    // Verify conversation belongs to the requested bot
    if (botId) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('bot_id', botId)
        .single();

      if (!conv) {
        return successResponse([]);
      }
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, role, content, sources, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      return errorResponse('Failed to fetch messages', 500);
    }

    return successResponse(messages || []);
  } catch {
    return errorResponse('Internal server error', 500);
  }
}
