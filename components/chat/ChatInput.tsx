"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRef } from "react"
import { Send } from 'lucide-react'

interface ChatInputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export function ChatInput({ input, handleInputChange, handleSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-4 p-4 border-t">
      <Textarea
        ref={textareaRef}
        tabIndex={0}
        rows={1}
        value={input}
        onChange={handleInputChange}
        placeholder="Ask about romance books, authors, or tropes..."
        spellCheck={false}
        className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem]"
      />
      <Button type="submit" disabled={isLoading}>
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  )
}