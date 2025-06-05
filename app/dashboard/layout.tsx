"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { LoadingScreen } from "../../components/loading-screen"
import { FloatingNavigation } from "../../components/navigation/floating-navigation"

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
      <main className="w-full">{children}</main>
      <FloatingNavigation />
    </div>
  )
}
