import type { ReactNode } from 'react';

export const metadata = {
  title: 'Chat',
};

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-full">
      {children}
    </div>
  );
}
