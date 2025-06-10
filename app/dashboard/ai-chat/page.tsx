"use client"
import { useEffect, useState } from "react"
import { Send, ImageIcon, Video, Music, Plus, Download, Share2, ChevronDown, Settings, Wand2, Info } from "lucide-react"
import axios from "axios"
import { Buffer } from "buffer"
import { useAccountModal } from "@tomo-inc/tomo-evm-kit"
import { AnimatedBackground } from "../../../components/animated-background"
import { RegistrationModal } from "./registrationModal";

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
  const [selectedImageModel, setSelectedImageModel] = useState<string>("")
  const [showModels, setShowModels] = useState(false)
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [showAudioSettings, setShowAudioSettings] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [showTooltip, setShowTooltip] = useState<string | null>(null)
  const [placeholderTransition, setPlaceholderTransition] = useState(false)
  const [isTextareaFocused, setIsTextareaFocused] = useState(false)
  const [isUserTyping, setIsUserTyping] = useState(false)
  const { openAccountModal } = useAccountModal()
  
  // Audio settings
  const [audioSettings, setAudioSettings] = useState({
    samplingRate: 32000,
    maxTokens: 256,
    conditioningAudio: null as File | null
  });

  // Video models
  const videoModels = [
    { id: "cogvideox", name: "CogVideoX" },
    { id: "wanx", name: "WanX" }
  ];
  const [selectedVideoModel, setSelectedVideoModel] = useState("cogvideox");

  // Video settings
  const [videoSettings, setVideoSettings] = useState({
    videoFrames: 25,
    videoFPS: 24,
    duration: 5, // in seconds
    resolution: "720p"
  });

  const [showVideoSettings, setShowVideoSettings] = useState(false);

  const MAX_CHARS = 1000;

  // Type-specific placeholders
  const placeholdersByType = {
    image: [
      "A majestic dragon soaring through ethereal clouds...",
      "Cyberpunk cityscape with neon lights and flying cars...",
      "A mystical forest with glowing mushrooms at twilight...",
      "Abstract art with flowing liquid gold and silver...",
      "A serene mountain lake reflecting the aurora borealis...",
      "Steampunk mechanical butterfly with intricate gears...",
    ],
    video: [
      "Time-lapse of cherry blossoms blooming in spring...",
      "A robot gracefully dancing in a futuristic ballroom...",
      "Ocean waves crashing against cliffs in slow motion...",
      "A phoenix rising from flames with particle effects...",
      "Northern lights dancing over a snowy landscape...",
      "A magical portal opening in an enchanted forest...",
    ],
    audio: [
      "Peaceful piano melody with soft rain sounds...",
      "Epic orchestral theme for a fantasy adventure...",
      "Ambient electronic soundscape for meditation...",
      "Upbeat jazz fusion with saxophone and drums...",
      "Ethereal choir harmonies with celestial tones...",
      "Lo-fi hip hop beats with vinyl crackle texture...",
    ]
  };

  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  // Enhanced placeholder animation control
  useEffect(() => {
    // Don't animate placeholders if user is typing, focused, or generating
    if (isTextareaFocused || isUserTyping || generating || generatingVideo || generatingAudio || prompt.length > 0) {
      return;
    }

    const interval = setInterval(() => {
      setPlaceholderTransition(true);
      setTimeout(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholdersByType[activeTab as keyof typeof placeholdersByType].length);
        setPlaceholderTransition(false);
      }, 300);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [activeTab, isTextareaFocused, isUserTyping, generating, generatingVideo, generatingAudio, prompt.length]);

  // Reset placeholder index when switching tabs
  useEffect(() => {
    setCurrentPlaceholder(0);
    setPlaceholderTransition(false);
  }, [activeTab]);

  // Typing detection
  useEffect(() => {
    if (prompt.length > 0) {
      setIsUserTyping(true);
      const timer = setTimeout(() => {
        setIsUserTyping(false);
      }, 2000); // Stop considering user as typing after 2 seconds of no changes
      
      return () => clearTimeout(timer);
    } else {
      setIsUserTyping(false);
    }
  }, [prompt]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    if (input.length <= MAX_CHARS) {
      setPrompt(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleFocus = () => {
    setIsTextareaFocused(true);
  };

  const handleBlur = () => {
    setIsTextareaFocused(false);
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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    if (!hasGenerated) {
      setHasGenerated(true);
    }
    
    if (activeTab === "image") {
      await handleImageGenerate();
    } else if (activeTab === "video") {
      await handleVideoGenerate();
    } else {
      await handleAudioGenerate();
    }
  };

  const handleImageGenerate = async () => {
    setGenerating(true);
    try {
      let response: Response;
      let apiUsed = 'primary';

      response = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedImageModel,   
        }),
      });

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

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const imageUrl = `data:image/png;base64,${base64}`;

      const jobId = response.headers.get("Job-Offer-Id") ?? "unknown";
      const generationTime = response.headers.get("Generation-Time");

      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        type: "image",
        prompt,
        url: imageUrl,
        timestamp: new Date(),
        metadata: {
          apiUsed,
          jobId,
          generationTime: generationTime ? `${generationTime}s` : undefined
        }
      };

      setGeneratedContent((prev) => [newContent, ...prev]);
      setPrompt("");
      console.log(`✅ Image generated successfully using: ${apiUsed}`);

    } catch (err) {
      console.error("❌ Error during image generation:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleVideoGenerate = async () => {
    setGeneratingVideo(true);
    try {
      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedVideoModel,
          frames: videoSettings.videoFrames,
          fps: videoSettings.videoFPS,
          resolution: videoSettings.resolution,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Video generation failed: ${response.status} - ${errorText}`);
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const videoUrl = `data:video/mp4;base64,${base64}`;

      const jobId = response.headers.get("Job-Offer-Id") ?? "unknown";
      const generationTime = response.headers.get("Generation-Time");
      const videoFrames = response.headers.get("Video-Frames") || videoSettings.videoFrames.toString();
      const videoFPS = response.headers.get("Video-FPS") || videoSettings.videoFPS.toString();

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
          videoFPS: `${videoFPS} fps`
        }
      };

      setGeneratedContent((prev) => [newContent, ...prev]);
      setPrompt("");
      console.log(`✅ Video generated successfully`);

    } catch (err) {
      console.error("❌ Error during video generation:", err);
    } finally {
      setGeneratingVideo(false);
    }
  };

  const handleAudioGenerate = async () => {
    setGeneratingAudio(true);
    try {
      let initAudioUrl = null;
      
      if (audioSettings.conditioningAudio) {
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

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const audioUrl = `data:audio/wav;base64,${base64}`;

      const jobId = response.headers.get("Job-Offer-Id") ?? "unknown";
      const generationTime = response.headers.get("Generation-Time");
      const samplingRate = response.headers.get("Sampling-Rate");
      const maxTokens = response.headers.get("Max-Tokens") || undefined;

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

      setGeneratedContent((prev) => [newContent, ...prev]);
      setPrompt("");
      console.log(`✅ Audio generated successfully`);

    } catch (err) {
      console.error("❌ Error during audio generation:", err);
    } finally {
      setGeneratingAudio(false);
    }
  };

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedContentForRegistration, setSelectedContentForRegistration] = useState<GeneratedContent | null>(null);

  const handleRegisterAsIPA = async (content: GeneratedContent) => {
    setSelectedContentForRegistration(content);
    setShowRegistrationModal(true);
  };

  const handleRegistrationSubmit = async (registrationData: any) => {
    try {
      console.log("Registration data:", registrationData);
      
      // Here you would call the appropriate Story Protocol function based on registrationType
      const { content, formData, registrationType } = registrationData;
      
      switch (registrationType) {
        case "mintAndRegisterWithPIL":
          // Call mintAndRegisterIpAssetWithPilTerms
          console.log("Minting NFT, registering IP, and attaching PIL terms...");
          break;
        case "mintAndRegister":
          // Call mintAndRegisterIpAsset (without PIL)
          console.log("Minting NFT and registering IP...");
          break;
        case "registerWithPIL":
          // Call registerIpAsset then attachLicenseTerms
          console.log("Registering IP and attaching PIL terms...");
          break;
        case "registerOnly":
          // Call registerIpAsset only
          console.log("Registering IP only...");
          break;
      }
      
      // Show success message
      alert("Registration initiated successfully!");
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    }
  };

  const handleDownload = (contentUrl: string, contentType: "image" | "video" | "audio") => {
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
        navigator.clipboard.writeText(contentUrl)
          .then(() => alert('Content URL copied to clipboard!'))
          .catch(err => console.error('Failed to copy URL:', err));
      }
    } else {
      navigator.clipboard.writeText(contentUrl)
        .then(() => alert('Content URL copied to clipboard!'))
        .catch(err => console.error('Failed to copy URL:', err));
    }
  };

  const getTypeIcon = () => {
    switch (activeTab) {
      case "image": return <ImageIcon className="w-4 h-4" />;
      case "video": return <Video className="w-4 h-4" />;
      case "audio": return <Music className="w-4 h-4" />;
      default: return <ImageIcon className="w-4 h-4" />;
    }
  };

  const getActiveColor = () => {
    switch (activeTab) {
      case "image": return "text-pink-400";
      case "video": return "text-blue-400";
      case "audio": return "text-purple-400";
      default: return "text-pink-400";
    }
  };

  const getLoadingText = () => {
    if (activeTab === "image" && generating) return "Creating image...";
    if (activeTab === "video" && generatingVideo) return "Creating video...";
    if (activeTab === "audio" && generatingAudio) return "Creating audio...";
    return "Generate";
  };

  const isLoading = generating || generatingVideo || generatingAudio;
  const currentPlaceholderText = placeholdersByType[activeTab as keyof typeof placeholdersByType][currentPlaceholder];

  // Function to get grid layout classes based on content count
  const getGridLayoutClasses = (count: number) => {
    if (count === 1) {
      return "grid grid-cols-1 place-items-center w-full max-w-md mx-auto";
    } else if (count === 2) {
      return "grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto";
    } else {
      return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mx-auto";
    }
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* 80% Screen Width Container */}
      <div className="relative z-10 p-6 w-4/5 mx-auto">
        {/* Top Header Bar */}
        <div className="absolute top-6 left-0 right-0 flex justify-between items-center z-20">
          {/* Mint Matrix Text */}
          <h1 className="text-3xl font-bold text-white font-redHatDisplay">
            Mint <span className="text-transparent font-satisfy font-thin" style={{ WebkitTextStroke: '1px white'}}>Matrix</span>
          </h1>
          
          {/* Account Button */}
          <button 
            onClick={openAccountModal} 
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg text-white transition-all duration-200 text-sm font-medium"
          >
            Account
          </button>
        </div>

        {/* Header - Only show initially, hide once generation starts */}
        {!hasGenerated && (
          <div className="text-center mt-20 mb-8 transition-all duration-700 ease-in-out">
            <h1 className="font-light text-white text-5xl transition-all duration-700">
              Generative AI
            </h1>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`transition-all duration-700 ease-in-out ${
          hasGenerated 
            ? 'mt-24 max-w-3xl mx-auto' 
            : 'mt-16 max-w-2xl mx-auto'
        }`}>
          
          {/* Prompt Input Area */}
          <div className={`bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-700 relative z-10 ${
            hasGenerated ? 'p-3' : 'p-6'
          }`}>
            
            {/* Text Input */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={currentPlaceholderText}
                className={`w-full bg-transparent border-none text-white placeholder-white/40 resize-none focus:outline-none text-[15px] leading-relaxed transition-all duration-300 smooth-caret ${
                  hasGenerated 
                    ? 'pl-4 pr-20 py-3 min-h-[50px]' 
                    : 'pl-4 pr-4 py-6 min-h-[120px]'
                } ${placeholderTransition && !isTextareaFocused && !isUserTyping && prompt.length === 0 ? 'placeholder-slide-up' : 'placeholder-slide-in'}`}
                maxLength={MAX_CHARS}
                rows={hasGenerated ? 1 : 4}
              />
              
              {/* Bottom Controls */}
              <div className="flex items-center justify-between mt-3">
                {/* Left Side - Type Selector */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <button
                      onClick={() => setShowTypeSelector(!showTypeSelector)}
                      className={`flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-sm transition-all duration-200 ${getActiveColor()}`}
                    >
                      {getTypeIcon()}
                      <span className="capitalize">{activeTab}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    {showTypeSelector && (
                      <div className={`absolute ${hasGenerated ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[150px] shadow-xl z-50`}>
                        {[
                          { key: "image", icon: ImageIcon, label: "Image", color: "text-pink-400" },
                          { key: "video", icon: Video, label: "Video", color: "text-blue-400" },
                          { key: "audio", icon: Music, label: "Audio", color: "text-purple-400" }
                        ].map(({ key, icon: Icon, label, color }) => (
                          <button
                            key={key}
                            onClick={() => {
                              setActiveTab(key);
                              setShowTypeSelector(false);
                            }}
                            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                              activeTab === key
                                ? `bg-white/10 ${color}`
                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Audio Settings Button - Only for audio mode */}
                  {activeTab === "audio" && (
                    <div className="relative">
                      <button
                        onClick={() => setShowAudioSettings(!showAudioSettings)}
                        className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-sm transition-all duration-200"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      
                      {showAudioSettings && (
                        <div className={`absolute ${hasGenerated ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 bg-neutral-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-5 min-w-[320px] shadow-2xl z-50`}>
                          <div className="flex items-center space-x-2 mb-5">
                            <Settings className="w-4 h-4 text-purple-400" />
                            <h3 className="text-sm font-semibold text-white">Audio Settings</h3>
                          </div>
                          <div className="space-y-5">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-white/80">Sampling Rate</label>
                                <div className="relative">
                                  <button
                                    onMouseEnter={() => setShowTooltip('samplingRate')}
                                    onMouseLeave={() => setShowTooltip(null)}
                                    className="text-white/40 hover:text-purple-400 transition-colors"
                                  >
                                    <Info className="w-4 h-4" />
                                  </button>
                                  {showTooltip === 'samplingRate' && (
                                    <div className="absolute bottom-full right-0 mb-2 bg-neutral-800/95 backdrop-blur-sm border border-white/20 rounded-xl p-3 w-64 text-xs text-white/90 z-60 shadow-xl">
                                      <div className="font-medium text-purple-300 mb-1">Audio Quality Control</div>
                                      Higher rates (44kHz) provide better quality but create larger files. 32kHz offers excellent quality for most applications.
                                    </div>
                                  )}
                                </div>
                              </div>
                              <select 
                                value={audioSettings.samplingRate}
                                onChange={(e) => setAudioSettings(prev => ({ ...prev, samplingRate: parseInt(e.target.value) }))}
                                className="w-full p-3 bg-white/[0.02] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all"
                              >
                                <option value={16000} className="bg-neutral-800">16kHz - Basic Quality</option>
                                <option value={22050} className="bg-neutral-800">22kHz - Good Quality</option>
                                <option value={32000} className="bg-neutral-800">32kHz - High Quality</option>
                                <option value={44100} className="bg-neutral-800">44kHz - Premium Quality</option>
                              </select>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-white/80">Audio Length</label>
                                <div className="relative">
                                  <button
                                    onMouseEnter={() => setShowTooltip('maxTokens')}
                                    onMouseLeave={() => setShowTooltip(null)}
                                    className="text-white/40 hover:text-purple-400 transition-colors"
                                  >
                                    <Info className="w-4 h-4" />
                                  </button>
                                  {showTooltip === 'maxTokens' && (
                                    <div className="absolute bottom-full right-0 mb-2 bg-neutral-800/95 backdrop-blur-sm border border-white/20 rounded-xl p-3 w-64 text-xs text-white/90 z-60 shadow-xl">
                                      <div className="font-medium text-purple-300 mb-1">Generation Length</div>
                                      Controls the duration of generated audio. More tokens create longer audio but require more processing time.
                                    </div>
                                  )}
                                </div>
                              </div>
                              <select 
                                value={audioSettings.maxTokens}
                                onChange={(e) => setAudioSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                                className="w-full p-3 bg-white/[0.02] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all"
                              >
                                <option value={256} className="bg-neutral-800">256 tokens - Short (~8 seconds)</option>
                                <option value={512} className="bg-neutral-800">512 tokens - Medium (~16 seconds)</option>
                                <option value={768} className="bg-neutral-800">768 tokens - Long (~24 seconds)</option>
                                <option value={1024} className="bg-neutral-800">1024 tokens - Extended (~32 seconds)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video Settings Button - Only for video mode */}
                  {activeTab === "video" && (
                    <div className="relative">
                      <button
                        onClick={() => setShowVideoSettings(!showVideoSettings)}
                        className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-sm transition-all duration-200"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      
                      {showVideoSettings && (
                        <div className={`absolute ${hasGenerated ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 bg-neutral-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-5 min-w-[320px] shadow-2xl z-50`}>
                          <div className="flex items-center space-x-2 mb-5">
                            <Settings className="w-4 h-4 text-blue-400" />
                            <h3 className="text-sm font-semibold text-white">Video Settings</h3>
                          </div>
                          <div className="space-y-5">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-white/80">Frame Rate (FPS)</label>
                                <div className="relative">
                                  <button
                                    onMouseEnter={() => setShowTooltip('videoFPS')}
                                    onMouseLeave={() => setShowTooltip(null)}
                                    className="text-white/40 hover:text-blue-400 transition-colors"
                                  >
                                    <Info className="w-4 h-4" />
                                  </button>
                                  {showTooltip === 'videoFPS' && (
                                    <div className="absolute bottom-full right-0 mb-2 bg-neutral-800/95 backdrop-blur-sm border border-white/20 rounded-xl p-3 w-64 text-xs text-white/90 z-60 shadow-xl">
                                      <div className="font-medium text-blue-300 mb-1">Video Smoothness</div>
                                      Higher FPS creates smoother motion but requires more processing. 24fps is cinematic, 30fps is standard, 60fps is very smooth.
                                    </div>
                                  )}
                                </div>
                              </div>
                              <select 
                                value={videoSettings.videoFPS}
                                onChange={(e) => setVideoSettings(prev => ({ ...prev, videoFPS: parseInt(e.target.value) }))}
                                className="w-full p-3 bg-white/[0.02] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                              >
                                <option value={12} className="bg-neutral-800">12 FPS - Low Motion</option>
                                <option value={24} className="bg-neutral-800">24 FPS - Cinematic</option>
                                <option value={30} className="bg-neutral-800">30 FPS - Standard</option>
                                <option value={60} className="bg-neutral-800">60 FPS - Smooth</option>
                              </select>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-white/80">Total Frames</label>
                                <div className="relative">
                                  <button
                                    onMouseEnter={() => setShowTooltip('videoFrames')}
                                    onMouseLeave={() => setShowTooltip(null)}
                                    className="text-white/40 hover:text-blue-400 transition-colors"
                                  >
                                    <Info className="w-4 h-4" />
                                  </button>
                                  {showTooltip === 'videoFrames' && (
                                    <div className="absolute bottom-full right-0 mb-2 bg-neutral-800/95 backdrop-blur-sm border border-white/20 rounded-xl p-3 w-64 text-xs text-white/90 z-60 shadow-xl">
                                      <div className="font-medium text-blue-300 mb-1">Video Length Control</div>
                                      Total number of frames to generate. More frames create longer videos but take more time to process.
                                    </div>
                                  )}
                                </div>
                              </div>
                              <select 
                                value={videoSettings.videoFrames}
                                onChange={(e) => setVideoSettings(prev => ({ ...prev, videoFrames: parseInt(e.target.value) }))}
                                className="w-full p-3 bg-white/[0.02] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                              >
                                <option value={25} className="bg-neutral-800">25 frames - Short (~1s at 24fps)</option>
                                <option value={50} className="bg-neutral-800">50 frames - Medium (~2s at 24fps)</option>
                                <option value={75} className="bg-neutral-800">75 frames - Standard (~3s at 24fps)</option>
                                <option value={120} className="bg-neutral-800">120 frames - Long (~5s at 24fps)</option>
                                <option value={150} className="bg-neutral-800">150 frames - Extended (~6s at 24fps)</option>
                              </select>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-white/80">Resolution</label>
                                <div className="relative">
                                  <button
                                    onMouseEnter={() => setShowTooltip('resolution')}
                                    onMouseLeave={() => setShowTooltip(null)}
                                    className="text-white/40 hover:text-blue-400 transition-colors"
                                  >
                                    <Info className="w-4 h-4" />
                                  </button>
                                  {showTooltip === 'resolution' && (
                                    <div className="absolute bottom-full right-0 mb-2 bg-neutral-800/95 backdrop-blur-sm border border-white/20 rounded-xl p-3 w-64 text-xs text-white/90 z-60 shadow-xl">
                                      <div className="font-medium text-blue-300 mb-1">Video Quality</div>
                                      Higher resolutions provide better quality but create larger files and take longer to generate.
                                    </div>
                                  )}
                                </div>
                              </div>
                              <select 
                                value={videoSettings.resolution}
                                onChange={(e) => setVideoSettings(prev => ({ ...prev, resolution: e.target.value }))}
                                className="w-full p-3 bg-white/[0.02] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                              >
                                <option value="480p" className="bg-neutral-800">480p - Basic Quality</option>
                                <option value="720p" className="bg-neutral-800">720p - HD Quality</option>
                                <option value="1080p" className="bg-neutral-800">1080p - Full HD</option>
                              </select>
                            </div>
                            <div className="pt-3 border-t border-white/10">
                              <div className="flex items-center justify-between text-xs text-white/60">
                                <span>Estimated Duration:</span>
                                <span className="text-blue-400 font-medium">
                                  ~{Math.round((videoSettings.videoFrames / videoSettings.videoFPS) * 10) / 10}s
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Side - Model Selector & Generate */}
                <div className="flex items-center space-x-3">
                  {/* Model Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowModels(!showModels)}
                      className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-sm transition-all duration-200"
                    >
                      <Wand2 className="w-4 h-4" />
                      <span>Model</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    {showModels && (
                      <div className={`absolute ${hasGenerated ? 'top-full mt-2' : 'bottom-full mb-2'} right-0 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 min-w-[250px] shadow-xl z-50`}>
                        {activeTab === "image" && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-white/90 mb-3">Image Models</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {imageModels.map((model) => (
                                <button
                                  key={model}
                                  onClick={() => {
                                    setSelectedImageModel(model);
                                    setShowModels(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                    selectedImageModel === model
                                      ? 'bg-pink-500/20 text-pink-300'
                                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                                  }`}
                                >
                                  {model}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {activeTab === "video" && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-white/90 mb-3">Video Models</p>
                            {videoModels.map((model) => (
                              <button
                                key={model.id}
                                onClick={() => {
                                  setSelectedVideoModel(model.id);
                                  setShowModels(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  selectedVideoModel === model.id
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                {model.name}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {activeTab === "audio" && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-white/90 mb-3">Audio Model</p>
                            <div className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                              MusicGen
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isLoading}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500/20 to-blue-500/20 hover:from-pink-500/30 hover:to-blue-500/30 border border-pink-500/30 hover:border-pink-400/50 rounded-lg text-pink-300 hover:text-pink-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-pink-300/30 border-t-pink-300"></div>
                        <span className="text-sm">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span className="text-sm">Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Character Counter */}
              <div className="absolute top-2 right-3 text-xs text-white/20">
                {prompt.length}/{MAX_CHARS}
              </div>
            </div>
          </div>

          {/* Instructions - Always visible below prompt */}
          <div className="text-center mt-4 transition-all duration-700">
            <p className="text-white/40 text-sm mb-2">
              Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">Enter</kbd> to generate • <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">Shift + Enter</kbd> for new line
            </p>
          </div>

         {/* Subtitle - Only when not generated */}
              {!hasGenerated && (
              <div className="text-center mt-8 mb-2 transition-all duration-700">
              <p className="text-base font-light tracking-wide text-white/80">
                Unleash boundless creativity—transform your ideas into breathtaking digital art, immersive imagery with the power of <span className="text-transparent bg-gradient-to-r from-pink-400/80 to-blue-400/80 bg-clip-text">Generative AI</span>
               </p>
              </div>
             )}
        </div>

        {/* Generated Content - Properly Centered with Dynamic Grid */}
        {hasGenerated && (
          <div className="flex justify-center mt-12 animate-fade-in pb-32">
            <div className="w-full max-w-6xl">
              <h2 className="text-xl font-medium text-white/90 mb-6 text-center">Your Creations</h2>
              
              {generatedContent.length === 0 ? (
                <div className="flex justify-center">
                  <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center max-w-2xl">
                    <div className="text-white/50">
                      <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                        {/* Wave-like Loading Animation Dots */}
                        <div className="flex space-x-1.5">
                          <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-wave-bounce"></div>
                          <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-wave-bounce delay-150"></div>
                          <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-wave-bounce delay-300"></div>
                        </div>
                      </div>
                      <p className="text-lg mb-2">Creating your masterpiece...</p>
                      <p className="text-sm text-white/40">{getLoadingText()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className={`${getGridLayoutClasses(generatedContent.length)} transition-all duration-500 ease-in-out`}>
                    {generatedContent.map((content, index) => (
                      <div 
                        key={content.id} 
                        className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.04] transition-all duration-500 animate-slide-up w-full max-w-sm content-card" 
                        style={{ 
                          animationDelay: `${index * 100}ms`,
                          transform: `translateX(0)`,
                          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        {/* Content Display */}
                        <div className="aspect-square bg-black/20 flex items-center justify-center overflow-hidden">
                          {content.type === "image" && (
                            <img
                              src={content.url}
                              alt="Generated content"
                              className="w-full h-full object-cover"
                            />
                          )}
                          {content.type === "video" && (
                            <video
                              src={content.url}
                              controls
                              loop
                              muted
                              className="w-full h-full object-cover"
                              preload="metadata"
                            />
                          )}
                          {content.type === "audio" && (
                            <div className="flex flex-col items-center justify-center text-center p-8">
                              <Music className="w-16 h-16 text-purple-400 mb-4" />
                              <audio
                                src={content.url}
                                controls
                                className="w-full"
                                preload="metadata"
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Content Info */}
                        <div className="p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              content.type === "image" ? "bg-pink-500/20 text-pink-300" :
                              content.type === "video" ? "bg-blue-500/20 text-blue-300" :
                              "bg-purple-500/20 text-purple-300"
                            }`}>
                              {content.type.toUpperCase()}
                            </span>
                            <span className="text-xs text-white/40">
                              {content.timestamp.toLocaleDateString()}
                            </span>
                            {content.metadata?.generationTime && (
                              <span className="text-xs text-white/40">
                                {content.metadata.generationTime}
                              </span>
                            )}
                          </div>

                          <p className="text-white/80 text-sm mb-4 line-clamp-2">{content.prompt}</p>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleRegisterAsIPA(content)}
                              className="bg-gradient-to-r from-pink-500/20 to-blue-500/20 hover:from-pink-500/30 hover:to-blue-500/30 text-pink-300 border border-pink-500/30 text-xs px-3 py-1.5 rounded-full flex-1 transition-all duration-200 flex items-center justify-center space-x-1 relative z-10"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Register IP</span>
                            </button>
                            <button 
                              className="border border-white/20 text-white/60 hover:text-white hover:border-white/30 text-xs px-3 py-1.5 rounded-full transition-all duration-200 relative z-10"
                              onClick={() => handleDownload(content.url, content.type)}
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button 
                              className="border border-white/20 text-white/60 hover:text-white hover:border-white/30 text-xs px-3 py-1.5 rounded-full transition-all duration-200 relative z-10"
                              onClick={() => handleShare(content.url, content.prompt, content.type)}
                            >
                              <Share2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false);
          setSelectedContentForRegistration(null);
        }}
        content={selectedContentForRegistration}
        onRegister={handleRegistrationSubmit}
      />

      <style jsx>{`
        .smooth-caret {
          caret-color: rgba(255, 255, 255, 0.8);
        }

        .smooth-caret:focus {
          caret-color: rgba(236, 72, 153, 0.8);
        }

        .placeholder-slide-up {
          animation: placeholderSlideUp 0.3s ease-out forwards;
        }

        .placeholder-slide-in {
          animation: placeholderSlideIn 0.3s ease-out forwards;
        }

        @keyframes placeholderSlideUp {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-10px);
            opacity: 0;
          }
        }

        @keyframes placeholderSlideIn {
          0% {
            transform: translateY(10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-wave-bounce {
          animation: waveBounce 1.4s ease-in-out infinite;
        }

        .delay-150 {
          animation-delay: 0.15s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }

        @keyframes waveBounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        kbd {
          font-family: ui-monospace, SFMono-Regular, 'SF Mono', monospace;
        }

        /* Smooth caret blinking */
        textarea {
          animation: caretBlink 1s infinite;
        }

        @keyframes caretBlink {
          0%, 50% { caret-color: rgba(236, 72, 153, 0.8); }
          51%, 100% { caret-color: transparent; }
        }

        /* Smooth content repositioning */
        .content-card {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Ensure buttons are above floating dock */
        .content-card button {
          position: relative;
          z-index: 10;
        }
      `}</style>
    </div>
  )
}
