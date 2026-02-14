export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number;
          max_bots: number;
          max_documents: number;
          max_messages_per_month: number;
          max_storage_mb: number;
          features: Json;
          paddle_price_id_monthly: string | null;
          paddle_price_id_yearly: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number;
          max_bots?: number;
          max_documents?: number;
          max_messages_per_month?: number;
          max_storage_mb?: number;
          features?: Json;
          paddle_price_id_monthly?: string | null;
          paddle_price_id_yearly?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number;
          max_bots?: number;
          max_documents?: number;
          max_messages_per_month?: number;
          max_storage_mb?: number;
          features?: Json;
          paddle_price_id_monthly?: string | null;
          paddle_price_id_yearly?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: string;
          paddle_subscription_id: string | null;
          paddle_customer_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          status?: string;
          paddle_subscription_id?: string | null;
          paddle_customer_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          status?: string;
          paddle_subscription_id?: string | null;
          paddle_customer_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_records: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          period_end: string;
          messages_used: number;
          documents_used: number;
          storage_used_mb: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_start: string;
          period_end: string;
          messages_used?: number;
          documents_used?: number;
          storage_used_mb?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_start?: string;
          period_end?: string;
          messages_used?: number;
          documents_used?: number;
          storage_used_mb?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          paddle_transaction_id: string | null;
          amount: number;
          currency: string;
          status: string;
          invoice_url: string | null;
          period_start: string | null;
          period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          paddle_transaction_id?: string | null;
          amount: number;
          currency?: string;
          status?: string;
          invoice_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          paddle_transaction_id?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          invoice_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bots: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          system_prompt: string | null;
          model: string;
          temperature: number;
          max_tokens: number;
          widget_config: Json;
          rag_config: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          system_prompt?: string | null;
          model?: string;
          temperature?: number;
          max_tokens?: number;
          widget_config?: Json;
          rag_config?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          system_prompt?: string | null;
          model?: string;
          temperature?: number;
          max_tokens?: number;
          widget_config?: Json;
          rag_config?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          bot_id: string;
          file_name: string;
          file_type: string;
          file_size: number | null;
          storage_path: string | null;
          source_url: string | null;
          status: string;
          chunk_count: number;
          error_message: string | null;
          language: string | null;
          doc_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          file_name: string;
          file_type: string;
          file_size?: number | null;
          storage_path?: string | null;
          source_url?: string | null;
          status?: string;
          chunk_count?: number;
          error_message?: string | null;
          language?: string | null;
          doc_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          file_name?: string;
          file_type?: string;
          file_size?: number | null;
          storage_path?: string | null;
          source_url?: string | null;
          status?: string;
          chunk_count?: number;
          error_message?: string | null;
          language?: string | null;
          doc_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          bot_id: string;
          content: string;
          metadata: Json;
          embedding: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          bot_id: string;
          content: string;
          metadata?: Json;
          embedding?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          bot_id?: string;
          content?: string;
          metadata?: Json;
          embedding?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      qa_pairs: {
        Row: {
          id: string;
          bot_id: string;
          question: string;
          answer: string;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          question: string;
          answer: string;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          question?: string;
          answer?: string;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          bot_id: string;
          session_id: string | null;
          language: string;
          channel: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          session_id?: string | null;
          language?: string;
          channel?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          session_id?: string | null;
          language?: string;
          channel?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          sources: Json | null;
          tokens_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          sources?: Json | null;
          tokens_used?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          sources?: Json | null;
          tokens_used?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          message_id: string;
          rating: number | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          rating?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          rating?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      channel_configs: {
        Row: {
          id: string;
          bot_id: string;
          channel: string;
          config: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bot_id: string;
          channel: string;
          config?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bot_id?: string;
          channel?: string;
          config?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          owner_id: string;
          member_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          member_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          member_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      system_logs: {
        Row: {
          id: string;
          level: string;
          source: string;
          message: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          level?: string;
          source: string;
          message: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          level?: string;
          source?: string;
          message?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      telegram_chat_mappings: {
        Row: {
          id: string;
          telegram_chat_id: number;
          bot_id: string;
          conversation_id: string;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          telegram_chat_id: number;
          bot_id: string;
          conversation_id: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          telegram_chat_id?: number;
          bot_id?: string;
          conversation_id?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_documents: {
        Args: {
          query_embedding: string;
          match_count?: number;
          filter_bot_id?: string;
          match_threshold?: number;
        };
        Returns: {
          id: string;
          content: string;
          metadata: Json;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
