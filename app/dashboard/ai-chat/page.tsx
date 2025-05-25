"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, ImageIcon, Video, Music, Plus, Download } from "lucide-react"

interface GeneratedContent {
  id: string
  type: "image" | "video" | "audio"
  prompt: string
  url: string
  timestamp: Date
}

export default function AIChatPage() {
  const [prompt, setPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([])
  const [activeTab, setActiveTab] = useState("image")

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setGenerating(true)

    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const newContent: GeneratedContent = {
      id: Date.now().toString(),
      type: activeTab as "image" | "video" | "audio",
      prompt,
      url: `/placeholder.svg?height=300&width=300`,
      timestamp: new Date(),
    }

    setGeneratedContent((prev) => [newContent, ...prev])
    setPrompt("")
    setGenerating(false)
  }

  const handleRegisterAsIPA = async (content: GeneratedContent) => {
    // Simulate IPA registration
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // Show success message and redirect to Add IPA page with pre-filled data
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">AI Content Generator</h1>
        <p className="text-gray-400">Generate images, videos, and audio using AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generation Panel */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                  <TabsTrigger value="image" className="data-[state=active]:bg-orange-500">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="video" className="data-[state=active]:bg-orange-500">
                    <Video className="w-4 h-4 mr-2" />
                    Video
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="data-[state=active]:bg-orange-500">
                    <Music className="w-4 h-4 mr-2" />
                    Audio
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Describe what you want to create
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Enter your ${activeTab} generation prompt...`}
                    className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {generating ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="w-4 h-4" />
                      <span>Generate {activeTab}</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generated Content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Generated Content</h2>
            <p className="text-gray-400">Your AI-generated content will appear here</p>
          </div>

          {generatedContent.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-12 text-center">
                <div className="text-gray-500 mb-4">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No content generated yet</p>
                  <p className="text-sm">Start by entering a prompt and clicking generate</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {generatedContent.map((content) => (
                <Card key={content.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
                            {content.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-500">{content.timestamp.toLocaleString()}</span>
                        </div>

                        <p className="text-white mb-4">{content.prompt}</p>

                        <div className="bg-gray-900 rounded-lg p-4 mb-4">
                          {content.type === "image" && (
                            <img
                              src={content.url || "/placeholder.svg"}
                              alt="Generated content"
                              className="w-full max-w-md rounded-lg"
                            />
                          )}
                          {content.type === "video" && (
                            <div className="w-full max-w-md h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Video className="w-12 h-12 text-gray-500" />
                              <span className="ml-2 text-gray-500">Video Preview</span>
                            </div>
                          )}
                          {content.type === "audio" && (
                            <div className="w-full max-w-md h-24 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Music className="w-8 h-8 text-gray-500" />
                              <span className="ml-2 text-gray-500">Audio Preview</span>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            onClick={() => handleRegisterAsIPA(content)}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Register as IPA
                          </Button>
                          <Button variant="outline" className="border-gray-600">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
