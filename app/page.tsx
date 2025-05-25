"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingScreen } from "@/components/loading-screen"
import { AnimatedBackground } from "@/components/animated-background"
import { useWallet } from "@/components/providers/wallet-provider"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export default function IntroPage() {
  const [showLoading, setShowLoading] = useState(true)
  const { connection, connectWallet, isLoading } = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (connection) {
      router.push("/dashboard/marketplace")
    }
  }, [connection, router])

  if (showLoading) {
    return <LoadingScreen onComplete={() => setShowLoading(false)} />
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          <h1 className="text-6xl font-bold text-white mb-6">
            IPA <span className="text-orange-500">Platform</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Register, manage, and trade your intellectual property assets on the blockchain. Create, protect, and
            monetize your creative works with cutting-edge technology.
          </p>

          <div className="space-y-4">
            <Button
              onClick={connectWallet}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="loading-spinner w-5 h-5"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Wallet className="w-6 h-6" />
                  <span>Connect Tomo Wallet</span>
                </div>
              )}
            </Button>

            <p className="text-sm text-gray-400">Connect your wallet to access the platform</p>
          </div>
        </div>
      </div>
    </div>
  )
}
