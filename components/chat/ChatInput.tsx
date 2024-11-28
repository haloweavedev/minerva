import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from "@/lib/utils"

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
  const [isFocused, setIsFocused] = useState(false)

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // Focus handling
  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)

  // Handle keyboard shortcuts
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
      return
    }

    // New line on Shift + Enter
    if (e.key === 'Enter' && e.shiftKey) {
      return
    }
  }

  // Animation variants
  const formVariants = {
    focused: {
      scale: 1.01,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    unfocused: {
      scale: 1
    }
  }

  const buttonVariants = {
    disabled: { 
      scale: 0.95,
      opacity: 0.5 
    },
    enabled: { 
      scale: 1,
      opacity: 1 
    },
    tap: { 
      scale: 0.95 
    },
    hover: { 
      scale: 1.05,
      backgroundColor: "rgb(107, 112, 163)" 
    }
  }

  const loadingSpinnerVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        ease: "linear",
        repeat: Infinity
      }
    }
  }

  return (
    <motion.form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className="relative flex items-center gap-2"
      variants={formVariants}
      animate={isFocused ? "focused" : "unfocused"}
    >
      <div className="relative flex-1">
        <Textarea
          ref={textareaRef}
          tabIndex={0}
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Ask about romance books, reviews, or recommendations..."
          spellCheck={true}
          className={cn(
            "min-h-[44px] w-full resize-none px-4 py-[0.6rem] rounded-lg text-white",
            "placeholder-white/50 transition-all duration-200",
            "border-none focus-visible:ring-1 focus-visible:ring-[#7f85c2]",
            "bg-white/5 hover:bg-white/10 focus:bg-white/10",
            isFocused ? "shadow-lg" : "shadow-none"
          )}
          aria-label="Type your message"
          disabled={isLoading}
        />

        {/* Character limit indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: input.length > 0 ? 1 : 0 }}
          className="absolute bottom-2 right-3 text-xs text-white/50"
        >
          {input.length > 0 && (
            <span>{input.length}/2000</span>
          )}
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          variants={buttonVariants}
          initial="disabled"
          animate={isLoading || !input.trim() ? "disabled" : "enabled"}
          whileHover={isLoading || !input.trim() ? undefined : "hover"}
          whileTap={isLoading || !input.trim() ? undefined : "tap"}
        >
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || !input.trim()}
            className={cn(
              "shrink-0 transition-all duration-200",
              "bg-[#7f85c2] text-white hover:bg-[#6b70a3]",
              isLoading || !input.trim() ? "opacity-50 cursor-not-allowed" : "",
              isFocused ? "shadow-md" : "shadow-none"
            )}
          >
            {isLoading ? (
              <motion.div
                role="status"
                className="flex justify-center"
                aria-label="Sending message"
                variants={loadingSpinnerVariants}
                initial="initial"
                animate="animate"
              >
                <div className="h-4 w-4 rounded-full border-2 border-white border-r-transparent" />
                <span className="sr-only">Sending message...</span>
              </motion.div>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </>
            )}
          </Button>
        </motion.div>
      </AnimatePresence>
    </motion.form>
  )
}