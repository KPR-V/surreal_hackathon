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
          <h1 className="text-6xl font-bold text-white font-redHatDisplay mb-6">
            Mint <span className="text-transparent font-satisfy font-medium" style={{ WebkitTextStroke: '1px white'}}>Matrix</span>
          </h1>
          <p className="text-gray-300 mb-8 leading-relaxed font-redHatDisplay">
            Register, manage, and trade your intellectual property assets on the blockchain. Create, protect, and
            monetize your creative works with cutting-edge technology. Join thousands of creators and unlock new revenue streams through our global marketplace.
          </p>

          <div className="space-y-4">
           <button
            type="submit"
            onClick={connectWallet}
            disabled={isLoading}
            className={`
              group w-72 px-6 py-3 text-white font-medium rounded-lg relative overflow-hidden
              transition-all duration-300
              bg-gradient-to-r from-zinc-900 to-zinc-900 hover:from-zinc-900 hover:to-zinc-900
              disabled:opacity-50
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-blue-500/10 before:to-transparent
              before:translate-x-[-200%] before:animate-[${isLoading ? 'shimmer_1.5s_ease-in-out' : 'none'}]
              after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-pink-500/10 after:to-transparent
              after:translate-x-[-200%] after:animate-[${isLoading ? 'shimmer_1.5s_ease-in-out_0.2s' : 'none'}]
            `}
          >
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className={`transition-transform duration-500 ${isLoading ? 'scale-95' : ''}`}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="loading-spinner-gradient w-5 h-5"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-6 h-6" />
                    <span className="font-light">Connect Tomo Wallet</span>
                  </div>
                )}
              </span>
            </span>
          </button>

            <p className="text-sm text-gray-400 font-redHatDisplay">Connect your wallet to access the platform</p>
          </div>
        </div>
      </div>
    </div>
  )
}
