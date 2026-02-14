'use client';

interface ChannelCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  isActive?: boolean;
  isLocked?: boolean;
  lockedMessage?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onToggle?: (active: boolean) => void;
  children?: React.ReactNode;
}

export function ChannelCard({
  name,
  description,
  icon,
  isConnected,
  isActive,
  isLocked,
  lockedMessage,
  onConnect,
  onDisconnect,
  onToggle,
  children,
}: ChannelCardProps) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        isLocked ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        {isConnected && !isLocked && (
          <div className="flex items-center gap-2">
            {onToggle && (
              <button
                onClick={() => onToggle(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  isActive ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        )}
      </div>

      {isLocked && lockedMessage && (
        <div className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
          {lockedMessage}
        </div>
      )}

      {!isLocked && (
        <div className="mt-4">
          {isConnected ? (
            <div>
              {children}
              {onDisconnect && (
                <button
                  onClick={onDisconnect}
                  className="mt-4 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Disconnect
                </button>
              )}
            </div>
          ) : (
            <div>
              {children}
              {onConnect && !children && (
                <button
                  onClick={onConnect}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Connect
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
