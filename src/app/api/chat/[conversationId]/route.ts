import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

type RouteParams = { params: Promise<{ conversationId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params;
    const supabase = createServiceRoleClient();

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
