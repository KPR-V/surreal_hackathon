"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Wallet, TrendingUp, Coins, FileText, Download, DollarSign, ArrowUpRight } from "lucide-react"
import { useAccountModal } from "@tomo-inc/tomo-evm-kit"
interface UserIPA {
  id: string
  title: string
  type: "image" | "video" | "audio" | "text"
  image: string
  revenue: number
  licenseTokens: number
  royaltyTokens: number
  status: "active" | "pending" | "inactive"
}

export default function MyAccountPage() {
  const [ipas, setIpas] = useState<UserIPA[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [claimingRevenue, setClaimingRevenue] = useState(false)
  const{openAccountModal}=useAccountModal()
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockIPAs: UserIPA[] = [
        {
          id: "ipa-001",
          title: "Digital Art Collection #1",
          type: "image",
          image: "/placeholder.svg?height=150&width=150",
          revenue: 2.3,
          licenseTokens: 5,
          royaltyTokens: 100,
          status: "active",
        },
        {
          id: "ipa-002",
          title: "AI Generated Music",
          type: "audio",
          image: "/placeholder.svg?height=150&width=150",
          revenue: 1.8,
          licenseTokens: 3,
          royaltyTokens: 75,
          status: "active",
        },
        {
          id: "ipa-003",
          title: "Video Content Series",
          type: "video",
          image: "/placeholder.svg?height=150&width=150",
          revenue: 0.0,
          licenseTokens: 0,
          royaltyTokens: 50,
          status: "pending",
        },
      ]

      setIpas(mockIPAs)
      setTotalRevenue(mockIPAs.reduce((sum, ipa) => sum + ipa.revenue, 0))
      setLoading(false)
    }

    loadUserData()
  }, [])

  const handleClaimRevenue = async () => {
    setClaimingRevenue(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setClaimingRevenue(false)
    // Show success message
  }

  const handlePayRoyalty = async (ipaId: string) => {
    // Simulate royalty payment
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // Show success message
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
     <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Account</h1>
          <p className="text-gray-400">Manage your IP assets and earnings</p>
        </div>
        <Button 
          onClick={openAccountModal} 
          className="bg-orange-500 hover:bg-orange-600"
        >
          Account
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total IPAs</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{ipas.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalRevenue.toFixed(2)} ETH</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">License Tokens</CardTitle>
            <Coins className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{ipas.reduce((sum, ipa) => sum + ipa.licenseTokens, 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Royalty Tokens</CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{ipas.reduce((sum, ipa) => sum + ipa.royaltyTokens, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ipas" className="space-y-6">
        <TabsList className="bg-gray-800 border-orange-500/20">
          <TabsTrigger value="ipas" className="data-[state=active]:bg-orange-500">
            My IPAs
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-orange-500">
            Revenue
          </TabsTrigger>
          <TabsTrigger value="tokens" className="data-[state=active]:bg-orange-500">
            Tokens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ipas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ipas.map((ipa) => (
              <Card key={ipa.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <img
                    src={ipa.image || "/placeholder.svg"}
                    alt={ipa.title}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                  <CardTitle className="text-white">{ipa.title}</CardTitle>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={`
                        ${ipa.status === "active" ? "bg-green-500/20 text-green-500" : ""}
                        ${ipa.status === "pending" ? "bg-yellow-500/20 text-yellow-500" : ""}
                        ${ipa.status === "inactive" ? "bg-red-500/20 text-red-500" : ""}
                      `}
                    >
                      {ipa.status.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
                      {ipa.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Revenue:</span>
                      <span className="text-white font-semibold">{ipa.revenue} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">License Tokens:</span>
                      <span className="text-white">{ipa.licenseTokens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Royalty Tokens:</span>
                      <span className="text-white">{ipa.royaltyTokens}</span>
                    </div>
                    <Button
                      onClick={() => handlePayRoyalty(ipa.id)}
                      variant="outline"
                      className="w-full border-gray-600 mt-4"
                    >
                      Pay Royalty
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                Revenue Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Available to Claim</h3>
                  <div className="text-3xl font-bold text-green-500 mb-4">{totalRevenue.toFixed(2)} ETH</div>
                  <Button
                    onClick={handleClaimRevenue}
                    disabled={claimingRevenue || totalRevenue === 0}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {claimingRevenue ? (
                      <div className="flex items-center space-x-2">
                        <div className="loading-spinner w-4 h-4"></div>
                        <span>Claiming...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Claim Revenue</span>
                      </div>
                    )}
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Revenue by IPA</h3>
                  <div className="space-y-3">
                    {ipas.map((ipa) => (
                      <div key={ipa.id} className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                        <span className="text-gray-300">{ipa.title}</span>
                        <span className="text-white font-semibold">{ipa.revenue} ETH</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Coins className="w-5 h-5 mr-2 text-blue-500" />
                  License Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ipas.map((ipa) => (
                    <div key={ipa.id} className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{ipa.title}</p>
                        <p className="text-gray-400 text-sm">{ipa.licenseTokens} tokens</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-600">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Wallet className="w-5 h-5 mr-2 text-purple-500" />
                  Royalty Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ipas.map((ipa) => (
                    <div key={ipa.id} className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{ipa.title}</p>
                        <p className="text-gray-400 text-sm">{ipa.royaltyTokens} tokens</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-600">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
