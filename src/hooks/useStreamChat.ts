import { useChatStore } from '@/features/chat/store';

/**
 * Shared SSE streaming logic for chat and widget pages.
 */
export function useStreamChat(botId: string) {
  const {
    isLoading,
    language,
    conversationId,
    addMessage,
    setLoading,
    setConversationId,
    updateLastAssistantMessage,
  } = useChatStore();

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    addMessage('user', content);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: botId,
          message: content,
          language,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || 'Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      addMessage('assistant', '');
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter((line) => line.startsWith('data:'));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(5).trim());

            if (data.type === 'meta') {
              setConversationId(data.conversationId);
            } else if (data.type === 'content') {
              fullContent += data.content;
              updateLastAssistantMessage(fullContent);
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      addMessage(
        'assistant',
        language === 'ko'
          ? `죄송합니다. 오류가 발생했습니다: ${errorMsg}`
          : `Sorry, an error occurred: ${errorMsg}`
      );
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage };
}
