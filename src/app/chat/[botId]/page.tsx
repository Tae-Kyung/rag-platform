'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useChatStore } from '@/features/chat/store';
import { ChatHeader } from '@/features/chat/ChatHeader';
import { ChatMessage } from '@/features/chat/ChatMessage';
import { ChatInput } from '@/features/chat/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SuggestedQuestions } from '@/features/chat/SuggestedQuestions';
import { useStreamChat } from '@/hooks/useStreamChat';
import type { WidgetConfig } from '@/types';

interface BotInfo {
  id: string;
  name: string;
  description: string | null;
  suggested_questions: string[];
  widget_config: WidgetConfig;
  is_active: boolean;
}

export default function ChatPage() {
  const params = useParams();
  const botId = params.botId as string;
  const [bot, setBot] = useState<BotInfo | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    language,
    addMessage,
    resetChat,
  } = useChatStore();

  const { sendMessage } = useStreamChat(botId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Fetch bot data
  useEffect(() => {
    async function fetchBot() {
      const supabase = createClient();
      const { data } = await supabase
        .from('bots')
        .select('id, name, description, suggested_questions, widget_config, is_active')
        .eq('id', botId)
        .single();

      if (data) {
        const widgetConfig = (data.widget_config || {}) as WidgetConfig;
        const suggestedQuestions = (Array.isArray(data.suggested_questions) ? data.suggested_questions : []) as string[];
        setBot({ ...data, widget_config: widgetConfig, suggested_questions: suggestedQuestions });
        // Apply theme color
        const color = widgetConfig.primaryColor || '#0066CC';
        document.documentElement.style.setProperty('--color-primary', color);
      }
      setPageLoading(false);
    }
    fetchBot();
  }, [botId]);

  // Add welcome message on mount
  useEffect(() => {
    if (bot && messages.length === 0) {
      const greeting = bot.widget_config?.greeting
        || (language === 'ko'
          ? `${bot.name}에 오신 것을 환영합니다! 무엇을 도와드릴까요?`
          : `Welcome to ${bot.name}! How can I help you?`);
      addMessage('assistant', greeting);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot]);

  const handleFeedback = async (messageId: string, rating: number) => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating }),
      });
    } catch {
      // Silently fail for feedback
    }
  };

  const handleNewChat = () => {
    resetChat();
    setShowSuggestions(true);
    if (bot) {
      const greeting = bot.widget_config?.greeting
        || (language === 'ko'
          ? `${bot.name}에 오신 것을 환영합니다! 무엇을 도와드릴까요?`
          : `Welcome to ${bot.name}! How can I help you?`);
      addMessage('assistant', greeting);
    }
  };

  const handleSendMessage = (msg: string) => {
    setShowSuggestions(false);
    sendMessage(msg);
  };

  const primaryColor = bot?.widget_config?.primaryColor || '#0066CC';

  if (pageLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-600">Bot not found</p>
        <a href="/" className="text-blue-600 underline">
          Go back
        </a>
      </div>
    );
  }

  if (!bot.is_active) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-600">This bot is currently inactive.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <ChatHeader
        botName={bot.name}
        primaryColor={primaryColor}
        onNewChat={handleNewChat}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            primaryColor={primaryColor}
            onFeedback={msg.role === 'assistant' ? handleFeedback : undefined}
          />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {showSuggestions && bot.suggested_questions.length > 0 && messages.length <= 1 && (
        <SuggestedQuestions
          questions={bot.suggested_questions}
          onSelect={handleSendMessage}
        />
      )}

      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
        primaryColor={primaryColor}
        placeholder={bot.widget_config?.placeholder || undefined}
      />

      <div className="border-t bg-gray-50 py-1.5 text-center">
        <span className="text-[10px] text-gray-400">
          Powered by <a href="/" className="underline hover:text-gray-600">AskDocs</a>
        </span>
      </div>
    </div>
  );
}
