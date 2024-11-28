import { Message } from "ai";
import { cn } from "@/lib/utils";
import { Avatar } from "../ui/avatar";
import { Bot, User, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from "react";
import BookReviewCard from "./BookReviewCard";
import { Book } from "@/lib/validators/book-data";

// Loading message skeleton
const MessageSkeleton = () => (
  <div className="flex items-start gap-4 w-full">
    <Avatar className="h-8 w-8 flex-shrink-0">
      <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center rounded-full">
        <Bot className="h-4 w-4" />
      </div>
    </Avatar>
    <div className="flex-1 space-y-2 overflow-hidden">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-2/3 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
      </div>
    </div>
  </div>
);

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

interface ProcessedContent {
  books: Book[] | null;
  content: string | null;
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const [processedContent, setProcessedContent] = useState<ProcessedContent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!message.content) return;

    // Skip processing if the content looks like incomplete JSON
    if (message.content.trim().startsWith('{') && !message.content.includes('</book-data>')) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Check if message is an error message
      const isErrorMessage = message.content.toLowerCase().includes('error') || 
                           message.content.toLowerCase().includes('apologize');
      setIsError(isErrorMessage);

      const result = processMessageContent(message.content);
      setProcessedContent(result);
    } catch (error) {
      console.error('Error processing message:', error);
      setIsError(true);
    } finally {
      setIsProcessing(false);
    }
  }, [message.content]);

  // Show loading skeleton while processing
  if (isLoading || isProcessing) {
    return <MessageSkeleton />;
  }

  // Don't render incomplete messages
  if (message.role === 'assistant' && message.content.trim().startsWith('{')) {
    return null;
  }

  return (
    <div className={cn(
      "group relative flex items-start gap-4 pb-4",
      message.role === "user" ? "justify-end" : "justify-start"
    )}>
      {message.role !== "user" && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <div className={cn(
            "flex h-full w-full items-center justify-center rounded-full",
            isError ? "bg-destructive" : "bg-primary",
            isError ? "text-destructive-foreground" : "text-primary-foreground"
          )}>
            {isError ? <AlertTriangle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col gap-2 rounded-lg px-4 py-3 max-w-[85%]",
        message.role === "user" 
          ? "bg-primary text-primary-foreground" 
          : isError
            ? "bg-destructive/10 text-foreground border border-destructive/20"
            : "bg-muted/50 backdrop-blur"
      )}>
        {message.role === "user" ? (
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        ) : processedContent ? (
          <div className="space-y-4">
            {/* Book Review Cards */}
            {processedContent.books?.map((book, index) => (
              <BookReviewCard key={index} {...book} />
            ))}
            
            {/* Message Content */}
            {processedContent.content && (
              <div 
                className={cn(
                  "text-sm leading-relaxed text-foreground space-y-2",
                  "prose-headings:font-semibold prose-headings:text-base",
                  "prose-p:my-2 prose-p:leading-relaxed",
                  "prose-strong:font-semibold prose-strong:text-foreground/90",
                  "prose-code:text-sm prose-code:font-mono prose-code:text-muted-foreground",
                  "prose-blockquote:border-l-2 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic",
                  "prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4",
                  "prose-li:my-1",
                  isError && "text-destructive prose-headings:text-destructive prose-strong:text-destructive/90"
                )}
                dangerouslySetInnerHTML={{ 
                  __html: processedContent.content 
                }}
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

function processMessageContent(content: string): ProcessedContent {
  // Extract book data
  const bookMatch = content.match(/<book-data>([\s\S]*?)<\/book-data>/g);
  let books = null;
  let cleanContent = content;

  if (bookMatch) {
    try {
      books = bookMatch.map(match => {
        const bookData = JSON.parse(match.replace(/<\/?book-data>/g, ''));
        return bookData.books?.[0] || bookData;
      });
      // Remove book data tags from content
      cleanContent = content.replace(/<book-data>[\s\S]*?<\/book-data>/g, '').trim();
    } catch (error) {
      console.error('Error parsing book data:', error);
    }
  }

  // Format the remaining content with Markdown and other styling
  cleanContent = cleanContent
    // Handle markdown links
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" class="text-primary hover:underline">$1</a>')
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italics
    .replace(/\_(.*?)\_/g, '<em>$1</em>')
    // Bullet points
    .replace(/^\s*-\s(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Headers
    .replace(/^###\s(.+)$/gm, '<h3 class="text-base font-semibold">$1</h3>')
    .replace(/^##\s(.+)$/gm, '<h2 class="text-lg font-semibold">$1</h2>')
    .replace(/^#\s(.+)$/gm, '<h1 class="text-xl font-semibold">$1</h1>')
    // Improve blockquote formatting
    .replace(/^>\s*\*\*([^*]+)\*\*/gm, '<blockquote class="not-italic border-l-2 border-primary/50 pl-4 py-1"><strong>$1</strong>')
    .replace(/^>\s*(.*?)$/gm, '<blockquote class="not-italic border-l-2 border-primary/50 pl-4 py-1">$1</blockquote>')
    // Split paragraphs and wrap non-special content in <p> tags
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p)
    .map(p => {
      if (p.startsWith('<')) return p;
      return `<p>${p}</p>`;
    })
    .join('\n');

  return {
    books,
    content: cleanContent
  };
}

export default ChatMessage;