import OpenAI from 'openai';
import { createServiceRoleClient } from '@/lib/supabase/service';

/**
 * Create a new OpenAI client instance.
 * Lazily initialized (function, not module-level const) to avoid build errors
 * when OPENAI_API_KEY is not available at import time.
 */
export function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// --- Custom model cache (5-min TTL) ---

interface CachedCustomModel {
  model_id: string;
  base_url: string;
  api_key_env: string;  // env var name, e.g. "EXAONE_API_KEY"
  api_key_header: string;
}

let cachedModels: CachedCustomModel[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCustomModels(): Promise<CachedCustomModel[]> {
  const now = Date.now();
  if (cachedModels && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedModels;
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('custom_models')
    .select('model_id, base_url, api_key_env, api_key_header')
    .eq('is_active', true);

  cachedModels = (data ?? []).map((m) => ({
    model_id: m.model_id,
    base_url: m.base_url,
    api_key_env: m.api_key_env,
    api_key_header: m.api_key_header,
  }));
  cacheTimestamp = now;

  return cachedModels;
}

/**
 * Get an OpenAI-compatible client for the given model.
 * If the model matches a custom model entry, returns a client
 * configured with the custom base URL and auth headers.
 *
 * API key resolution: DB api_key field stores an env var name (e.g. "EXAONE_API_KEY"),
 * and the actual key is read from process.env at runtime.
 */
/**
 * Check if a model is a custom (non-OpenAI) model.
 */
export async function isCustomModel(modelId: string): Promise<boolean> {
  const customModels = await getCustomModels();
  return customModels.some((m) => m.model_id === modelId);
}

export async function getLLMClient(modelId: string): Promise<OpenAI> {
  const customModels = await getCustomModels();
  const custom = customModels.find((m) => m.model_id === modelId);

  if (custom) {
    const apiKey = custom.api_key_env
      ? (process.env[custom.api_key_env] ?? '')
      : '';

    return new OpenAI({
      baseURL: custom.base_url,
      apiKey: 'custom',
      defaultHeaders: {
        [custom.api_key_header]: apiKey,
      },
    });
  }

  return getOpenAI();
}
