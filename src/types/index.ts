export type PlanId = 'free' | 'starter' | 'pro' | 'enterprise';
export type UserRole = 'user' | 'admin';
export type BotChannel = 'web' | 'telegram' | 'kakao' | 'wechat' | 'api';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface WidgetConfig {
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  greeting?: string;
  placeholder?: string;
  logoUrl?: string;
  headerTitle?: string;
}

export interface RagConfig {
  topK?: number;
  threshold?: number;
  useHyde?: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface BotConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface ChunkMetadata {
  chunkIndex: number;
  startChar: number;
  endChar: number;
  file_name?: string;
  document_id?: string;
}
