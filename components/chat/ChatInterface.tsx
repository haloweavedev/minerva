import { useRef, useEffect, useState } from 'react';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';
import { Message } from 'ai';
import { ChangeEvent } from 'react';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
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

  // Filter out incomplete book-data JSON responses but keep user messages
  const displayMessages = messages.reduce((acc: Message[], curr) => {
    if (curr.role === 'user' || (
      curr.role === 'assistant' && 
      (!curr.content.trim().startsWith('{') || curr.content.includes('</book-data>'))
    )) {
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
    <Card className="flex flex-col h-[85vh] w-full max-w-4xl mx-auto shadow-lg relative bg-card/50 backdrop-blur">
      {/* Header */}
      <CardHeader className="border-b bg-primary/5 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardTitle className="flex items-center gap-2 text-2xl font-serif">
          <Sparkles className="h-6 w-6 text-primary" />
          <span>Romance Book Assistant</span>
        </CardTitle>
      </CardHeader>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 text-sm">
          {error.message}
        </div>
      )}
      
      {/* Messages Area */}
      <CardContent className="flex-1 overflow-hidden p-4 space-y-4">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          {displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <p className="text-lg font-medium font-serif">
                Welcome to All About Romance!
              </p>
              <p className="text-sm text-muted-foreground">
                Ask me about romance books, reviews, or get personalized recommendations.
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
            className="absolute bottom-24 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors text-sm"
          >
            ↓ New messages
          </button>
        )}
      </CardContent>

      {/* Input Area */}
      <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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