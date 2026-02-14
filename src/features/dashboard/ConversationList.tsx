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
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        No conversations found
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
            selectedId === conv.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChannelBadge channel={conv.channel} />
              <span className="text-xs text-gray-400">
                {conv.language.toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {new Date(conv.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-gray-700">
            {conv.preview || 'No messages'}
          </p>
          <div className="mt-1 text-xs text-gray-400">
            {conv.message_count} messages
          </div>
        </button>
      ))}
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const colors: Record<string, string> = {
    web: 'bg-blue-100 text-blue-700',
    telegram: 'bg-sky-100 text-sky-700',
    kakao: 'bg-yellow-100 text-yellow-700',
    api: 'bg-purple-100 text-purple-700',
  };

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors[channel] || 'bg-gray-100 text-gray-600'}`}>
      {channel}
    </span>
  );
}
