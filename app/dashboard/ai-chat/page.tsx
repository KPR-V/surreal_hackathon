"use client"
import { useEffect, useState } from "react"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Send, ImageIcon, Video, Music, Plus, Download, Share2, Upload, X } from "lucide-react"
import axios from "axios"
import { Buffer } from "buffer"
import { useAccountModal } from "@tomo-inc/tomo-evm-kit"
interface GeneratedContent {
  id: string;
  type: "image" | "video" | "audio";
  prompt: string;
  url: string;
  timestamp: Date;
  metadata?: {
    apiUsed?: string;
    jobId?: string;
    generationTime?: string;
    videoFrames?: string;
    videoFPS?: string;
    samplingRate?: string;
    maxTokens?: string;
    conditioningMelody?: string;
  };
}

export default function AIChatPage() {
  const [prompt, setPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [generatingAudio, setGeneratingAudio] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([])
  const [activeTab, setActiveTab] = useState("image")
  const [imageModels, setImageModels] = useState<string[]>([])
  const{openAccountModal}=useAccountModal()
  const [selectedImageModel, setSelectedImageModel] = useState<string>("")
  


  // Video models
  const videoModels = [
    { id: "cogvideox", name: "CogVideoX" },
    { id: "wanx", name: "WanX" }
  ];
  const [selectedVideoModel, setSelectedVideoModel] = useState("cogvideox");
  
  // Audio settings
  const [audioSettings, setAudioSettings] = useState({
    samplingRate: 32000,
    maxTokens: 256,
    conditioningAudio: null as File | null
  });
  
  const MAX_CHARS = 1000;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    if (input.length <= MAX_CHARS) {
      setPrompt(input);
    }
  };

  useEffect(() => {
    fetchImageModels();
  }, []);

  const fetchImageModels = async () => {
    try {
      const response = await axios.get("/api/image/models");
      const data = response.data.data.models;
      setImageModels(data);
      if (data.length > 0) {
        setSelectedImageModel(data[0]);
      }
    } catch (error) {
      console.error("Error fetching image models:", error);
    }
  }; 

  // Audio file upload handler
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        alert('Please select a valid audio file');
        return;
      }
      // Validate file size (max 30 seconds, roughly 5MB for WAV)
      if (file.size > 5 * 1024 * 1024) {
        alert('Audio file should be under 5MB (approximately 30 seconds)');
        return;
      }
      setAudioSettings(prev => ({ ...prev, conditioningAudio: file }));
    }
  };

  const removeAudioFile = () => {
    setAudioSettings(prev => ({ ...prev, conditioningAudio: null }));
  };

  // Upload audio file to get URL
  const uploadAudioFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', file);
    
    // You'll need to create an upload endpoint or use a file hosting service
    // For now, we'll return null to indicate no conditioning audio
    // In production, you'd upload to your server or cloud storage
    return '';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
  
    try {
      let response: Response;
      let apiUsed = 'primary';
  
      // 1. First, try your primary API endpoint
      response = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedImageModel,   
        }),
      });
  
      // 2. If primary API fails, try the ModelsLab standard fallback API route
      if (!response.ok) {
        console.warn(`Primary API failed: ${response.status}. Trying ModelsLab standard fallback...`);
        apiUsed = 'modelslab-standard';
        
        response = await fetch("/api/image/generate-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            model: selectedImageModel,
          }),
        });
  
        // 3. If standard ModelsLab also fails, try the Real-Time API
        if (!response.ok) {
          console.warn(`ModelsLab standard API failed: ${response.status}. Trying Real-Time API...`);
          apiUsed = 'modelslab-realtime';
          
          response = await fetch("/api/image/generate-realtime", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              model: selectedImageModel,
            }),
          });
  
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`All APIs failed. Real-Time API error: ${response.status} - ${errorText}`);
          }
        }
      }
  
      // 4. Read buffer and convert to data URL
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const imageUrl = `data:image/png;base64,${base64}`;
  
      // 5. Grab job ID and generation time if available
      const jobId = response.headers.get("Job-Offer-Id") ?? "unknown";
      const generationTime = response.headers.get("Generation-Time");
  
      // 6. Build new content item
      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        type: "image",
        prompt,
        url: imageUrl,
        timestamp: new Date(),
        // Optional: Add metadata about which API was used
        metadata: {
          apiUsed,
          jobId,
          generationTime: generationTime ? `${generationTime}s` : undefined
        }
      };
  
      // 7. Prepend it to your list
      setGeneratedContent((prev) => [newContent, ...prev]);
  
      // 8. Clear prompt
      setPrompt("");
  
      // 9. Optional: Log which API was successful
      console.log(`✅ Image generated successfully using: ${apiUsed}`);
  
    } catch (err) {
      console.error("❌ Error during image generation:", err);
      // You might want to show an error message to the user here
    } finally {
      setGenerating(false);
    }
  };

  // Video generation function
  const handleVideoGenerate = async () => {
    if (!prompt.trim()) return;
    setGeneratingVideo(true);

    try {
      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedVideoModel,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Video generation failed: ${response.status} - ${errorText}`);
      }

      // Read buffer and convert to data URL
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const videoUrl = `data:video/mp4;base64,${base64}`;

      // Grab metadata from headers
      const jobId = response.headers.get("Job-Offer-Id") ?? "unknown";
      const generationTime = response.headers.get("Generation-Time");
      const videoFrames = response.headers.get("Video-Frames") || undefined;
      const videoFPS = response.headers.get("Video-FPS");

      // Build new content item
      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        type: "video",
        prompt,
        url: videoUrl,
        timestamp: new Date(),
        metadata: {
          apiUsed: 'modelslab-video',
          jobId,
          generationTime: generationTime ? `${generationTime}s` : undefined,
          videoFrames,
          videoFPS: videoFPS ? `${videoFPS} fps` : undefined
        }
      };

      // Prepend it to your list
      setGeneratedContent((prev) => [newContent, ...prev]);

      // Clear prompt
      setPrompt("");

      console.log(`✅ Video generated successfully`);

    } catch (err) {
      console.error("❌ Error during video generation:", err);
      // Show error message to user
    } finally {
      setGeneratingVideo(false);
    }
  };

  // New audio generation function
  const handleAudioGenerate = async () => {
    if (!prompt.trim()) return;
    setGeneratingAudio(true);

    try {
      let initAudioUrl = null;
      
      // Upload conditioning audio if provided
      if (audioSettings.conditioningAudio) {
        // In a real implementation, you'd upload the file to your server or cloud storage
        // For now, we'll skip conditioning audio
        console.log('Conditioning audio file selected but upload not implemented');
      }

      const response = await fetch("/api/audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          init_audio: initAudioUrl,
          sampling_rate: audioSettings.samplingRate,
          max_new_token: audioSettings.maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Audio generation failed: ${response.status} - ${errorText}`);
      }

      // Read buffer and convert to data URL
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const audioUrl = `data:audio/wav;base64,${base64}`;

      // Grab metadata from headers
      const jobId = response.headers.get("Job-Offer-Id") ?? "unknown";
      const generationTime = response.headers.get("Generation-Time");
      const samplingRate = response.headers.get("Sampling-Rate");
      const maxTokens = response.headers.get("Max-Tokens") || undefined;

      // Build new content item
      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        type: "audio",
        prompt,
        url: audioUrl,
        timestamp: new Date(),
        metadata: {
          apiUsed: 'modelslab-musicgen',
          jobId,
          generationTime: generationTime ? `${generationTime}s` : undefined,
          samplingRate: samplingRate ? `${samplingRate} Hz` : undefined,
          maxTokens,
          conditioningMelody: audioSettings.conditioningAudio ? 'Yes' : 'No'
        }
      };

      // Prepend it to your list
      setGeneratedContent((prev) => [newContent, ...prev]);

      // Clear prompt
      setPrompt("");

      console.log(`✅ Audio generated successfully`);

    } catch (err) {
      console.error("❌ Error during audio generation:", err);
      // Show error message to user
    } finally {
      setGeneratingAudio(false);
    }
  };
  
  const handleRegisterAsIPA = async (content: GeneratedContent) => {
    // Simulate IPA registration
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // Show success message and redirect to Add IPA page with pre-filled data
  }

  const handleDownload = (contentUrl: string, contentType: "image" | "video" | "audio") => {
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = contentUrl;
    let extension = "png";
    if (contentType === "video") extension = "mp4";
    if (contentType === "audio") extension = "wav";
    a.download = `ai-generated-${contentType}-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async (contentUrl: string, prompt: string, contentType: "image" | "video" | "audio") => {
    if (navigator.share) {
      try {
        // Convert base64 to blob for sharing
        const response = await fetch(contentUrl);
        const blob = await response.blob();
        let mimeType = "image/png";
        let extension = "png";
        
        if (contentType === "video") {
          mimeType = "video/mp4";
          extension = "mp4";
        } else if (contentType === "audio") {
          mimeType = "audio/wav";
          extension = "wav";
        }
        
        const file = new File([blob], `ai-generated-${contentType}-${Date.now()}.${extension}`, { type: mimeType });
        
        await navigator.share({
          title: `AI Generated ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
          text: `Check out this AI-generated ${contentType}: ${prompt}`,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback for browsers that support clipboard but not share
        copyContentUrlToClipboard(contentUrl);
      }
    } else {
      // Fallback for browsers that don't support sharing
      copyContentUrlToClipboard(contentUrl);
    }
  };

  const copyContentUrlToClipboard = (contentUrl: string) => {
    // Copy content URL to clipboard
    navigator.clipboard.writeText(contentUrl)
      .then(() => alert('Content URL copied to clipboard!'))
      .catch(err => console.error('Failed to copy URL:', err));
  };

  return (
    <div className="p-4 max-w-6xl mx-auto h-screen overflow-hidden">
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

      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
        {/* Grid with section headers aligned at the same level */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-white mb-2">Create Content</h2>
          <Card className="bg-gray-800 border-gray-700 h-[calc(100vh-180px)] flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
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

              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-300">
                      Describe what you want to create
                    </label>
                    <span className="text-xs text-gray-400">
                      {prompt.length}/{MAX_CHARS}
                    </span>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder={
                      activeTab === "audio" 
                        ? "e.g., sitar, tabla, flute, Indian classical, fusion, meditative, G# minor, 96 bpm"
                        : `Enter your ${activeTab} generation prompt...`
                    }
                    maxLength={MAX_CHARS}
                    className="w-full flex-1 min-h-[150px] p-2 overflow-auto hide-scrollbar bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:border-orange-500 focus:outline-none"
                  />
                </div>
                
                {activeTab === "image" && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">
                      Select Image Model
                    </label>
                    <select 
                      value={selectedImageModel}
                      onChange={(e) => setSelectedImageModel(e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    >
                      {imageModels.length > 0 ? (
                        imageModels.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))
                      ) : (
                        <option value="">Loading models...</option>
                      )}
                    </select>
                  </div>
                )}

                {activeTab === "video" && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">
                      Select Video Model
                    </label>
                    <select 
                      value={selectedVideoModel}
                      onChange={(e) => setSelectedVideoModel(e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    >
                      {videoModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {activeTab === "audio" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-1 block">
                          Sampling Rate
                        </label>
                        <select 
                          value={audioSettings.samplingRate}
                          onChange={(e) => setAudioSettings(prev => ({ ...prev, samplingRate: parseInt(e.target.value) }))}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none text-sm"
                        >
                          <option value={16000}>16kHz</option>
                          <option value={22050}>22kHz</option>
                          <option value={32000}>32kHz</option>
                          <option value={44100}>44kHz</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-1 block">
                          Max Tokens
                        </label>
                        <select 
                          value={audioSettings.maxTokens}
                          onChange={(e) => setAudioSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none text-sm"
                        >
                          <option value={256}>256</option>
                          <option value={512}>512</option>
                          <option value={768}>768</option>
                          <option value={1024}>1024</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-1 block">
                        Conditioning Audio (Optional)
                      </label>
                      {!audioSettings.conditioningAudio ? (
                        <div className="relative">
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleAudioUpload}
                            className="hidden"
                            id="audio-upload"
                          />
                          <label
                            htmlFor="audio-upload"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-pointer hover:bg-gray-600 transition-colors flex items-center justify-center text-sm"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload audio file (max 30s)
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2 bg-gray-700 border border-gray-600 rounded-lg">
                          <span className="text-sm text-white truncate">
                            {audioSettings.conditioningAudio.name}
                          </span>
                          <Button
                            onClick={removeAudioFile}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={
                    activeTab === "image" ? handleGenerate : 
                    activeTab === "video" ? handleVideoGenerate : 
                    handleAudioGenerate
                  }
                  disabled={
                    (activeTab === "image" && generating) || 
                    (activeTab === "video" && generatingVideo) || 
                    (activeTab === "audio" && generatingAudio) ||
                    !prompt.trim()
                  }
                  className="w-full bg-orange-500 hover:bg-orange-600 mt-auto"
                >
                  {activeTab === "image" && generating ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>Generating Image...</span>
                    </div>
                  ) : activeTab === "video" && generatingVideo ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>Generating Video...</span>
                    </div>
                  ) : activeTab === "audio" && generatingAudio ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>Generating Audio...</span>
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
        <div className="lg:col-span-2 overflow-hidden">
          <h2 className="text-xl font-semibold text-white mb-2">Generated Content</h2>
          
          <div className="overflow-auto hide-scrollbar h-[calc(100vh-180px)]">
            {generatedContent.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500 mb-4">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No content generated yet</p>
                    <p className="text-sm">Start by entering a prompt and clicking generate</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {generatedContent.map((content) => (
                  <Card key={content.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
                              {content.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">{content.timestamp.toLocaleString()}</span>
                            {content.metadata?.generationTime && (
                              <span className="text-xs text-gray-400">
                                Generated in {content.metadata.generationTime}
                              </span>
                            )}
                            {content.metadata?.videoFPS && (
                              <span className="text-xs text-gray-400">
                                {content.metadata.videoFPS}
                              </span>
                            )}
                            {content.metadata?.samplingRate && (
                              <span className="text-xs text-gray-400">
                                {content.metadata.samplingRate}
                              </span>
                            )}
                          </div>

                          <p className="text-white mb-3 text-sm">{content.prompt}</p>

                          <div className="bg-gray-900 rounded-lg p-3 mb-3 flex justify-center">
                            {content.type === "image" && (
                              <div className="flex justify-center items-center overflow-hidden">
                                <img
                                  src={content.url || "/placeholder.svg"}
                                  alt="Generated content"
                                  className="w-full object-contain max-h-[300px] rounded-lg"
                                />
                              </div>
                            )}
                            {content.type === "video" && (
                              <div className="w-full max-w-md">
                                <video
                                  src={content.url}
                                  controls
                                  loop
                                  muted
                                  className="w-full h-auto rounded-lg"
                                  preload="metadata"
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                            )}
                            {content.type === "audio" && (
                              <div className="w-full max-w-md">
                                <audio
                                  src={content.url}
                                  controls
                                  className="w-full"
                                  preload="metadata"
                                >
                                  Your browser does not support the audio element.
                                </audio>
                                <div className="mt-2 text-center">
                                  <div className="flex items-center justify-center text-gray-400">
                                    <Music className="w-4 h-4 mr-2" />
                                    <span className="text-sm">AI Generated Music</span>
                                  </div>
                                  {content.metadata?.conditioningMelody === 'Yes' && (
                                    <span className="text-xs text-orange-400">With conditioning melody</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => handleRegisterAsIPA(content)}
                              className="bg-orange-500 hover:bg-orange-600 text-xs py-1 h-8"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Register as IPA
                            </Button>
                            <Button 
                              variant="outline" 
                              className="border-gray-600 text-xs py-1 h-8"
                              onClick={() => handleDownload(content.url, content.type)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download {content.type === "video" ? "MP4" : content.type === "audio" ? "WAV" : "PNG"}
                            </Button>
                            <Button 
                              variant="outline" 
                              className="border-gray-600 text-xs py-1 h-8"
                              onClick={() => handleShare(content.url, content.prompt, content.type)}
                            >
                              <Share2 className="w-3 h-3 mr-1" />
                              Share
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
    </div>
  )
}
