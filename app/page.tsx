import { Suspense } from 'react';

// Loading component for Suspense fallback
function ChatLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="space-y-4 w-full max-w-2xl">
        <div className="h-8 bg-white/5 rounded animate-pulse" />
        <div className="h-8 bg-white/5 rounded animate-pulse w-3/4" />
      </div>
    </div>
  );
}

// Separate the client component
import dynamic from 'next/dynamic';
const ChatContainer = dynamic(() => import('@/components/ChatContainer'), {
  ssr: false,
  loading: () => <ChatLoading />
});

// Server Component
export default function Home() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContainer />
    </Suspense>
  );
}