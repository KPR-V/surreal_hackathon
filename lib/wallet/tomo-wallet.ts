export interface WalletConnection {
  address: string
  chainId: number
  isConnected: boolean
}

export interface TomoWalletAPI {
  connect(): Promise<WalletConnection>
  disconnect(): Promise<void>
  getBalance(address: string): Promise<string>
  signTransaction(transaction: any): Promise<string>
  isInstalled(): boolean
}

class TomoWalletService implements TomoWalletAPI {
  private connection: WalletConnection | null = null

  async connect(): Promise<WalletConnection> {
    try {
      // Simulate Tomo Wallet connection
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockConnection: WalletConnection = {
        address: "0x" + Math.random().toString(16).substr(2, 40),
        chainId: 88, // Tomo Chain ID
        isConnected: true,
      }

      this.connection = mockConnection
      localStorage.setItem("tomo_wallet_connection", JSON.stringify(mockConnection))

      return mockConnection
    } catch (error) {
      throw new Error("Failed to connect to Tomo Wallet")
    }
  }

  async disconnect(): Promise<void> {
    this.connection = null
    localStorage.removeItem("tomo_wallet_connection")
  }

  async getBalance(address: string): Promise<string> {
    // Simulate balance fetch
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return (Math.random() * 10).toFixed(4)
  }

  async signTransaction(transaction: any): Promise<string> {
    if (!this.connection) {
      throw new Error("Wallet not connected")
    }

    // Simulate transaction signing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return "0x" + Math.random().toString(16).substr(2, 64)
  }

  isInstalled(): boolean {
    // Check if Tomo Wallet is installed
    return typeof window !== "undefined" && !!(window as any).tomo
  }

  getConnection(): WalletConnection | null {
    if (this.connection) return this.connection

    const saved = localStorage.getItem("tomo_wallet_connection")
    if (saved) {
      this.connection = JSON.parse(saved)
      return this.connection
    }

    return null
  }
}

export const tomoWallet = new TomoWalletService()
