import type React from "react"
import type { Metadata } from "next"
import { Inter, Red_Hat_Display, Pacifico, Satisfy } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "@/components/providers/wallet-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const pacifico = Pacifico({
  subsets: ['latin'],
  variable: '--font-pacifico',
  weight: "400"
})

const SatisfyFont = Satisfy({
  subsets: ['latin'],
  variable: '--font-satisfy',
  weight: "400"
})

const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-red-hat-display",
})

export const metadata: Metadata = {
  title: "IPA Platform - Intellectual Property Asset Management",
  description: "Register, manage, and trade your intellectual property assets",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${redHatDisplay.variable} ${pacifico.variable} ${SatisfyFont.variable} font-sans`}>
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  )
}
