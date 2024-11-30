'use client';

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { Avatar } from "../ui/avatar";
import { Bot, User } from 'lucide-react';
import { useEffect, useState, memo } from "react";
import BookReviewCard from "./BookReviewCard";
import { Book } from "@/lib/validators/book-data";
import { motion, AnimatePresence } from 'framer-motion';

// Loading skeleton with improved animation
const MessageSkeleton = ({ isUser = false }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className={cn(
      "flex items-start gap-4 w-full",
      isUser ? "justify-end" : "justify-start"
    )}
  >
    {!isUser && (
      <Avatar className="h-8 w-8 flex-shrink-0">
        <div className="bg-[#7f85c2] text-white flex h-full w-full items-center justify-center rounded-full">
          <Bot className="h-4 w-4" />
        </div>
      </Avatar>
    )}
    <div className={cn(
      "space-y-3 rounded-lg px-4 py-3 max-w-[85%]",
      isUser ? "bg-[#7f85c2] text-white" : "bg-white/5 backdrop-blur shadow-lg"
    )}>
      <motion.div 
        animate={{ 
          opacity: [0.5, 1, 0.5],
          transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
        }}
        className="space-y-2"
      >
        <div className="h-4 w-2/3 bg-white/10 rounded-full animate-pulse" />
        <div className="h-4 w-1/2 bg-white/10 rounded-full animate-pulse" />
      </motion.div>
    </div>
    {isUser && (
      <Avatar className="h-8 w-8 flex-shrink-0">
        <div className="bg-white/10 flex h-full w-full items-center justify-center rounded-full">
          <User className="h-4 w-4 text-white" />
        </div>
      </Avatar>
    )}
  </motion.div>
);

interface ProcessedContent {
  books: Book[];
  content: string;
  error?: string;
}

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

const ChatMessage = memo(({ message, isLoading }: ChatMessageProps) => {
  const [processedContent, setProcessedContent] = useState<ProcessedContent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!message.content) return;
    
    setIsProcessing(true);
    try {
      const result = processMessageContent(message.content);
      setProcessedContent(result);
    } catch (error) {
      console.error('Error processing message:', error);
      setProcessedContent({
        books: [],
        content: message.content,
        error: 'Failed to process message content'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [message.content]);

  if (isLoading || isProcessing) {
    return <MessageSkeleton isUser={message.role === 'user'} />;
  }

  const messageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    },
    exit: { 
      opacity: 0,y: -20,
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message.id}
        variants={messageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="group relative flex items-start gap-4 w-full"
      >
        <div className={cn(
          "flex gap-4 items-start max-w-[85%] w-full",
          message.role === "user" ? "ml-auto" : ""
        )}>
          {message.role !== "user" && (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <div className="bg-[#7f85c2] text-white flex h-full w-full items-center justify-center rounded-full">
                <Bot className="h-4 w-4" />
              </div>
            </Avatar>
          )}
          
          <div className={cn(
            "flex flex-col gap-4 rounded-lg px-4 py-3 w-full",
            message.role === "user" 
              ? "bg-[#7f85c2] text-white ml-auto" 
              : "bg-white/5 backdrop-blur text-white shadow-lg"
          )}>
            {message.role === "user" ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-sm whitespace-pre-wrap break-words text-right"
              >
                {message.content}
              </motion.div>
            ) : processedContent ? (
              <div className="space-y-6">
                {/* Book Cards Section */}
                <AnimatePresence mode="wait">
                  {processedContent.books?.map((book, index) => (
                    <motion.div
                      key={`${book.title}-${book.author}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ 
                        duration: 0.5,
                        delay: index * 0.1,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      className="transform hover:scale-[1.01] transition-all duration-200"
                    >
                      <BookReviewCard {...book} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Text Content Section */}
                {processedContent.content && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.4,
                      delay: (processedContent.books?.length || 0) * 0.1 + 0.2
                    }}
                    className="prose prose-invert max-w-none"
                  >
                    <div 
                      className="text-base space-y-4"
                      dangerouslySetInnerHTML={{ 
                        __html: processHTMLContent(processedContent.content)
                      }}
                    />
                  </motion.div>
                )}

                {/* Error Message */}
                {processedContent.error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-sm italic bg-red-500/10 px-4 py-2 rounded-md"
                  >
                    {processedContent.error}
                  </motion.div>
                )}
              </div>
            ) : null}
          </div>

          {message.role === "user" && (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <div className="bg-white/10 flex h-full w-full items-center justify-center rounded-full">
                <User className="h-4 w-4 text-white" />
              </div>
            </Avatar>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

ChatMessage.displayName = "ChatMessage";

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

    // Process book data blocks
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
            .filter((book: any) => book.title && book.author);

          result.books.push(...validBooks);
        }

        // Remove processed block
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
    // Headers with improved hierarchy and spacing
    .replace(
      /^###\s(.+)$/gm, 
      '<h3 class="text-lg font-serif font-medium text-white/90 mt-6 mb-3">$1</h3>'
    )
    .replace(
      /^##\s(.+)$/gm, 
      '<h2 class="text-xl font-serif font-medium text-white mt-8 mb-4">$1</h2>'
    )
    .replace(
      /^#\s(.+)$/gm, 
      '<h1 class="text-2xl font-serif font-medium text-white mt-8 mb-4 leading-tight">$1</h1>'
    )
    
    // Lists with custom bullets and proper alignment
    .replace(
      /^[•\*]\s(.+)$/gm, 
      '<li class="flex items-start gap-3 text-white/90"><span class="text-[#7f85c2] mt-1">•</span><span>$1</span></li>'
    )
    .replace(
      /(<li>.*<\/li>\n?)+/g, 
      '<ul class="space-y-3 my-4 list-none">$&</ul>'
    )
    
    // Text formatting with improved contrast
    .replace(
      /\*\*([^*]+)\*\*/g, 
      '<strong class="text-white font-medium">$1</strong>'
    )
    .replace(
      /\*([^*]+)\*/g, 
      '<em class="text-white/90 italic">$1</em>'
    )
    
    // Links with enhanced hover effects
    .replace(
      /\[([^\]]+)\]$$([^)]+)$$/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#7f85c2] hover:text-[#9da3d4] hover:underline transition-colors duration-200">$1</a>'
    )
    
    // Blockquotes with better styling
    .replace(
      /^\>\s*(.+)$/gm, 
      '<blockquote class="border-l-2 border-[#7f85c2] pl-4 py-2 my-6 text-white/90 italic bg-white/5 rounded-r">$1</blockquote>'
    )
    
    // Clean up and normalize
    .replace(/\$+\d*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    
    // Paragraphs with improved readability
    .split('\n\n')
    .map(p => {
      if (!p.trim()) return '';
      if (p.startsWith('<')) return p;
      return `<p class="text-white/90 leading-relaxed mb-4">${p.trim()}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

export default ChatMessage;