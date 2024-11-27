'use client'

import { useChat } from 'ai/react'
import { ChatInterface } from '@/components/chat/ChatInterface'

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    initialMessages: [],
    onError: (err) => {
      console.error('Chat error:', err);
    }
  });

  return (
    <main className="flex min-h-screen max-h-screen flex-col items-center justify-center p-24">
      <ChatInterface 
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
      />
    </main>
  );
}