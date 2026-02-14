import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/owner/bots/[botId]/conversations?page=1&limit=20&search=&channel=&dateFrom=&dateTo=
 * Returns paginated conversation list.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    await requireOwner(botId);

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const channel = searchParams.get('channel') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const supabase = createServiceRoleClient();
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('conversations')
      .select('id, session_id, language, channel, created_at, updated_at', { count: 'exact' })
      .eq('bot_id', botId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (channel) {
      query = query.eq('channel', channel);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: conversations, count } = await query;

    if (!conversations) {
      return successResponse({ conversations: [], total: 0, page, limit });
    }

    // Fetch message counts and first user message per conversation
    const convIds = conversations.map((c) => c.id);
    const { data: messagesData } = await supabase
      .from('messages')
      .select('conversation_id, role, content')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: true });

    const messages = messagesData ?? [];

    const msgCountMap: Record<string, number> = {};
    const firstMsgMap: Record<string, string> = {};
    for (const m of messages) {
      msgCountMap[m.conversation_id] = (msgCountMap[m.conversation_id] || 0) + 1;
      if (m.role === 'user' && !firstMsgMap[m.conversation_id]) {
        firstMsgMap[m.conversation_id] = m.content;
      }
    }

    // Search filter (on first user message)
    let enriched = conversations.map((c) => ({
      ...c,
      message_count: msgCountMap[c.id] || 0,
      preview: firstMsgMap[c.id]?.slice(0, 100) || '',
    }));

    if (search) {
      const lowerSearch = search.toLowerCase();
      enriched = enriched.filter(
        (c) => c.preview.toLowerCase().includes(lowerSearch)
      );
    }

    return successResponse({
      conversations: enriched,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Conversations list error:', err);
    return errorResponse('Failed to fetch conversations', 500);
  }
}
