'use client';

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { Avatar } from "../ui/avatar";
import { Bot, User } from 'lucide-react';
import { useEffect, useState, memo } from "react";
import BookReviewCard from "./BookReviewCard";
import { Book } from "@/lib/validators/book-data";

interface ProcessedContent {
  books: Book[];
  content: string;
  error?: string;
}

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

const ResponseStartMarker = '---RESPONSE-START---';

const ChatMessage = memo(({ message, isLoading }: ChatMessageProps) => {
  const [processedContent, setProcessedContent] = useState<ProcessedContent | null>(null);

  useEffect(() => {
    if (!message.content) return;
    
    try {
      // Clean the content before processing
      const cleanedContent = cleanResponseContent(message.content);
      const result = processMessageContent(cleanedContent);
      setProcessedContent(result);
    } catch (error) {
      console.error('Error processing message:', error);
      setProcessedContent({
        books: [],
        content: message.content,
        error: 'Failed to process message content'
      });
    }
  }, [message.content]);

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 w-full",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex gap-4 items-start",
        message.role === "user" ? "ml-auto flex-row-reverse" : "flex-row"
      )}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <div className={cn(
            "flex h-full w-full items-center justify-center rounded-full",
            message.role === "user" ? "bg-white/10" : "bg-[#7f85c2] text-white"
          )}>
            {message.role === "user" ? (
              <User className="h-4 w-4 text-white" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
        </Avatar>

        <div className={cn(
          "flex flex-col gap-4 rounded-lg px-4 py-3",
          message.role === "user"
            ? "bg-[#7f85c2] text-white self-end w-fit max-w-[85%]"
            : "bg-white/5 backdrop-blur text-white min-w-[200px] max-w-[85%]"
        )}>
          {message.role === "user" ? (
            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : processedContent && (
            <div className="space-y-6">
              {/* Book Cards Section */}
              <div className="space-y-4">
                {processedContent.books?.map((book, index) => (
                  <div key={`${book.title}-${book.author}-${index}`}>
                    <BookReviewCard {...book} />
                  </div>
                ))}
              </div>

              {/* Text Content Section */}
              {processedContent.content && (
                <div className="prose prose-invert max-w-none">
                  <div 
                    className="text-base space-y-4"
                    dangerouslySetInnerHTML={{ 
                      __html: processHTMLContent(processedContent.content)
                    }}
                  />
                </div>
              )}

              {/* Error Message */}
              {processedContent.error && (
                <div className="text-red-400 text-sm italic bg-red-500/10 px-4 py-2 rounded-md">
                  {processedContent.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = "ChatMessage";

function cleanResponseContent(content: string): string {
  // Find the marker position
  const markerIndex = content.indexOf(ResponseStartMarker);
  
  if (markerIndex === -1) {
    return content; // Return original if marker not found
  }

  // Get content after the marker
  const cleanedContent = content
    .substring(markerIndex + ResponseStartMarker.length)
    .trim();

  return cleanedContent;
}

function processMessageContent(content: string): ProcessedContent {
  const result: ProcessedContent = {
    books: [],
    content: ''
  };

  try {
    // Extract book data with improved regex
    const bookDataRegex = /<book-data>\s*({[\s\S]*?})\s*<\/book-data>/g;
    let processedContent = content;
    let match;

    while ((match = bookDataRegex.exec(content)) !== null) {
      try {
        const jsonStr = match[1]
          .replace(/\{\{(\{+)?/g, '{')
          .replace(/\}\}(\}+)?/g, '}')
          .trim();
        
        const bookData = JSON.parse(jsonStr);

        if (bookData.books && Array.isArray(bookData.books)) {
          const validBooks = bookData.books
            .map((book: any) => ({
              title: book.title?.trim() || '',
              author: book.author?.trim() || '',
              grade: book.grade?.trim() || '',
              sensuality: book.sensuality?.trim() || '',
              bookTypes: Array.isArray(book.bookTypes)
                ? book.bookTypes.map((t: string) => t.trim())
                : typeof book.bookTypes === 'string'
                ? [book.bookTypes.trim()]
                : [],
              asin: book.asin?.trim() || '',
              reviewUrl: book.reviewUrl?.trim() || '',
              postId: book.postId?.trim() || '',
              featuredImage: book.featuredImage?.trim() || ''
            }))
            .filter((book: { title: string, author: string }) => book.title && book.author);

          result.books.push(...validBooks);
        }

        processedContent = processedContent.replace(match[0], '');
      } catch (error) {
        console.error('Error parsing book data:', error);
      }
    }

    // Clean content
    result.content = processedContent
      .replace(/^\s*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
  } catch (error) {
    console.error('Error processing message content:', error);
    result.error = 'Failed to process message content';
  }

  return result;
}

function processHTMLContent(content: string): string {
  return content
    // Headers with proper hierarchy
    .replace(
      /^###\s(.+)$/gm, 
      '<h3 class="text-lg font-serif font-medium text-white/90 mt-6 mb-3">$1</h3>'
    )
    .replace(
      /^##\s(.+)$/gm, 
      '<h2 class="text-xl font-serif font-medium text-white mt-6 mb-3">$1</h2>'
    )
    .replace(
      /^#\s(.+)$/gm, 
      '<h1 class="text-2xl font-serif font-medium text-white mt-6 mb-4 leading-tight">$1</h1>'
    )
    // Lists with custom bullets
    .replace(
      /^[•\*]\s(.+)$/gm, 
      '<li class="flex items-start gap-3 text-white/90"><span class="text-[#7f85c2] mt-1">•</span><span>$1</span></li>'
    )
    .replace(
      /(<li>.*<\/li>\n?)+/g, 
      '<ul class="space-y-2 my-3 list-none">$&</ul>'
    )
    // Text formatting
    .replace(
      /\*\*([^*]+)\*\*/g, 
      '<strong class="text-white font-medium">$1</strong>'
    )
    .replace(
      /\*([^*]+)\*/g, 
      '<span class="text-white/90">$1</span>'
    )
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#7f85c2] hover:text-[#9da3d4] hover:underline transition-colors">$1</a>'
    )
    // Blockquotes
    .replace(
      /^\>\s*(.+)$/gm, 
      '<blockquote class="border-l-2 border-[#7f85c2] pl-4 py-2 my-4 text-white/90 italic bg-white/5 rounded-r">$1</blockquote>'
    )
    // Normalize paragraphs
    .replace(/\n{3,}/g, '\n\n')
    .split('\n\n')
    .map(p => {
      if (!p.trim()) return '';
      if (p.startsWith('<')) return p;
      return `<p class="text-white/90 leading-relaxed mb-3">${p.trim()}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

export default ChatMessage;