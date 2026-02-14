import { NextRequest } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { checkBotLimit } from '@/lib/billing/plan-guard';
import { z } from 'zod';

const createBotSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  system_prompt: z.string().max(5000).optional(),
  model: z.string().default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.3),
  max_tokens: z.number().min(100).max(4000).default(1000),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Get user's bots with document and conversation counts
    const { data: bots, error } = await supabase
      .from('bots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse('Failed to fetch bots', 500);
    }

    // Get counts for each bot
    const botsWithCounts = await Promise.all(
      (bots || []).map(async (bot) => {
        const [docResult, convResult] = await Promise.all([
          supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('bot_id', bot.id),
          supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('bot_id', bot.id),
        ]);
        return {
          ...bot,
          document_count: docResult.count ?? 0,
          conversation_count: convResult.count ?? 0,
        };
      })
    );

    // Get plan limits
    let maxBots = 1;
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subscription) {
      const { data: plan } = await supabase
        .from('plans')
        .select('max_bots')
        .eq('id', subscription.plan_id)
        .single();
      if (plan) maxBots = plan.max_bots;
    }

    return successResponse({
      bots: botsWithCounts,
      max_bots: maxBots,
      current_count: botsWithCounts.length,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const parsed = createBotSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message);
    }

    // Check plan bot limit
    const botCheck = await checkBotLimit(user.id);
    if (!botCheck.allowed) {
      return errorResponse(
        `Bot limit reached (${botCheck.max}). Upgrade your plan to create more bots.`,
        403
      );
    }

    const { data: bot, error } = await supabase
      .from('bots')
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        system_prompt: parsed.data.system_prompt || null,
        model: parsed.data.model,
        temperature: parsed.data.temperature,
        max_tokens: parsed.data.max_tokens,
      })
      .select()
      .single();

    if (error) {
      return errorResponse(`Failed to create bot: ${error.message}`, 500);
    }

    return successResponse(bot, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
