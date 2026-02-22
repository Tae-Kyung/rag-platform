import { NextRequest } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';
import OpenAI from 'openai';

type RouteContext = { params: Promise<{ modelId: string }> };

/**
 * POST /api/sys/models/[modelId]/test — Test connection to a custom model
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { modelId } = await context.params;
    const supabase = createServiceRoleClient();
    const { data: model } = await supabase
      .from('custom_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (!model) {
      return errorResponse('Model not found', 404);
    }

    const apiKey = model.api_key_env
      ? (process.env[model.api_key_env] ?? '')
      : '';

    const client = new OpenAI({
      baseURL: model.base_url,
      apiKey: 'custom',
      defaultHeaders: {
        [model.api_key_header]: apiKey,
      },
    });

    const start = Date.now();
    const completion = await client.chat.completions.create({
      model: model.model_id,
      messages: [{ role: 'user', content: 'Hello, respond with "OK" only.' }],
      max_tokens: 10,
      temperature: 0,
    });
    const latency = Date.now() - start;

    const response = completion.choices[0]?.message?.content || '';

    return successResponse({
      status: 'connected',
      response: response.slice(0, 100),
      latency_ms: latency,
      model_id: model.model_id,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(`Connection failed: ${message}`, 502);
  }
}
