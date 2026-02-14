import { requireOwner, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/owner/bots/[botId]/conversations/[convId]
 * Returns full conversation detail with all messages and feedback.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ botId: string; convId: string }> }
) {
  try {
    const { botId, convId } = await params;
    await requireOwner(botId);

    const supabase = createServiceRoleClient();

    // Get conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', convId)
      .eq('bot_id', botId)
      .single();

    if (!conversation) {
      return errorResponse('Conversation not found', 404);
    }

    // Get all messages
    const { data: messages } = await supabase
      .from('messages')
      .select('id, role, content, sources, tokens_used, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    // Get feedback for these messages
    const messageIds = (messages ?? []).map((m) => m.id);
    const { data: feedbacks } = messageIds.length > 0
      ? await supabase
          .from('feedback')
          .select('id, message_id, rating, comment, created_at')
          .in('message_id', messageIds)
      : { data: [] };

    // Attach feedback to messages
    const feedbackMap: Record<string, { rating: number | null; comment: string | null }> = {};
    for (const f of feedbacks ?? []) {
      feedbackMap[f.message_id] = { rating: f.rating, comment: f.comment };
    }

    const enrichedMessages = (messages ?? []).map((m) => ({
      ...m,
      feedback: feedbackMap[m.id] ?? null,
    }));

    return successResponse({
      conversation,
      messages: enrichedMessages,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Conversation detail error:', err);
    return errorResponse('Failed to fetch conversation', 500);
  }
}
