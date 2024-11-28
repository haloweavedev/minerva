import { useRef, useEffect, useState, useCallback } from 'react'
import { ChatInput } from './ChatInput'
import   ChatMessage from './ChatMessage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles, ArrowDown } from 'lucide-react'
import { Message } from 'ai'
import { ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface ChatInterfaceProps {
  messages: Message[]
  input: string
  handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  error?: Error
}

export function ChatInterface({ 
  messages = [], 
  input, 
  handleInputChange, 
  handleSubmit, 
  isLoading, 
  error 
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const conversationStarters = [
    "What did readers think about No Man's Land by Sally Malcolm?",
    "Tell me about A Friend in the Glass by Gregory Ashe",
    "Can you recommend books similar to Murder in Highbury?",
    "What are the latest romance book reviews?",
  ]

  // Filter out raw book data messages
  const displayMessages = messages.filter(m => 
    m.role === 'user' || (m.role === 'assistant' && (!m.content.trim().startsWith('{') || m.content.includes('</book-data>')))
  )

  // Scroll handling
  const handleScroll = useCallback(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const { scrollTop, scrollHeight, clientHeight } = scrollArea
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }, [])

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    scrollArea.addEventListener('scroll', handleScroll)
    return () => scrollArea.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current && !showScrollButton) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: displayMessages.length <= 2 ? 'auto' : 'smooth',
        block: 'end'
      })
    }
  }, [displayMessages, showScrollButton])

  // Handle message submission with pending state
  const handleMessageSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim() || isLoading) return

    setPendingMessage(input.trim())
    await handleSubmit(event)
    setPendingMessage(null)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    })
    setShowScrollButton(false)
  }

  return (
    <Card className="flex h-[calc(100vh-2rem)] w-full max-w-4xl mx-auto overflow-hidden rounded-xl border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col w-full">
        <CardHeader className="border-b border-white/10 bg-white/5 px-6">
          <CardTitle className="flex items-center gap-2 text-2xl font-serif">
            <Sparkles className="h-6 w-6 text-[#7f85c2]" />
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
            >
              Minerva - AAR Assistant
            </motion.span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-4">
          <ScrollArea 
            className="h-full pr-4 custom-scrollbar" 
            ref={scrollAreaRef}
          >
            <AnimatePresence mode="wait">
              {displayMessages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-4 p-4"
                >
                  <p className="text-xl font-medium font-serif text-white">
                    Welcome to All About Romance!
                  </p>
                  <p className="text-sm text-white/80 mb-4">
                    Ask me about romance books, reviews, or get personalized recommendations.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                    {conversationStarters.map((starter, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: index * 0.1,
                          type: "spring",
                          stiffness: 300
                        }}
                        onClick={() => {
                          handleInputChange({ target: { value: starter } } as ChangeEvent<HTMLInputElement>)
                          handleMessageSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>)
                        }}
                        className="p-4 text-left rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/90 border border-white/10"
                      >
                        {starter}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6 py-4">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {displayMessages.map((message, index) => (
                      <motion.div
                        key={message.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ 
                          duration: 0.4,
                          type: "spring",
                          damping: 20
                        }}
                      >
                        <ChatMessage
                          message={message}
                          isLoading={isLoading && index === displayMessages.length - 1}
                        />
                      </motion.div>
                    ))}

                    {/* Pending message animation */}
                    {pendingMessage && (
                      <motion.div
                        key="pending"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChatMessage
                          message={{ role: 'user', content: pendingMessage, id: 'pending' }}
                          isLoading={false}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-24 right-6"
              >
                <Button
                  onClick={scrollToBottom}
                  size="sm"
                  className="bg-[#7f85c2] text-white hover:bg-[#6b70a3] transition-colors rounded-full shadow-lg px-4 py-2 flex items-center gap-2"
                >
                  <ArrowDown className="w-4 h-4" />
                  <span className="text-sm">New messages</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <div className="p-4 border-t border-white/10 bg-white/5">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleMessageSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Card>
  )
}