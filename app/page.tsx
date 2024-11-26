import { ChatInterface } from '@/components/chat/ChatInterface'

export default function Home() {
  return (
    <main className="flex min-h-screen max-h-screen flex-col items-center justify-center p-24">
      <ChatInterface />
    </main>
  )
}