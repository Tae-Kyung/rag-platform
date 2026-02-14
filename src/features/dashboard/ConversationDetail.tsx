'use client';

import { useEffect, useState } from 'react';

interface Message {
  id: string;
  role: string;
  content: string;
  sources: unknown;
  tokens_used: number | null;
  created_at: string;
  feedback: { rating: number | null; comment: string | null } | null;
}

interface ConversationData {
  conversation: {
    id: string;
    channel: string;
    language: string;
    created_at: string;
  };
  messages: Message[];
}

interface Props {
  botId: string;
  conversationId: string;
}

export function ConversationDetail({ botId, conversationId }: Props) {
  const [data, setData] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/owner/bots/${botId}/conversations/${conversationId}`
        );
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch conversation:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [botId, conversationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return <p className="py-8 text-center text-sm text-gray-400">Failed to load conversation</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-700">
            {data.conversation.channel.toUpperCase()}
          </span>
          <span>&middot;</span>
          <span>{data.conversation.language.toUpperCase()}</span>
          <span>&middot;</span>
          <span>{new Date(data.conversation.created_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3 p-4">
        {data.messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg p-3 ${
              msg.role === 'user'
                ? 'bg-blue-50 text-blue-900'
                : 'bg-gray-50 text-gray-800'
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-gray-400">
                {msg.role}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
            {msg.tokens_used && (
              <span className="mt-1 inline-block text-xs text-gray-400">
                {msg.tokens_used} tokens
              </span>
            )}
            {msg.feedback && (
              <div className="mt-2 flex items-center gap-2 border-t border-gray-200 pt-2">
                <span className="text-xs text-gray-500">Rating:</span>
                <span className="text-sm font-medium text-yellow-600">
                  {'★'.repeat(msg.feedback.rating ?? 0)}
                  {'☆'.repeat(5 - (msg.feedback.rating ?? 0))}
                </span>
                {msg.feedback.comment && (
                  <span className="text-xs text-gray-500 italic">
                    &quot;{msg.feedback.comment}&quot;
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
