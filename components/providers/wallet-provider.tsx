"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { tomoWallet, type WalletConnection } from "@/lib/wallet/tomo-wallet"

interface WalletContextType {
  connection: WalletConnection | null
  isLoading: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  getBalance: () => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const savedConnection = tomoWallet.getConnection()
    if (savedConnection) {
      setConnection(savedConnection)
    }
  }, [])

  const connectWallet = async () => {
    setIsLoading(true)
    try {
      const newConnection = await tomoWallet.connect()
      setConnection(newConnection)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = async () => {
    await tomoWallet.disconnect()
    setConnection(null)
  }

  const getBalance = async () => {
    if (!connection) throw new Error("Wallet not connected")
    return await tomoWallet.getBalance(connection.address)
  }

  return (
    <WalletContext.Provider
      value={{
        connection,
        isLoading,
        connectWallet,
        disconnectWallet,
        getBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
