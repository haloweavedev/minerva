// components/chat/ChatInterface.tsx
import { useRef, useEffect, useState } from 'react';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Sparkles } from 'lucide-react';
import { Message } from 'ai';
import { ChangeEvent } from 'react';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (event?: any) => void;
  isLoading: boolean;
  error?: Error;
}

export function ChatInterface({ 
  messages = [], 
  input, 
  handleInputChange, 
  handleSubmit, 
  isLoading, 
  error 
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Filter out incomplete responses but always show user messages
  const displayMessages = messages.reduce((acc: Message[], curr) => {
    if (curr.role === 'user' || (curr.role === 'assistant' && (!curr.content.trim().startsWith('{') || curr.content.includes('</book-data>')))) {
      return [...acc, curr];
    }
    return acc;
  }, []);

  // Handle scrolling
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: displayMessages.length <= 2 ? 'auto' : 'smooth'
      });
    }
  }, [displayMessages]);

  // Scroll to bottom handler
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  };

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-2xl mx-auto shadow-lg relative">
      {/* Header */}
      <CardHeader className="border-b bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="flex items-center space-x-2 font-serif">
          <Sparkles className="h-6 w-6" />
          <span>Minerva - AAR Assistant</span>
        </CardTitle>
      </CardHeader>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 text-sm">
          {error.message}
        </div>
      )}
      
      {/* Fixed Latest User Message */}
      {displayMessages.length > 0 && displayMessages[displayMessages.length - 1].role === 'user' && (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm max-w-[80%]">
              {displayMessages[displayMessages.length - 1].content}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          {displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <p className="text-lg font-medium font-serif">
                Welcome to All About Romance!
              </p>
              <p className="text-sm text-muted-foreground">
                Ask Minerva about romance books, authors, or specific tropes you're interested in.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayMessages.map((message, index) => (
                <ChatMessage
                  key={message.id || index}
                  message={message}
                  isLoading={isLoading && index === displayMessages.length - 1}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors text-sm"
          >
            ↓ New messages
          </button>
        )}
      </CardContent>

      {/* Input Area */}
      <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
}