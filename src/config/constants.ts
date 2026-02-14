import type { PlanId } from '@/types';

// --- Language ---

export const SUPPORTED_LANGUAGES: {
  code: string;
  label: string;
  nativeLabel: string;
}[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
];

export const LOCALE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);
export const DEFAULT_LANGUAGE = 'en';

// --- Chat / LLM ---

export const MAX_MESSAGE_LENGTH = 1000;
export const CONVERSATION_HISTORY_LIMIT = 6;
export const LLM_MODEL = 'gpt-4o-mini';
export const LLM_TEMPERATURE = 0.3;
export const LLM_MAX_TOKENS_CHAT = 1000;

// --- RAG Pipeline ---

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const CHUNK_SIZE = 500;
export const CHUNK_OVERLAP = 50;
export const TOP_K_RESULTS = 5;
export const EMBEDDING_BATCH_SIZE = 100;
export const EMBEDDING_MAX_INPUT_LENGTH = 8000;
export const AI_RESTRUCTURE_MAX_SEGMENT = 12_000;
export const PIPELINE_INSERT_BATCH_SIZE = 50;
export const MAX_TABLES_TO_PROCESS = 10;
export const VISION_MAX_TEXT_LENGTH = 30_000;

// --- RAG Search ---

export const RAG_SETTINGS_CACHE_TTL_MS = 60_000;
export const EXCERPT_THRESHOLD = 800;
export const EXCERPT_CONTEXT_CHARS = 80;

// --- Crawl ---

export const CRAWL_TIMEOUT_MS = 15_000;

// --- Admin ---

export const ADMIN_POLLING_INTERVAL_MS = 5_000;

// --- Plan Limits (client-side reference, source of truth is DB) ---

export const PLAN_LIMITS: Record<
  PlanId,
  {
    maxBots: number;
    maxDocuments: number;
    maxMessagesPerMonth: number;
    maxStorageMb: number;
  }
> = {
  free: {
    maxBots: 1,
    maxDocuments: 10,
    maxMessagesPerMonth: 100,
    maxStorageMb: 100,
  },
  starter: {
    maxBots: 3,
    maxDocuments: 50,
    maxMessagesPerMonth: 1000,
    maxStorageMb: 500,
  },
  pro: {
    maxBots: 10,
    maxDocuments: 200,
    maxMessagesPerMonth: 10000,
    maxStorageMb: 2000,
  },
  enterprise: {
    maxBots: -1,
    maxDocuments: -1,
    maxMessagesPerMonth: -1,
    maxStorageMb: -1,
  },
};

// --- Rate Limits (req/min per plan) ---

export const RATE_LIMITS: Record<PlanId, number> = {
  free: 10,
  starter: 30,
  pro: 100,
  enterprise: 500,
};

// --- Usage Alert Thresholds ---

export const USAGE_ALERT_THRESHOLDS = [0.8, 1.0];
