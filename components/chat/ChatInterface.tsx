"use client"

import { useChat } from 'ai/react'
import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'
import { Card } from '../ui/card'
import { Heart } from 'lucide-react'

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  })

  return (
    <div className="flex flex-col min-h-[600px] w-full max-w-2xl mx-auto">
      <Card className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-pink-500" />
            <h2 className="text-lg font-semibold">All About Romance Assistant</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <p className="text-lg font-medium">Welcome to All About Romance!</p>
              <p className="text-sm text-muted-foreground">
                Ask me about romance books, authors, or specific tropes you're interested in.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </Card>
    </div>
  )
}