'use client';

import { useState, useEffect } from 'react';
import { type Message } from 'ai';
import { continueConversation } from './actions';
import { readStreamableValue } from 'ai/rsc';
import { Toaster, toast } from 'sonner';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSend = async (content: string) => {
    try {
      setIsLoading(true);
      const newUserMessage: Message = { role: 'user', content, id: Date.now().toString() };
      const newConversation = [...conversation, newUserMessage];
      setConversation(newConversation);
      setInput('');

      const { messages, newMessage } = await continueConversation(newConversation);
      
      let textContent = '';
      for await (const delta of readStreamableValue(newMessage)) {
        textContent = `${textContent}${delta}`;
        setConversation([
          ...messages,
          { role: 'assistant', content: textContent, id: 'response-' + Date.now() }
        ]);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Toaster position="top-center" richColors closeButton />
      <ChatInterface 
        messages={conversation}
        input={input}
        handleInputChange={(e) => setInput(e.target.value)}
        handleSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || isLoading) return;
          handleSend(input.trim());
        }}
        isLoading={isLoading}
      />
    </div>
  );
}