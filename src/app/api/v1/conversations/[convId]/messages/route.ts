import { NextRequest } from 'next/server';
import { authenticateAPIKey, APIKeyError } from '@/lib/auth/api-key';
import { createServiceRoleClient } from '@/lib/supabase/service';

/**
 * GET /api/v1/conversations/[convId]/messages
 * Returns all messages in a conversation (public API).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ convId: string }> }
) {
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
    const { convId } = await params;
    const supabase = createServiceRoleClient();

    // Get conversation and verify ownership via bot
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, bot_id, language, channel, created_at')
      .eq('id', convId)
      .single();

    if (!conversation) {
      return Response.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify bot ownership
    const { data: bot } = await supabase
      .from('bots')
      .select('id')
      .eq('id', conversation.bot_id)
      .eq('user_id', auth.userId)
      .single();

    if (!bot) {
      return Response.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages
    const { data: messages } = await supabase
      .from('messages')
      .select('id, role, content, tokens_used, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    return Response.json({
      success: true,
      data: {
        conversation,
        messages: messages ?? [],
      },
    });
  } catch (err) {
    console.error('v1/messages error:', err);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
