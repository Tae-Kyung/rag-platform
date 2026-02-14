'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useChatStore } from '@/features/chat/store';
import { ChatMessage } from '@/features/chat/ChatMessage';
import { ChatInput } from '@/features/chat/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useStreamChat } from '@/hooks/useStreamChat';
import type { WidgetConfig } from '@/types';

interface BotInfo {
  id: string;
  name: string;
  widget_config: WidgetConfig;
  is_active: boolean;
}

export default function WidgetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const botId = params.botId as string;
  const initialLang = searchParams.get('lang') || 'en';

  const [bot, setBot] = useState<BotInfo | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    language,
    addMessage,
    setLanguage,
  } = useChatStore();

  const { sendMessage } = useStreamChat(botId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    setLanguage(initialLang);
  }, [initialLang, setLanguage]);

  useEffect(() => {
    async function fetchBot() {
      const supabase = createClient();
      const { data } = await supabase
        .from('bots')
        .select('id, name, widget_config, is_active')
        .eq('id', botId)
        .single();

      if (data) {
        const widgetConfig = (data.widget_config || {}) as WidgetConfig;
        setBot({ ...data, widget_config: widgetConfig });
        const color = widgetConfig.primaryColor || '#0066CC';
        document.documentElement.style.setProperty('--color-primary', color);
      }
      setPageLoading(false);
    }
    fetchBot();
  }, [botId]);

  useEffect(() => {
    if (bot && messages.length === 0) {
      const greeting = bot.widget_config?.greeting
        || (language === 'ko'
          ? `${bot.name}에 오신 것을 환영합니다!`
          : `Welcome to ${bot.name}!`);
      addMessage('assistant', greeting);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot]);

  const primaryColor = bot?.widget_config?.primaryColor || '#0066CC';

  if (pageLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  if (!bot || !bot.is_active) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500 text-sm">
        {!bot ? 'Bot not found' : 'Bot is inactive'}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <div
        className="flex items-center gap-2 border-b px-4 py-2"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold" style={{ color: primaryColor }}>
          {bot.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-sm font-semibold text-white">
          {bot.widget_config?.headerTitle || bot.name}
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} primaryColor={primaryColor} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        onSend={sendMessage}
        disabled={isLoading}
        primaryColor={primaryColor}
        placeholder={bot.widget_config?.placeholder || undefined}
      />
    </div>
  );
}
