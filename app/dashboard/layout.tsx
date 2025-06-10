"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { LoadingScreen } from "../../components/loading-screen"
import { FloatingNavigation } from "../../components/navigation/floating-navigation"
import { Inter, Red_Hat_Display, Pacifico, Satisfy } from "next/font/google"

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


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isConnected } = useAccount()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected) {
        router.push("/")
      } else {
        setIsLoading(false)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [isConnected, router])

  if (isLoading) {
    return <LoadingScreen onComplete={() => {
      setIsLoading(false)
    }} />
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <main className={`${inter.variable} ${redHatDisplay.variable} ${pacifico.variable} ${SatisfyFont.variable} font-redHatDisplay w-full`}>{children}</main>
      <FloatingNavigation />
    </div>
  )
}
