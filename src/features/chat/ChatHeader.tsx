'use client';

interface ChatHeaderProps {
  botName: string;
  primaryColor: string;
  onNewChat: () => void;
}

export function ChatHeader({ botName, primaryColor, onNewChat }: ChatHeaderProps) {
  return (
    <header
      className="flex items-center justify-between border-b px-4 py-3"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold" style={{ color: primaryColor }}>
          {botName.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-base font-semibold text-white">
          {botName}
        </h1>
      </div>
      <button
        onClick={onNewChat}
        className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        title="New Chat"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </header>
  );
}
