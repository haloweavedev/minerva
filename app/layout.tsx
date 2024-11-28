import "./globals.css"
import type { Metadata } from "next"
import { DM_Serif_Text, Inter } from 'next/font/google'

// Font setup
const dmSerifText = DM_Serif_Text({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-serif',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

// Metadata
export const metadata: Metadata = {
  title: "Minerva - Romance Book Assistant",
  description: "AI-powered romance book review chatbot for All About Romance - Find your next great romance read!",
  keywords: "romance books, book reviews, AI chatbot, book recommendations, All About Romance",
  authors: [{ name: "All About Romance" }],
  openGraph: {
    title: "Minerva - Romance Book Assistant",
    description: "Find your next great romance read with AI-powered book recommendations and reviews.",
    url: "https://allaboutromance.com",
    siteName: "All About Romance",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minerva - Romance Book Assistant",
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
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-background/90 via-background/50 to-background/90 font-sans antialiased">
        <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-12">
          {children}
        </main>
      </body>
    </html>
  )
}