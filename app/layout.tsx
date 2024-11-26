import type { Metadata } from "next";
import { DM_Serif_Text, Inter } from 'next/font/google'
import "./globals.css";

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
  description: "AI-powered romance book review chatbot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSerifText.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}