'use client';

import { useState, useEffect } from 'react';
import { type Message } from 'ai';
import { continueConversation } from './actions';
import { readStreamableValue } from 'ai/rsc';
import { Toaster, toast } from 'sonner';
import { ChatInterface } from '@/components/chat/ChatInterface';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true)
  }, [])

  // Example conversation starters
  const conversationStarters = [
    {
      text: "What did readers think about No Man's Land by Sally Malcolm?",
      action: () => handleStarterQuestion("What did readers think about No Man's Land by Sally Malcolm?")
    },
    {
      text: "Tell me about A Friend in the Glass by Gregory Ashe",
      action: () => handleStarterQuestion("Tell me about A Friend in the Glass by Gregory Ashe")
    },
    {
      text: "Can you recommend books similar to Murder in Highbury?",
      action: () => handleStarterQuestion("Can you recommend books similar to Murder in Highbury?")
    },
    {
      text: "What are the latest romance book reviews?",
      action: () => handleStarterQuestion("What are the latest romance book reviews?")
    }
  ];

  const handleStarterQuestion = (question: string) => {
    setInput(question);
    handleSend(question);
  };

  const handleSend = async (content: string) => {
    try {
      setIsLoading(true);
      const newUserMessage: Message = { role: 'user', content, id: Date.now().toString() };
      const newConversation = [...conversation, newUserMessage];

      const { messages, newMessage } = await continueConversation(newConversation);
      
      let textContent = '';
      for await (const delta of readStreamableValue(newMessage)) {
        textContent = `${textContent}${delta}`;
        setConversation([
          ...messages,
          { role: 'assistant', content: textContent, id: 'response-' + Date.now() }
        ]);
      }

      setInput('');
    } catch (error) {
      console.error('Error in chat:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <Toaster 
        position="top-center"
        richColors 
        closeButton
      />
      <div className="flex flex-col items-center w-full max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="w-full text-center py-4 mb-4">
          <h1 className="text-4xl font-serif mb-2 text-primary">Minerva</h1>
          <p className="text-lg text-muted-foreground">
            Your Romance Book Review Assistant
          </p>
        </div>

        {/* Main Chat Interface */}
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

        {/* Quick Start Section - Only show when no messages */}
        {conversation.length === 0 && (
          <div className="w-full max-w-4xl mx-auto p-4 rounded-lg bg-card/50 backdrop-blur">
            <h2 className="text-lg font-serif mb-2">Try asking about...</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {conversationStarters.map((starter, index) => (
                <button
                  key={index}
                  onClick={starter.action}
                  className="p-4 text-left rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  {starter.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Attribution */}
        <footer className="text-center text-sm text-muted-foreground mt-8">
          Powered by{' '}
          <a
            href="https://allaboutromance.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
          >
            All About Romance
          </a>
        </footer>
      </div>
    </>
  );
}