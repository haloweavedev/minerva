import "./globals.css"
import type { Metadata } from "next"
import { DM_Serif_Text, Inter } from 'next/font/google'

const dmSerifText = DM_Serif_Text({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-serif',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "Minerva - AAR Assistant",
  description: "AI-powered romance book review chatbot for All About Romance - Find your next great romance read!",
  keywords: "romance books, book reviews, AI chatbot, book recommendations, All About Romance",
  authors: [{ name: "All About Romance" }],
  openGraph: {
    title: "Minerva - AAR Assistant",
    description: "Find your next great romance read with AI-powered book recommendations and reviews.",
    url: "https://allaboutromance.com",
    siteName: "All About Romance",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minerva - AAR Assistant",
    description: "AI-powered romance book recommendations and reviews",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      className={`${dmSerifText.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen overflow-hidden bg-[#1a1a2e]">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(127,133,194,0.15)_0%,rgba(26,26,46,0.9)_50%,rgba(26,26,46,1)_100%)]" />
        <div className="relative h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}