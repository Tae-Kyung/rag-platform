import { NextRequest } from 'next/server';
import { authenticateAPIKey, APIKeyError } from '@/lib/auth/api-key';
import { createServiceRoleClient } from '@/lib/supabase/service';

/**
 * GET /api/v1/bots/[botId]
 * Returns bot information (public API).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
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
    const { botId } = await params;
    const supabase = createServiceRoleClient();

    const { data: bot } = await supabase
      .from('bots')
      .select('id, name, description, is_active, model, created_at')
      .eq('id', botId)
      .eq('user_id', auth.userId)
      .single();

    if (!bot) {
      return Response.json(
        { success: false, error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Get document and conversation counts
    const [docCount, convCount] = await Promise.all([
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('bot_id', botId),
      supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('bot_id', botId),
    ]);

    return Response.json({
      success: true,
      data: {
        ...bot,
        document_count: docCount.count ?? 0,
        conversation_count: convCount.count ?? 0,
      },
    });
  } catch (err) {
    console.error('v1/bots error:', err);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
