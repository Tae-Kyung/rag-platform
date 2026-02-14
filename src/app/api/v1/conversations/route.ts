import { NextRequest } from 'next/server';
import { authenticateAPIKey, APIKeyError } from '@/lib/auth/api-key';
import { createServiceRoleClient } from '@/lib/supabase/service';

/**
 * GET /api/v1/conversations?bot_id=xxx&limit=20&offset=0
 * Returns paginated conversation list (public API).
 */
export async function GET(request: NextRequest) {
  let auth;
  try {
    auth = await authenticateAPIKey(request);
  } catch (err) {
    if (err instanceof APIKeyError) {
      return Response.json({ success: false, error: err.message }, { status: err.status });
    }
    return Response.json({ success: false, error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const botId = searchParams.get('bot_id');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));

    if (!botId) {
      return Response.json(
        { success: false, error: 'bot_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Verify bot ownership
    const { data: bot } = await supabase
      .from('bots')
      .select('id')
      .eq('id', botId)
      .eq('user_id', auth.userId)
      .single();

    if (!bot) {
      return Response.json(
        { success: false, error: 'Bot not found' },
        { status: 404 }
      );
    }

    const { data: conversations, count } = await supabase
      .from('conversations')
      .select('id, session_id, language, channel, created_at, updated_at', { count: 'exact' })
      .eq('bot_id', botId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return Response.json({
      success: true,
      data: {
        conversations: conversations ?? [],
        total: count ?? 0,
        limit,
        offset,
      },
    });
  } catch (err) {
    console.error('v1/conversations error:', err);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
