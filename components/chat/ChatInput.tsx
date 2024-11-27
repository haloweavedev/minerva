"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRef, useEffect, KeyboardEvent } from "react"
import { Send } from 'lucide-react'

interface ChatInputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export function ChatInput({ input, handleInputChange, handleSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className="relative flex items-center gap-2 rounded-xl bg-gradient-to-b from-secondary/50 to-secondary/30 p-2"
    >
      <Textarea
        ref={textareaRef}
        tabIndex={0}
        rows={1}
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        placeholder="Ask a follow up..."
        spellCheck={false}
        className="min-h-[44px] w-full resize-none bg-transparent px-4 py-[0.6rem] pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 border-none"
      />
      <Button 
        type="submit" 
        size="icon" 
        variant="ghost" 
        disabled={isLoading}
        className="absolute right-4 transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  )
}