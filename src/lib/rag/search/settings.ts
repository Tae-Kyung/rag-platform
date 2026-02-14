import { createServiceRoleClient } from '@/lib/supabase/service';
import { RAG_SETTINGS_CACHE_TTL_MS } from '@/config/constants';
import type { RagConfig } from '@/types';

export interface RagSettingsValues {
  embedding_model: string;
  top_k: number;
  match_threshold: number;
  rerank_enabled: boolean;
  hyde_enabled: boolean;
}

interface RagSettingsCache {
  settings: RagSettingsValues;
  timestamp: number;
}

const DEFAULT_RAG_SETTINGS: RagSettingsValues = {
  embedding_model: 'text-embedding-3-small',
  top_k: 8,
  match_threshold: 0.15,
  rerank_enabled: false,
  hyde_enabled: false,
};

const CACHE_TTL_MS = RAG_SETTINGS_CACHE_TTL_MS;
const settingsCache = new Map<string, RagSettingsCache>();

/**
 * Get RAG settings for a bot from bots.rag_config JSONB column.
 * Cached for 60 seconds per bot.
 */
export async function getRagSettings(botId: string): Promise<RagSettingsValues> {
  const cached = settingsCache.get(botId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.settings;
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('bots')
      .select('rag_config')
      .eq('id', botId)
      .single();

    if (error || !data) {
      console.log(`[Search] No bot found for ${botId}, using defaults`);
      settingsCache.set(botId, {
        settings: DEFAULT_RAG_SETTINGS,
        timestamp: Date.now(),
      });
      return DEFAULT_RAG_SETTINGS;
    }

    const ragConfig = (data.rag_config || {}) as RagConfig;

    const settings: RagSettingsValues = {
      embedding_model: DEFAULT_RAG_SETTINGS.embedding_model,
      top_k: ragConfig.topK ?? DEFAULT_RAG_SETTINGS.top_k,
      match_threshold: ragConfig.threshold ?? DEFAULT_RAG_SETTINGS.match_threshold,
      rerank_enabled: DEFAULT_RAG_SETTINGS.rerank_enabled,
      hyde_enabled: ragConfig.useHyde ?? DEFAULT_RAG_SETTINGS.hyde_enabled,
    };

    settingsCache.set(botId, { settings, timestamp: Date.now() });
    return settings;
  } catch (error) {
    console.error('[Search] Failed to load rag settings:', error);
    return DEFAULT_RAG_SETTINGS;
  }
}
