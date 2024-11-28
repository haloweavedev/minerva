'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type Message } from 'ai';
import { readStreamableValue } from 'ai/rsc';
import { Toaster, toast } from 'sonner';
import { continueConversation } from '@/app/actions';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Import the server action properly


const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MESSAGE_TIMEOUT = 30000; // 30 seconds
const MAX_CONVERSATION_LENGTH = 20;

interface ChatError extends Error {
  message: string;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortController = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize component
  useEffect(() => {
    setMounted(true);
    return () => {
      // Cleanup timeouts and abort controller on unmount
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortController.current) abortController.current.abort();
    };
  }, []);

  // Share conversation handler
  const handleShareConversation = useCallback(() => {
    const shareableMessages = conversation.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('messages', JSON.stringify(shareableMessages));
    
    navigator.clipboard.writeText(shareUrl.toString())
      .then(() => toast.success('Conversation link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy conversation link'));
  }, [conversation]);

  // Load shared conversation
  useEffect(() => {
    if (!mounted) return;

    const messagesParam = searchParams.get('messages');
    if (messagesParam) {
      try {
        const sharedMessages = JSON.parse(messagesParam) as Message[];
        setConversation(sharedMessages.map((msg, index) => ({
          ...msg,
          id: `shared-${index}`
        })));
      } catch (error) {
        console.error('Error loading shared conversation:', error);
        toast.error('Failed to load shared conversation');
      }
    }
  }, [mounted, searchParams]);

  // Handle message sending with retries and timeout
  const handleSend = async (content: string, retryCount = 0) => {
    try {
      setIsLoading(true);
      
      // Cancel any existing request
      if (abortController.current) {
        abortController.current.abort();
      }
      
      // Create new abort controller
      abortController.current = new AbortController();

      // Set timeout
      timeoutRef.current = setTimeout(() => {
        if (abortController.current) {
          abortController.current.abort();
          throw new Error('Response timeout');
        }
      }, MESSAGE_TIMEOUT);

      // Check conversation length
      if (conversation.length >= MAX_CONVERSATION_LENGTH) {
        toast.warning('Conversation limit reached. Starting new conversation.');
        setConversation([]);
      }

      // Create new message
      const newUserMessage: Message = { 
        role: 'user', 
        content, 
        id: Date.now().toString() 
      };

      const newConversation = [...conversation, newUserMessage];
      setConversation(newConversation);
      setInput('');

      // Get streaming response
      const { messages, newMessage } = await continueConversation(newConversation);
      
      let textContent = '';
      let lastUpdate = Date.now();

      for await (const delta of readStreamableValue(newMessage)) {
        // Update content and check timeout
        textContent = `${textContent}${delta}`;
        const currentTime = Date.now();
        
        if (currentTime - lastUpdate > 100) { // Update UI every 100ms
          setConversation([
            ...messages,
            { 
              role: 'assistant', 
              content: textContent, 
              id: 'response-' + Date.now() 
            }
          ]);
          lastUpdate = currentTime;
        }
      }

      // Final update
      setConversation([
        ...messages,
        { 
          role: 'assistant', 
          content: textContent, 
          id: 'response-' + Date.now() 
        }
      ]);

      // Reset retry count on success
      retryCountRef.current = 0;

    } catch (error) {
      console.error('Error in chat:', error);
      const chatError = error as ChatError;

      // Handle retries
      if (retryCount < MAX_RETRIES && chatError.message !== 'Aborted') {
        retryCountRef.current = retryCount + 1;
        toast.error(`Connection error. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        
        setTimeout(() => {
          handleSend(content, retryCount + 1);
        }, RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
        
        return;
      }

      // Show appropriate error message
      if (chatError.message === 'Response timeout') {
        toast.error('Response took too long. Please try again.');
      } else if (chatError.message === 'Aborted') {
        toast.info('Request cancelled.');
      } else {
        toast.error('Failed to get response. Please try again.');
      }

      // Remove failed message from conversation
      setConversation(prev => prev.slice(0, -1));

    } finally {
      setIsLoading(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      abortController.current = null;
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Toaster 
        position="top-center" 
        richColors 
        closeButton
        duration={3000}
      />
      
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