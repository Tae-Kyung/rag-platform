import { NextRequest } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * GET /api/sys/traffic?period=7d|30d|90d
 * System admin: daily message counts, top users, error counts.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const period = request.nextUrl.searchParams.get('period') || '7d';
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    const supabase = createServiceRoleClient();

    // Get user messages in period (exclude assistant responses to avoid double-counting)
    const { data: messages } = await supabase
      .from('messages')
      .select('id, role, created_at, conversation_id')
      .eq('role', 'user')
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: true });

    const allMessages = messages ?? [];

    // Daily message counts
    const dailyCounts: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      dailyCounts[d.toISOString().slice(0, 10)] = 0;
    }
    for (const m of allMessages) {
      const day = m.created_at.slice(0, 10);
      if (dailyCounts[day] !== undefined) dailyCounts[day]++;
    }
    const dailyMessages = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

    // Get conversations to map to bot owners
    const convIds = [...new Set(allMessages.map((m) => m.conversation_id))];
    const { data: conversations } = convIds.length > 0
      ? await supabase
          .from('conversations')
          .select('id, bot_id, channel')
          .in('id', convIds)
      : { data: [] };

    const convMap: Record<string, { bot_id: string; channel: string }> = {};
    for (const c of conversations ?? []) {
      convMap[c.id] = { bot_id: c.bot_id, channel: c.channel };
    }

    // Get bots to map to owners
    const botIds = [...new Set(Object.values(convMap).map((c) => c.bot_id))];
    const { data: bots } = botIds.length > 0
      ? await supabase.from('bots').select('id, user_id, name').in('id', botIds)
      : { data: [] };

    const botMap: Record<string, { user_id: string; name: string }> = {};
    for (const b of bots ?? []) {
      botMap[b.id] = { user_id: b.user_id, name: b.name };
    }

    // Top users by message count
    const userMsgCount: Record<string, { user_id: string; count: number }> = {};
    for (const m of allMessages) {
      const conv = convMap[m.conversation_id];
      if (!conv) continue;
      const bot = botMap[conv.bot_id];
      if (!bot) continue;
      if (!userMsgCount[bot.user_id]) {
        userMsgCount[bot.user_id] = { user_id: bot.user_id, count: 0 };
      }
      userMsgCount[bot.user_id].count++;
    }

    const topUserIds = Object.values(userMsgCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Fetch user emails
    const topIds = topUserIds.map((u) => u.user_id);
    const { data: topProfiles } = topIds.length > 0
      ? await supabase.from('profiles').select('id, email, full_name').in('id', topIds)
      : { data: [] };

    const profileMap: Record<string, { email: string; full_name: string | null }> = {};
    for (const p of topProfiles ?? []) {
      profileMap[p.id] = { email: p.email, full_name: p.full_name };
    }

    const topUsers = topUserIds.map((u) => ({
      user_id: u.user_id,
      email: profileMap[u.user_id]?.email ?? 'unknown',
      full_name: profileMap[u.user_id]?.full_name ?? null,
      message_count: u.count,
    }));

    // Channel distribution
    const channelCounts: Record<string, number> = {};
    for (const m of allMessages) {
      const conv = convMap[m.conversation_id];
      const ch = conv?.channel ?? 'unknown';
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
    }

    // Error count from system_logs
    const { count: errorCount } = await supabase
      .from('system_logs')
      .select('id', { count: 'exact', head: true })
      .eq('level', 'error')
      .gte('created_at', sinceISO);

    return successResponse({
      period,
      totalMessages: allMessages.length,
      dailyMessages,
      topUsers,
      channelDistribution: Object.entries(channelCounts).map(([channel, count]) => ({ channel, count })),
      errorCount: errorCount ?? 0,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    console.error('sys/traffic error:', err);
    return errorResponse('Failed to fetch traffic data', 500);
  }
}
