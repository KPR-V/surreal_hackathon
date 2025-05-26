"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/components/providers/wallet-provider"
import { LoadingScreen } from "@/components/loading-screen"
import { FloatingNavigation } from "@/components/navigation/floating-navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { connection } = useWallet()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!connection) {
        router.push("/")
      } else {
        setIsLoading(false)
        // Add a small delay before showing content to ensure smooth transition
        setTimeout(() => {
          setShowContent(true)
        }, 300)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [connection, router])

  if (isLoading) {
    return <LoadingScreen onComplete={() => {
      setIsLoading(false)
      setTimeout(() => {
        setShowContent(true)
      }, 300)
    }} />
  }

  if (!connection) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="w-full">{children}</main>
      {showContent && <FloatingNavigation />}
    </div>
  )
}
