"use client"

import { useRef, useEffect, useState } from 'react'
import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles } from 'lucide-react'
import { Message } from 'ai'
import { ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

  const conversationStarters = [
    "What did readers think about No Man's Land by Sally Malcolm?",
    "Tell me about A Friend in the Glass by Gregory Ashe",
    "Can you recommend books similar to Murder in Highbury?",
    "What are the latest romance book reviews?",
  ]

  const displayMessages = messages.filter(m => 
    m.role === 'user' || (m.role === 'assistant' && (!m.content.trim().startsWith('{') || m.content.includes('</book-data>')))
  )

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }

    scrollArea.addEventListener('scroll', handleScroll)
    return () => scrollArea.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: displayMessages.length <= 2 ? 'auto' : 'smooth'
      })
    }
  }, [displayMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollButton(false)
  }

  return (
    <Card className="flex h-[calc(100vh-2rem)] w-full max-w-4xl mx-auto overflow-hidden rounded-xl border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col w-full">
        <CardHeader className="border-b border-white/10 bg-white/5 px-6">
          <CardTitle className="flex items-center gap-2 text-2xl font-serif">
            <Sparkles className="h-6 w-6 text-[#7f85c2]" />
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Minerva - AAR Assistant
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-4">
          <ScrollArea 
            className="h-full pr-4 custom-scrollbar" 
            ref={scrollAreaRef}
          >
            <AnimatePresence initial={false}>
              {displayMessages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
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
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        onClick={() => {
                          handleInputChange({ target: { value: starter } } as ChangeEvent<HTMLInputElement>)
                          handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>)
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
                  {displayMessages.map((message, index) => (
                    <motion.div
                      key={message.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChatMessage
                        message={message}
                        isLoading={isLoading && index === displayMessages.length - 1}
                      />
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={scrollToBottom}
              className="absolute bottom-24 right-6 bg-[#7f85c2] text-white px-4 py-2 rounded-full shadow-lg hover:bg-[#6b70a3] transition-colors text-sm"
            >
              ↓ New messages
            </motion.button>
          )}
        </CardContent>

        <div className="p-4 border-t border-white/10 bg-white/5">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Card>
  )
}