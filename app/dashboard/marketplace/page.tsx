"use client"

import { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Badge } from "../../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Grid, LucideList, Search, Eye, Coins, Filter } from "lucide-react"
import { useOptimizedSearch } from "../../../hooks/use-optimized-search"
import { FixedSizeList as VirtualList } from "react-window"
import { useAccountModal,useChainModal,useAddRecentTransaction } from "@tomo-inc/tomo-evm-kit"
interface IPA {
  id: string
  title: string
  creator: string
  image: string
  type: "image" | "video" | "audio" | "text"
  licenseTerms: string
  price: number
  revenue: number
  isLicensable: boolean
}

export default function MarketplacePage() {
  const [ipas, setIpas] = useState<IPA[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedIPA, setSelectedIPA] = useState<IPA | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [mintingLoading, setMintingLoading] = useState(false)
 const {openAccountModal}=useAccountModal()
 const {openChainModal}=useChainModal()
  // Optimized search
  const [searchResult, handleSearch] = useOptimizedSearch(ipas, {
    keys: ["title", "creator", "licenseTerms"],
    enableFuzzySearch: true,
    maxResults: 50,
    debounceMs: 300,
  })

const get_token_from_yakoa = async (tokenId: string) => {
  try{
  const response = await fetch('/api/yakoa/get-token', {
    method: 'GET',
    body: JSON.stringify({
      network: "story-aeneid",
      tokenId: tokenId,
    }),
  });
  const data = await response.json();
  console.log("Response from yakoa:", data);
  return data;
  } catch (error) {
    console.error("Error getting token from yakoa:", error);
  }
}


  useEffect(() => {
    const loadIPAs = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate more mock data for testing
      const mockIPAs: IPA[] = Array.from({ length: 100 }, (_, i) => ({
        id: `ipa-${String(i + 1).padStart(3, "0")}`,
        title: `${["Digital Art", "Music Track", "AI Video", "Text Content"][i % 4]} #${i + 1}`,
        creator: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
        image: `/placeholder.svg?height=200&width=200`,
        type: ["image", "video", "audio", "text"][i % 4] as any,
        licenseTerms: ["Commercial use allowed", "Personal use only", "Attribution required"][i % 3],
        price: Number((Math.random() * 2).toFixed(2)),
        revenue: Number((Math.random() * 10).toFixed(2)),
        isLicensable: Math.random() > 0.3,
      }))

      setIpas(mockIPAs)
      setLoading(false)
    }

    loadIPAs()
  }, [])

  const handleMintLicense = async (ipa: IPA) => {
    setMintingLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setMintingLoading(false)
    setSelectedIPA(null)
  }

  // Apply filters
  const filteredResults = searchResult.results.filter((ipa) => typeFilter === "all" || ipa.type === typeFilter)

  const ListItem = ({ index, style }: { index: number; style: any }) => {
    const ipa = filteredResults[index]
    return (
      <div style={style} className="px-4">
        <Card
          className="bg-gray-800 border-gray-700 hover:border-orange-500 transition-colors cursor-pointer h-20"
          onClick={() => setSelectedIPA(ipa)}
        >
          <CardContent className="p-4 flex items-center space-x-4">
            <img src={ipa.image || "/placeholder.svg"} alt={ipa.title} className="w-12 h-12 object-cover rounded-lg" />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">{ipa.title}</h3>
              <p className="text-gray-400 text-sm truncate">{ipa.creator}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
                {ipa.type.toUpperCase()}
              </Badge>
              <span className="text-orange-500 font-semibold">{ipa.price} ETH</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading marketplace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
          <p className="text-gray-400">Discover and license intellectual property assets</p>
        </div>
        <Button 
          onClick={openAccountModal} 
          className="bg-orange-500 hover:bg-orange-600"
        >
          Account
        </Button>
      </div>

      <Tabs defaultValue="platform" className="mb-6">
        <TabsList className="bg-gray-800 border-orange-500/20">
          <TabsTrigger value="platform" className="data-[state=active]:bg-orange-500">
            Platform IPAs
          </TabsTrigger>
          <TabsTrigger value="story" className="data-[state=active]:bg-orange-500">
            Story Network
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search IPAs..."
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700"
              />
              {searchResult.isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="loading-spinner w-4 h-4"></div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-orange-500" : ""}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-orange-500" : ""}
                >
                  <LucideList className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-400">
            Showing {filteredResults.length} of {ipas.length} IPAs
            {searchResult.searchTerm && ` for "${searchResult.searchTerm}"`}
          </div>

          {/* IPAs Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredResults.map((ipa) => (
                <Card
                  key={ipa.id}
                  className="bg-gray-800 border-gray-700 hover:border-orange-500 transition-colors cursor-pointer"
                  onClick={() => setSelectedIPA(ipa)}
                >
                  <CardHeader className="p-4">
                    <img
                      src={ipa.image || "/placeholder.svg"}
                      alt={ipa.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <CardTitle className="text-white text-lg">{ipa.title}</CardTitle>
                    <p className="text-gray-400 text-sm">{ipa.creator}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
                        {ipa.type.toUpperCase()}
                      </Badge>
                      <span className="text-orange-500 font-semibold">{ipa.price} ETH</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">ID: {ipa.id}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="h-96">
              <VirtualList width={"100%"} height={384} itemCount={filteredResults.length} itemSize={88} itemData={filteredResults}>
                {ListItem}
              </VirtualList>
            </div>
          )}
        </TabsContent>

        <TabsContent value="story">
          <div className="text-center py-12">
            <p className="text-gray-400">Story Network integration coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* IPA Details Dialog */}
      <Dialog open={!!selectedIPA} onOpenChange={() => setSelectedIPA(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedIPA?.title}</DialogTitle>
          </DialogHeader>

          {selectedIPA && (
            <div className="space-y-6">
              <img
                src={selectedIPA.image || "/placeholder.svg"}
                alt={selectedIPA.title}
                className="w-full h-64 object-cover rounded-lg"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Creator</h4>
                  <p className="text-white">{selectedIPA.creator}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Type</h4>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
                    {selectedIPA.type.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Price</h4>
                  <p className="text-white">{selectedIPA.price} ETH</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Revenue</h4>
                  <p className="text-white">{selectedIPA.revenue} ETH</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">License Terms</h4>
                <p className="text-white bg-gray-900 p-3 rounded-lg">{selectedIPA.licenseTerms}</p>
              </div>

              {selectedIPA.isLicensable && (
                <div className="flex space-x-4">
                  <Button
                    onClick={() => handleMintLicense(selectedIPA)}
                    disabled={mintingLoading}
                    className="bg-orange-500 hover:bg-orange-600 flex-1"
                  >
                    {mintingLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="loading-spinner w-4 h-4"></div>
                        <span>Minting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Coins className="w-4 h-4" />
                        <span>Mint License Token</span>
                      </div>
                    )}
                  </Button>
                  <Button variant="outline" className="border-gray-600">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
