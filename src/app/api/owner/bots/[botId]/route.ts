import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateBotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  system_prompt: z.string().max(5000).optional().nullable(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(100).max(4000).optional(),
  conversation_history_limit: z.number().min(1).max(50).optional(),
  suggested_questions: z.array(z.string().min(1).max(200)).max(5).optional(),
  is_active: z.boolean().optional(),
  rag_config: z
    .object({
      topK: z.number().optional(),
      threshold: z.number().optional(),
      useHyde: z.boolean().optional(),
      chunkSize: z.number().optional(),
      chunkOverlap: z.number().optional(),
    })
    .optional(),
});

interface RouteParams {
  params: Promise<{ botId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { botId } = await params;
    await requireOwner(botId);
    const supabase = await createClient();

    const { data: bot, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (error || !bot) {
      return errorResponse('Bot not found', 404);
    }

    // Get counts
    const [docResult, convResult] = await Promise.all([
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('bot_id', botId),
      supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('bot_id', botId),
    ]);

    return successResponse({
      ...bot,
      document_count: docResult.count ?? 0,
      conversation_count: convResult.count ?? 0,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { botId } = await params;
    await requireOwner(botId);
    const supabase = await createClient();

    const body = await request.json();
    const parsed = updateBotSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message);
    }

    const updateData: Record<string, unknown> = {};
    const d = parsed.data;
    if (d.name !== undefined) updateData.name = d.name;
    if (d.description !== undefined) updateData.description = d.description;
    if (d.system_prompt !== undefined) updateData.system_prompt = d.system_prompt;
    if (d.model !== undefined) updateData.model = d.model;
    if (d.temperature !== undefined) updateData.temperature = d.temperature;
    if (d.max_tokens !== undefined) updateData.max_tokens = d.max_tokens;
    if (d.conversation_history_limit !== undefined) updateData.conversation_history_limit = d.conversation_history_limit;
    if (d.suggested_questions !== undefined) updateData.suggested_questions = d.suggested_questions;
    if (d.is_active !== undefined) updateData.is_active = d.is_active;
    if (d.rag_config !== undefined) updateData.rag_config = d.rag_config;

    const { data: bot, error } = await supabase
      .from('bots')
      .update(updateData)
      .eq('id', botId)
      .select()
      .single();

    if (error) {
      return errorResponse(`Failed to update bot: ${error.message}`, 500);
    }

    return successResponse(bot);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { botId } = await params;
    await requireOwner(botId);
    const supabase = await createClient();

    const { error } = await supabase
      .from('bots')
      .delete()
      .eq('id', botId);

    if (error) {
      return errorResponse(`Failed to delete bot: ${error.message}`, 500);
    }

    return successResponse({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
