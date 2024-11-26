"use client"

import { Message } from "ai"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Avatar } from "../ui/avatar"
import { Bot, User } from 'lucide-react'

export function ChatMessage({ message }: { message: Message }) {
  return (
    <div
      className={cn(
        "flex w-full items-start gap-4",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {message.role !== "user" && (
        <Avatar className="h-8 w-8">
          <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center rounded-full">
            <Bot className="h-4 w-4" />
          </div>
        </Avatar>
      )}
      <Card className={cn(
        "max-w-[80%] overflow-hidden p-3",
        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
      )}>
        <p className="leading-relaxed whitespace-pre-wrap text-sm">{message.content}</p>
      </Card>
      {message.role === "user" && (
        <Avatar className="h-8 w-8">
          <div className="bg-muted flex h-full w-full items-center justify-center rounded-full">
            <User className="h-4 w-4" />
          </div>
        </Avatar>
      )}
    </div>
  )
}