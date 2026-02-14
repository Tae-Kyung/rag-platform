import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/owner/bots/[botId]/stats?period=7d|30d|90d
 * Returns analytics data for the bot.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    await requireOwner(botId);

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';

    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    const supabase = createServiceRoleClient();

    // Fetch all data in parallel
    const [
      conversationsResult,
      messagesResult,
      feedbackResult,
    ] = await Promise.all([
      // Conversations for this bot in period
      supabase
        .from('conversations')
        .select('id, channel, language, created_at')
        .eq('bot_id', botId)
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: true }),

      // Messages for this bot's conversations in period
      supabase
        .from('messages')
        .select('id, conversation_id, role, content, tokens_used, created_at')
        .in(
          'conversation_id',
          // Sub-select conversation IDs
          (await supabase
            .from('conversations')
            .select('id')
            .eq('bot_id', botId)
            .gte('created_at', sinceISO)
          ).data?.map((c) => c.id) ?? []
        )
        .order('created_at', { ascending: true }),

      // Feedback for this bot's messages
      supabase
        .from('feedback')
        .select('id, rating, created_at, message_id')
        .in(
          'message_id',
          (await supabase
            .from('messages')
            .select('id, conversation_id')
            .in(
              'conversation_id',
              (await supabase
                .from('conversations')
                .select('id')
                .eq('bot_id', botId)
              ).data?.map((c) => c.id) ?? []
            )
          ).data?.map((m) => m.id) ?? []
        )
        .gte('created_at', sinceISO),
    ]);

    const conversations = conversationsResult.data ?? [];
    const messages = messagesResult.data ?? [];
    const feedbacks = feedbackResult.data ?? [];

    // --- Daily conversation counts ---
    const dailyCounts: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      dailyCounts[d.toISOString().slice(0, 10)] = 0;
    }
    for (const c of conversations) {
      const day = c.created_at.slice(0, 10);
      if (dailyCounts[day] !== undefined) {
        dailyCounts[day]++;
      }
    }
    const dailyConversations = Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    }));

    // --- Channel distribution ---
    const channelMap: Record<string, number> = {};
    for (const c of conversations) {
      channelMap[c.channel] = (channelMap[c.channel] || 0) + 1;
    }
    const channelDistribution = Object.entries(channelMap).map(([channel, count]) => ({
      channel,
      count,
    }));

    // --- Language distribution ---
    const langMap: Record<string, number> = {};
    for (const c of conversations) {
      langMap[c.language] = (langMap[c.language] || 0) + 1;
    }
    const languageDistribution = Object.entries(langMap).map(([language, count]) => ({
      language,
      count,
    }));

    // --- Feedback stats ---
    const totalFeedback = feedbacks.length;
    const avgRating =
      totalFeedback > 0
        ? feedbacks.reduce((sum, f) => sum + (f.rating ?? 0), 0) / totalFeedback
        : 0;
    const positive = feedbacks.filter((f) => (f.rating ?? 0) >= 4).length;
    const negative = feedbacks.filter((f) => (f.rating ?? 0) <= 2).length;

    // Daily feedback
    const dailyFeedback: Record<string, { total: number; sum: number }> = {};
    for (const f of feedbacks) {
      const day = f.created_at.slice(0, 10);
      if (!dailyFeedback[day]) dailyFeedback[day] = { total: 0, sum: 0 };
      dailyFeedback[day].total++;
      dailyFeedback[day].sum += f.rating ?? 0;
    }
    const feedbackTrend = Object.entries(dailyFeedback).map(([date, v]) => ({
      date,
      avg: Math.round((v.sum / v.total) * 10) / 10,
      count: v.total,
    }));

    // --- Top keywords (from user messages) ---
    const userMessages = messages.filter((m) => m.role === 'user');
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set([
      'the', 'is', 'a', 'an', 'and', 'or', 'to', 'in', 'of', 'for', 'it', 'on',
      'that', 'this', 'with', 'was', 'are', 'be', 'has', 'have', 'had', 'not',
      'what', 'how', 'can', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'i', 'you', 'we', 'they', 'he', 'she', 'my', 'your', 'me',
      'about', 'from', 'but', 'if', 'so', 'at', 'by', 'up', 'out', 'no', 'yes',
      '은', '는', '이', '가', '을', '를', '의', '에', '로', '도', '만', '와', '과',
      '그', '저', '수', '것', '등', '및', '더', '한', '하는', '있는', '없는',
    ]);

    for (const m of userMessages) {
      const words = m.content
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !stopWords.has(w));
      for (const word of words) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }

    const topKeywords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // --- Summary ---
    const totalConversations = conversations.length;
    const totalMessages = messages.length;
    const totalTokens = messages.reduce((sum, m) => sum + (m.tokens_used ?? 0), 0);

    return successResponse({
      period,
      summary: {
        totalConversations,
        totalMessages,
        totalTokens,
        avgRating: Math.round(avgRating * 10) / 10,
        totalFeedback,
        positiveFeedback: positive,
        negativeFeedback: negative,
      },
      dailyConversations,
      channelDistribution,
      languageDistribution,
      feedbackTrend,
      topKeywords,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error('Stats API error:', err);
    return errorResponse('Failed to fetch stats', 500);
  }
}
