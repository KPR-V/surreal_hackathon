"use client"
import type React from "react"
import dynamic from "next/dynamic"
import { Inter, Red_Hat_Display, Pacifico, Satisfy } from "next/font/google"
import "./globals.css"
import { Toaster } from "../components/ui/toaster"

const WalletProvider = dynamic(
  () => import("../components/providers/wallet-provider").then(mod => mod.WalletProvider),
  { ssr: false }
);

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
