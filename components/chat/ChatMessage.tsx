// components/chat/ChatMessage.tsx
import { Message } from "ai"
import { cn } from "@/lib/utils"
import { Avatar } from "../ui/avatar"
import { Bot, User } from 'lucide-react'
import { useEffect, useState } from "react"
import BookReviewCard from "./BookReviewCard"

const MessageSkeleton = () => (
  <div className="flex items-start gap-4">
    <Avatar className="h-8 w-8 flex-shrink-0">
      <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center rounded-full">
        <Bot className="h-4 w-4" />
      </div>
    </Avatar>
    
    <div className="flex-1 max-w-[80%] space-y-4">
      <div className="animate-pulse space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex gap-4">
            <div className="w-24 h-36 bg-secondary/40 rounded-md"></div>
            <div className="flex-1 space-y-4">
              <div className="h-6 bg-secondary/40 rounded w-3/4"></div>
              <div className="h-4 bg-secondary/40 rounded w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-secondary/40 rounded-full"></div>
                <div className="h-5 w-20 bg-secondary/40 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-secondary/40 rounded w-3/4"></div>
          <div className="h-4 bg-secondary/40 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  </div>
);

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const [processedContent, setProcessedContent] = useState<{
    books: any[] | null;
    content: string | null;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!message.content) return;

    // Skip processing if the content looks like incomplete JSON
    if (message.content.trim().startsWith('{') && !message.content.includes('</book-data>')) {
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = processMessageContent(message.content);
      setProcessedContent(result);
    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [message.content]);

  // Show loading skeleton only when explicitly loading or processing
  if (isLoading || isProcessing) {
    return <MessageSkeleton />;
  }

  // Don't render anything for incomplete JSON messages
  if (message.role === 'assistant' && message.content.trim().startsWith('{')) {
    return null;
  }

  return (
    <div className={cn(
      "group relative flex w-full items-start gap-4 py-2",
      message.role === "user" ? "justify-end" : "justify-start"
    )}>
      {message.role !== "user" && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center rounded-full">
            <Bot className="h-4 w-4" />
          </div>
        </Avatar>
      )}
      
      <div className={cn(
        "flex-1",
        message.role === "user" ? "max-w-[80%] flex justify-end" : "max-w-[80%]"
      )}>
        {message.role === "user" ? (
          <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm">
            {message.content}
          </div>
        ) : processedContent ? (
          <div className="space-y-4">
            {processedContent.books?.map((book, index) => (
              <BookReviewCard key={index} {...book} />
            ))}
            
            {processedContent.content && (
              <div 
                className="rounded-lg px-4 py-2 text-sm leading-relaxed bg-secondary/20 prose prose-sm max-w-none prose-blockquote:border-l-primary/40 prose-blockquote:bg-secondary/30 prose-blockquote:py-1 prose-blockquote:not-italic"
                dangerouslySetInnerHTML={{ __html: processedContent.content }}
              />
            )}
          </div>
        ) : null}
      </div>

      {message.role === "user" && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <div className="bg-muted flex h-full w-full items-center justify-center rounded-full">
            <User className="h-4 w-4" />
          </div>
        </Avatar>
      )}
    </div>
  );
}

function processMessageContent(content: string) {
  // Extract book data
  const bookMatch = content.match(/<book-data>([\s\S]*?)<\/book-data>/);
  let books = null;
  let cleanContent = content;
  
  if (bookMatch) {
    try {
      books = JSON.parse(bookMatch[1]).books;
      cleanContent = content.replace(/<book-data>[\s\S]*?<\/book-data>/, '').trim();
    } catch (error) {
      console.error('Error parsing book data:', error);
    }
  }

  // Format the remaining content
  cleanContent = cleanContent
    // Handle markdown links
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" class="text-primary hover:underline">$1</a>')
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italics
    .replace(/\_(.*?)\_/g, '<em>$1</em>')
    // Improve blockquote formatting
    .replace(/^>\s*\*\*([^*]+)\*\*/gm, '<blockquote class="not-italic"><strong>$1</strong>')
    .replace(/^>\s*(.*?)$/gm, '<blockquote class="not-italic">$1</blockquote>')
    // Split paragraphs
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p)
    .map(p => p.startsWith('<blockquote') ? p : `<p>${p}</p>`)
    .join('\n');

  return {
    books,
    content: cleanContent
  };
}

export default ChatMessage;