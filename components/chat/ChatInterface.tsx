"use client"

import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ScrollArea } from '../ui/scroll-area'
import { Sparkles } from 'lucide-react'
import { Message } from 'ai'
import { ChangeEvent } from 'react'

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (event?: any) => void;
  isLoading: boolean;
  error?: Error;
}

export function ChatInterface({ messages = [], input, handleInputChange, handleSubmit, isLoading, error }: ChatInterfaceProps) {
  return (
    <Card className="flex flex-col h-[600px] w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="border-b bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="flex items-center space-x-2 font-serif">
          <Sparkles className="h-6 w-6" />
          <span>Minerva - AAR Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full pr-4">
          {messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <p className="text-lg font-medium font-serif">Welcome to All About Romance!</p>
              <p className="text-sm text-muted-foreground">
                Ask Minerva about romance books, authors, or specific tropes you're interested in.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages?.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {error && (
                <div className="text-red-500 text-sm">
                  Error: {error.message}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <div className="border-t p-4">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </Card>
  )
}