import { requireAuth, AuthError } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { successResponse, errorResponse } from '@/lib/api/response';

const OPENAI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Affordable)', provider: 'OpenAI' },
  { value: 'gpt-4o', label: 'GPT-4o (Most Capable)', provider: 'OpenAI' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
];

/**
 * GET /api/owner/models — List available models for bot form
 * Returns OpenAI built-in models + active custom models
 */
export async function GET() {
  try {
    await requireAuth();

    const supabase = createServiceRoleClient();
    const { data: customModels } = await supabase
      .from('custom_models')
      .select('name, model_id, provider')
      .eq('is_active', true)
      .order('name');

    const custom = (customModels ?? []).map((m) => ({
      value: m.model_id,
      label: m.name,
      provider: m.provider,
    }));

    return successResponse({ models: [...OPENAI_MODELS, ...custom] });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse('Internal server error', 500);
  }
}
