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

export function ChatInput({ 
  input, 
  handleInputChange, 
  handleSubmit, 
  isLoading 
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  // Handle keyboard shortcuts
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (but not with Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  // Romance-specific placeholders
  const placeholders = [
    "Ask about a specific romance book review...",
    "Compare two romance books...",
    "Looking for books with enemies-to-lovers trope?",
    "Find romance books with high ratings...",
    "Search for historical romance recommendations...",
    "What did readers think about [book title]?",
    "Ask about romance books by [author name]...",
    "Looking for specific heat level recommendations?",
  ]

  // Randomly select a placeholder on each render
  const placeholder = placeholders[Math.floor(Math.random() * placeholders.length)]

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className="relative flex items-center gap-2 rounded-lg bg-background/95 backdrop-blur p-2"
    >
      <Textarea
        ref={textareaRef}
        tabIndex={0}
        rows={1}
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        spellCheck={true}
        className="min-h-[44px] w-full resize-none bg-transparent px-4 py-[0.6rem] focus-visible:ring-0 focus-visible:ring-offset-0 border-none"
        aria-label="Type your message"
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={isLoading || !input.trim()}
        className={`absolute right-4 transition-all duration-200 ${
          isLoading ? 'opacity-50' : 'hover:bg-primary hover:text-primary-foreground'
        }`}
      >
        {isLoading ? (
          <div role="status" className="flex justify-center" aria-label="Sending message">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-foreground" />
            <span className="sr-only">Sending message...</span>
          </div>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </>
        )}
      </Button>
    </form>
  )
}