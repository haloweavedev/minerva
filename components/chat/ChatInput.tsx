import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRef, useEffect, KeyboardEvent } from "react"
import { Send } from 'lucide-react'
import { motion } from 'framer-motion'

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
      className="relative flex items-center gap-2"
    >
      <div className="relative flex-1">
        <Textarea
          ref={textareaRef}
          tabIndex={0}
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Ask about romance books, reviews, or recommendations..."
          spellCheck={true}
          className="min-h-[44px] w-full resize-none bg-white/5 hover:bg-white/10 focus:bg-white/10 px-4 py-[0.6rem] focus-visible:ring-1 focus-visible:ring-[#7f85c2] border-none rounded-lg text-white placeholder-white/50 transition-colors"
          aria-label="Type your message"
        />
      </div>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          type="submit" 
          size="icon" 
          disabled={isLoading || !input.trim()}
          className={`shrink-0 bg-[#7f85c2] text-white hover:bg-[#6b70a3] transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <div role="status" className="flex justify-center" aria-label="Sending message">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              <span className="sr-only">Sending message...</span>
            </div>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </>
          )}
        </Button>
      </motion.div>
    </form>
  )
}