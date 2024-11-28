import { Message } from "ai"
import { cn } from "@/lib/utils"
import { Avatar } from "../ui/avatar"
import { Bot, User } from 'lucide-react'
import { useEffect, useState, memo } from "react"
import BookReviewCard from "./BookReviewCard"
import { Book } from "@/lib/validators/book-data"
import { motion, AnimatePresence } from 'framer-motion'

interface MessageSkeletonProps {
  isUser?: boolean
}

const MessageSkeleton = ({ isUser }: MessageSkeletonProps) => (
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
      isUser ? "bg-[#7f85c2] text-white" : "bg-white/5 backdrop-blur"
    )}>
      <motion.div 
        animate={{ 
          opacity: [0.5, 1, 0.5],
          transition: { 
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }
        }}
        className="space-y-2"
      >
        <div className="h-4 w-2/3 bg-white/10 rounded" />
        <div className="h-4 w-1/2 bg-white/10 rounded" />
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
)

interface ProcessedContent {
  books: Book[] | null
  content: string | null
}

interface ChatMessageProps {
  message: Message
  isLoading?: boolean
}

const ChatMessage = memo(({ message, isLoading }: ChatMessageProps) => {
  const [processedContent, setProcessedContent] = useState<ProcessedContent | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!message.content) return

    // Skip processing if the message is a raw book data response
    if (message.content.trim().startsWith('{') && !message.content.includes('</book-data>')) {
      return
    }

    setIsProcessing(true)
    
    try {
      const result = processMessageContent(message.content)
      setProcessedContent(result)
    } catch (error) {
      console.error('Error processing message:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [message.content])

  if (isLoading || isProcessing) {
    return <MessageSkeleton isUser={message.role === 'user'} />
  }

  // Hide raw book data messages
  if (message.role === 'assistant' && message.content.trim().startsWith('{')) {
    return null
  }

  const messageVariants = {
    initial: { 
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message.id}
        variants={messageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          "group relative flex items-start gap-4",
          message.role === "user" ? "justify-end" : "justify-start"
        )}
      >
        {message.role !== "user" && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <div className="bg-[#7f85c2] text-white flex h-full w-full items-center justify-center rounded-full">
              <Bot className="h-4 w-4" />
            </div>
          </Avatar>
        )}
        
        <div className={cn(
          "flex flex-col gap-4 rounded-lg px-4 py-3 max-w-[85%]",
          message.role === "user" 
            ? "bg-[#7f85c2] text-white" 
            : "bg-white/5 backdrop-blur text-white"
        )}>
          {message.role === "user" ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-sm whitespace-pre-wrap break-words"
            >
              {message.content}
            </motion.div>
          ) : processedContent ? (
            <div className="space-y-6">
              {/* Book Cards Section */}
              <AnimatePresence mode="wait">
                {processedContent.books?.map((book, index) => (
                  <motion.div
                    key={`${book.title}-${book.author}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ 
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: [0.4, 0, 0.2, 1]
                    }}
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
                  className="text-sm leading-relaxed text-white/90 space-y-4 prose prose-invert"
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
            <div className="bg-white/10 flex h-full w-full items-center justify-center rounded-full">
              <User className="h-4 w-4 text-white" />
            </div>
          </Avatar>
        )}
      </motion.div>
    </AnimatePresence>
  )
})

ChatMessage.displayName = "ChatMessage"

function processMessageContent(content: string): ProcessedContent {
  const bookMatch = content.match(/<book-data>([\s\S]*?)<\/book-data>/g)
  let books = null
  let cleanContent = content

  if (bookMatch) {
    try {
      books = bookMatch.map(match => {
        const bookData = JSON.parse(match.replace(/<\/?book-data>/g, ''))
        return bookData.books?.[0] || bookData
      })
      cleanContent = content.replace(/<book-data>[\s\S]*?<\/book-data>/g, '').trim()
    } catch (error) {
      console.error('Error parsing book data:', error)
    }
  }

  // Process markdown and format text
  cleanContent = cleanContent
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#7f85c2] hover:underline">$1</a>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\_(.*?)\_/g, '<em>$1</em>')
    .replace(/^\s*-\s(.+)$/gm, '<li class="text-white/90">$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc list-inside space-y-1">$&</ul>')
    .replace(/^###\s(.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
    .replace(/^##\s(.+)$/gm, '<h2 class="text-xl font-semibold text-white mt-6 mb-3">$1</h2>')
    .replace(/^#\s(.+)$/gm, '<h1 class="text-2xl font-semibold text-white mt-8 mb-4">$1</h1>')
    .replace(/^>\s*\*\*([^*]+)\*\*/gm, '<blockquote class="border-l-2 border-[#7f85c2] pl-4 py-2 my-4"><strong class="text-white">$1</strong>')
    .replace(/^>\s*(.*?)$/gm, '<blockquote class="border-l-2 border-[#7f85c2] pl-4 py-2 my-4 text-white/90">$1</blockquote>')
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p)
    .map(p => {
      if (p.startsWith('<')) return p
      return `<p class="text-white/90">${p}</p>`
    })
    .join('\n')

  return {
    books,
    content: cleanContent
  }
}

export default ChatMessage