"use client"

import { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { ShoppingCart, Coins, Wallet, Plus, Search, TrendingUp, DollarSign } from "lucide-react"
import { useOptimizedSearch } from "../../../hooks/use-optimized-search"
import { useAccountModal } from "@tomo-inc/tomo-evm-kit"
interface MarketListing {
  id: string
  seller: string
  ipaTitle: string
  tokenType: "license" | "royalty"
  quantity: number
  pricePerToken: number
  totalValue: number
  timeRemaining: string
}

interface UserToken {
  id: string
  ipaTitle: string
  tokenType: "license" | "royalty"
  quantity: number
  currentValue: number
}

export default function SecondaryMarketPage() {
  const [listings, setListings] = useState<MarketListing[]>([])
  const [userTokens, setUserTokens] = useState<UserToken[]>([])
  const [loading, setLoading] = useState(true)
  const [showSellDialog, setShowSellDialog] = useState(false)
  const [selectedToken, setSelectedToken] = useState<UserToken | null>(null)
  const [sellQuantity, setSellQuantity] = useState("")
  const [sellPrice, setSellPrice] = useState("")
  const{openAccountModal}=useAccountModal()
  const [searchResult, handleSearch] = useOptimizedSearch(listings, {
    keys: ["ipaTitle", "seller"],
    enableFuzzySearch: true,
    maxResults: 50,
    debounceMs: 300,
  })

  useEffect(() => {
    const loadMarketData = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockListings: MarketListing[] = [
        {
          id: "listing-001",
          seller: "0x1234...5678",
          ipaTitle: "Digital Art Collection #1",
          tokenType: "license",
          quantity: 5,
          pricePerToken: 0.1,
          totalValue: 0.5,
          timeRemaining: "2d 14h",
        },
        {
          id: "listing-002",
          seller: "0x9876...5432",
          ipaTitle: "AI Generated Music",
          tokenType: "royalty",
          quantity: 100,
          pricePerToken: 0.05,
          totalValue: 5.0,
          timeRemaining: "5d 8h",
        },
        {
          id: "listing-003",
          seller: "0x5555...7777",
          ipaTitle: "Video Content Series",
          tokenType: "license",
          quantity: 3,
          pricePerToken: 0.2,
          totalValue: 0.6,
          timeRemaining: "1d 3h",
        },
      ]

      const mockUserTokens: UserToken[] = [
        {
          id: "token-001",
          ipaTitle: "Digital Art Collection #1",
          tokenType: "license",
          quantity: 5,
          currentValue: 0.12,
        },
        {
          id: "token-002",
          ipaTitle: "AI Generated Music",
          tokenType: "royalty",
          quantity: 75,
          currentValue: 0.048,
        },
      ]

      setListings(mockListings)
      setUserTokens(mockUserTokens)
      setLoading(false)
    }

    loadMarketData()
  }, [])

  const handleBuyTokens = async (listing: MarketListing) => {
    // Simulate purchase
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // Show success message and update listings
  }

  const handleSellTokens = async () => {
    if (!selectedToken || !sellQuantity || !sellPrice) return

    // Simulate listing creation
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setShowSellDialog(false)
    setSelectedToken(null)
    setSellQuantity("")
    setSellPrice("")
    // Show success message
  }

  const filteredListings = searchResult.results

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading secondary market...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Secondary Market</h1>
          <p className="text-gray-400">Trade license and royalty tokens</p>
        </div>
        <Button 
          onClick={openAccountModal} 
          className="bg-orange-500 hover:bg-orange-600"
        >
          Account
        </Button>
      </div>

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList className="bg-gray-800 border-orange-500/20">
          <TabsTrigger value="marketplace" className="data-[state=active]:bg-orange-500">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="my-tokens" className="data-[state=active]:bg-orange-500">
            <Wallet className="w-4 h-4 mr-2" />
            My Tokens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search listings..."
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700"
            />
            {searchResult.isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="loading-spinner w-4 h-4"></div>
              </div>
            )}
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active Listings</CardTitle>
                <ShoppingCart className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{listings.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {listings.reduce((sum, listing) => sum + listing.totalValue, 0).toFixed(2)} ETH
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Avg. Price</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {(listings.reduce((sum, listing) => sum + listing.pricePerToken, 0) / listings.length).toFixed(3)} ETH
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listings */}
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{listing.ipaTitle}</h3>
                        <Badge
                          variant="secondary"
                          className={`
                            ${listing.tokenType === "license" ? "bg-blue-500/20 text-blue-500" : "bg-purple-500/20 text-purple-500"}
                          `}
                        >
                          {listing.tokenType === "license" ? (
                            <Coins className="w-3 h-3 mr-1" />
                          ) : (
                            <Wallet className="w-3 h-3 mr-1" />
                          )}
                          {listing.tokenType.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Seller</p>
                          <p className="text-white">{listing.seller}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Quantity</p>
                          <p className="text-white">{listing.quantity} tokens</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Price per Token</p>
                          <p className="text-white">{listing.pricePerToken} ETH</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Time Remaining</p>
                          <p className="text-white">{listing.timeRemaining}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-white mb-2">{listing.totalValue} ETH</p>
                      <Button onClick={() => handleBuyTokens(listing)} className="bg-orange-500 hover:bg-orange-600">
                        Buy Tokens
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-tokens" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Your Token Holdings</h2>
            <Button onClick={() => setShowSellDialog(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Listing
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userTokens.map((token) => (
              <Card key={token.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{token.ipaTitle}</span>
                    <Badge
                      variant="secondary"
                      className={`
                        ${token.tokenType === "license" ? "bg-blue-500/20 text-blue-500" : "bg-purple-500/20 text-purple-500"}
                      `}
                    >
                      {token.tokenType === "license" ? (
                        <Coins className="w-3 h-3 mr-1" />
                      ) : (
                        <Wallet className="w-3 h-3 mr-1" />
                      )}
                      {token.tokenType.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quantity:</span>
                      <span className="text-white font-semibold">{token.quantity} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Value:</span>
                      <span className="text-white font-semibold">{token.currentValue} ETH each</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Value:</span>
                      <span className="text-white font-semibold">
                        {(token.quantity * token.currentValue).toFixed(3)} ETH
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedToken(token)
                        setShowSellDialog(true)
                      }}
                      variant="outline"
                      className="w-full border-gray-600 mt-4"
                    >
                      Sell Tokens
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Sell Dialog */}
      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create Token Listing</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {selectedToken && (
              <div className="p-4 bg-gray-900 rounded-lg">
                <h4 className="text-white font-medium mb-2">{selectedToken.ipaTitle}</h4>
                <p className="text-gray-400 text-sm">
                  Available: {selectedToken.quantity} {selectedToken.tokenType} tokens
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Quantity to Sell</label>
                <Input
                  type="number"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="bg-gray-700 border-gray-600"
                  max={selectedToken?.quantity || 0}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Price per Token (ETH)</label>
                <Input
                  type="number"
                  step="0.001"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="Enter price per token"
                  className="bg-gray-700 border-gray-600"
                />
              </div>

              {sellQuantity && sellPrice && (
                <div className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Value:</span>
                    <span className="text-white font-semibold">
                      {(Number.parseFloat(sellQuantity) * Number.parseFloat(sellPrice)).toFixed(3)} ETH
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <Button onClick={() => setShowSellDialog(false)} variant="outline" className="flex-1 border-gray-600">
                Cancel
              </Button>
              <Button
                onClick={handleSellTokens}
                disabled={!sellQuantity || !sellPrice}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Create Listing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
