'use client';

interface Conversation {
  id: string;
  session_id: string | null;
  language: string;
  channel: string;
  created_at: string;
  message_count: number;
  preview: string;
}

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: Props) {
  if (conversations.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        No conversations found
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
            selectedId === conv.id ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-600' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChannelBadge channel={conv.channel} />
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {conv.language.toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(conv.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-gray-700 dark:text-gray-300">
            {conv.preview || 'No messages'}
          </p>
          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {conv.message_count} messages
          </div>
        </button>
      ))}
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const colors: Record<string, string> = {
    web: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    telegram: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    kakao: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    api: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors[channel] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
      {channel}
    </span>
  );
}
