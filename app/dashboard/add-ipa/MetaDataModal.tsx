"use client";
import React, { useState, useEffect } from "react";

interface MetaDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (metadataConfig: any) => void;
  initialData?: any;
  cardType: string;
}

// Define proper types for metadata objects
interface IPMetadata {
  title: string;
  description: string;
  external_url: string;
  image: string;
  imageFile?: File;
}

interface NFTMetadata {
  name: string;
  description: string;
  external_url: string;
  image: string;
  imageFile?: File;
}

export const MetaDataModal: React.FC<MetaDataModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  cardType
}) => {
  const [activeTab, setActiveTab] = useState<'strategy' | 'content' | 'ip' | 'nft'>('strategy');
  const [metadataStrategy, setMetadataStrategy] = useState('');
  const [contentType, setContentType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [ipMetadata, setIpMetadata] = useState<IPMetadata>({
    title: '',
    description: '',
    external_url: '',
    image: '',
    imageFile: undefined
  });
  
  const [nftMetadata, setNftMetadata] = useState<NFTMetadata>({
    name: '',
    description: '',
    external_url: '',
    image: '',
    imageFile: undefined
  });

  // ✅ File upload function
  const uploadToIPFS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-to-ipfs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload to IPFS');
      }

      const data = await response.json();
      return `https://ipfs.io/ipfs/${data.cid}`;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
  };

  // ✅ Handle file selection and upload
  const handleFileUpload = async (file: File, type: 'ip' | 'nft') => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      const ipfsUrl = await uploadToIPFS(file);
      
      if (type === 'ip') {
        setIpMetadata(prev => ({
          ...prev,
          image: ipfsUrl,
          imageFile: file
        }));
      } else {
        setNftMetadata(prev => ({
          ...prev,
          image: ipfsUrl,
          imageFile: file
        }));
      }
    } catch (error) {
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      console.log("MetaDataModal: Loading initial data:", initialData);
      setMetadataStrategy(initialData.metadata_strategy || '');
      setContentType(initialData.content_type || '');
      setIpMetadata({
        title: initialData.ip_title || '',
        description: initialData.ip_description || '',
        external_url: initialData.ip_external_url || '',
        image: initialData.ip_image || '',
        imageFile: undefined
      });
      setNftMetadata({
        name: initialData.nft_name || '',
        description: initialData.nft_description || '',
        external_url: initialData.nft_external_url || '',
        image: initialData.nft_image || '',
        imageFile: undefined
      });
    } else {
      console.log("MetaDataModal: No initial data, resetting to empty");
      setMetadataStrategy('');
      setContentType('');
      setIpMetadata({
        title: '',
        description: '',
        external_url: '',
        image: '',
        imageFile: undefined
      });
      setNftMetadata({
        name: '',
        description: '',
        external_url: '',
        image: '',
        imageFile: undefined
      });
      setActiveTab('strategy');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // ✅ Enhanced strategies with clearer descriptions
  const strategies = [
    {
      id: "smart-default",
      value: "Smart Default - Use same info for both IP and NFT",
      title: "Smart Default",
      description: "Use the same information for both IP and NFT - saves time and ensures consistency",
      icon: "🎯",
      benefits: ["Saves time", "Consistent branding", "Simplified management"],
      recommended: true,
      explanation: "Perfect for most creators. Your IP title becomes the NFT name, and descriptions are shared. Ideal for art, music, and creative works where the IP and NFT represent the same thing."
    },
    {
      id: "separate",
      value: "Separate Metadata - Different info for IP vs NFT",
      title: "Separate Metadata",
      description: "Create different information for IP rights vs NFT collectible aspects",
      icon: "🔄",
      benefits: ["Targeted messaging", "Dual purpose optimization", "Flexible branding"],
      explanation: "Use when your IP (legal/rights info) and NFT (collectible/market info) need different messaging. Great for complex projects or when targeting different audiences."
    },
    {
      id: "ip-focus",
      value: "IP Focus - Detailed IP metadata only",
      title: "IP Focus",
      description: "Focus on intellectual property rights and legal documentation",
      icon: "⚖️",
      benefits: ["Rights-focused", "Legal clarity", "IP-first approach"],
      explanation: "Best for creators who want to emphasize the intellectual property aspects. The NFT will have minimal metadata while IP gets detailed rights information."
    },
    {
      id: "nft-focus",
      value: "NFT Focus - Detailed NFT metadata only",
      title: "NFT Focus",
      description: "Optimize for collectible appeal and marketplace visibility",
      icon: "🎨",
      benefits: ["Market appeal", "Collector-friendly", "Trading optimized"],
      explanation: "Perfect for collectible-focused projects. The NFT gets detailed marketplace-optimized metadata while IP registration remains minimal."
    },
    {
      id: "minimal",
      value: "Minimal - No additional metadata",
      title: "Minimal Setup",
      description: "Quick registration with basic information only",
      icon: "✨",
      benefits: ["Quick setup", "Cost effective", "Simple approach"],
      explanation: "For quick registrations where you don't need detailed metadata. You can always add more information later."
    }
  ];

  const contentTypes = [
    { value: "Digital Art/Image", icon: "🎨", description: "Paintings, illustrations, digital artwork, photography" },
    { value: "Music/Audio", icon: "🎵", description: "Songs, soundtracks, podcasts, audio compositions" },
    { value: "Video/Animation", icon: "🎬", description: "Films, animations, video content, documentaries" },
    { value: "Text/Written Work", icon: "📝", description: "Articles, books, poems, written content" },
    { value: "3D Model/Design", icon: "🎲", description: "3D models, architectural designs, product designs" },
    { value: "Game Asset", icon: "🎮", description: "Game characters, items, environments, mechanics" },
    { value: "Software/Code", icon: "💻", description: "Applications, smart contracts, algorithms" },
    { value: "Other Creative Work", icon: "💡", description: "Other forms of creative expression" }
  ];

  const getRequiredFields = () => {
    switch (metadataStrategy) {
      case "Smart Default - Use same info for both IP and NFT":
        return ['ip_title', 'ip_description', 'nft_name'];
      case "Separate Metadata - Different info for IP vs NFT":
        return ['ip_title', 'ip_description', 'nft_name', 'nft_description'];
      case "IP Focus - Detailed IP metadata only":
        return ['ip_title', 'ip_description'];
      case "NFT Focus - Detailed NFT metadata only":
        return ['nft_name', 'nft_description'];
      case "Minimal - No additional metadata":
        return [];
      default:
        return [];
    }
  };

  const isValid = () => {
    if (!metadataStrategy) return false;
    if (cardType === "mint-and-register-ip" && !contentType) return false;
    
    const requiredFields = getRequiredFields();
    
    for (const field of requiredFields) {
      if (field.startsWith('ip_') && !ipMetadata[field.replace('ip_', '') as keyof typeof ipMetadata]) {
        return false;
      }
      if (field.startsWith('nft_') && !nftMetadata[field.replace('nft_', '') as keyof typeof nftMetadata]) {
        return false;
      }
    }
    
    return true;
  };

  const handleSave = () => {
    if (!isValid()) return;
    
    const config = {
      metadata_strategy: metadataStrategy,
      content_type: contentType,
      ...Object.fromEntries(
        Object.entries(ipMetadata).filter(([key]) => key !== 'imageFile').map(([key, value]) => [`ip_${key}`, value])
      ),
      ...Object.fromEntries(
        Object.entries(nftMetadata).filter(([key]) => key !== 'imageFile').map(([key, value]) => [`nft_${key}`, value])
      )
    };
    
    onSave(config);
    onClose();
  };

  const renderStrategySelection = () => (
    <div className="space-y-3">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Choose Your Metadata Strategy</h3>
        <p className="text-zinc-400 text-sm">
          Metadata describes your creation for legal, marketplace, and discovery purposes. Each strategy serves different needs.
        </p>
      </div>
      
      <div className="grid gap-3">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            onClick={() => setMetadataStrategy(strategy.value)}
            className={`
              relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
              ${metadataStrategy === strategy.value
                ? 'border-blue-400 bg-blue-500/10 shadow-lg'
                : 'border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/30'
              }
            `}
          >
            {strategy.recommended && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Recommended
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <div className="text-2xl">{strategy.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-white text-base">{strategy.title}</h4>
                  <input
                    type="radio"
                    checked={metadataStrategy === strategy.value}
                    onChange={() => setMetadataStrategy(strategy.value)}
                    className="text-blue-500 w-4 h-4"
                  />
                </div>
                <p className="text-zinc-300 text-sm mb-3">{strategy.description}</p>
                <p className="text-zinc-400 text-xs mb-3 leading-relaxed">{strategy.explanation}</p>
                <div className="flex flex-wrap gap-1">
                  {strategy.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="text-xs bg-zinc-700/50 text-zinc-300 px-2 py-1 rounded-full"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContentTypeSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">What type of content are you creating?</h3>
        <p className="text-zinc-400 text-sm">
          This helps us optimize the metadata fields and provide relevant guidance for your specific content type.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {contentTypes.map((type) => (
          <div
            key={type.value}
            onClick={() => setContentType(type.value)}
            className={`
              p-3 rounded-xl border cursor-pointer transition-all duration-200 text-center
              ${contentType === type.value
                ? 'border-blue-400 bg-blue-500/10 shadow-lg'
                : 'border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/30'
              }
            `}
          >
            <div className="text-2xl mb-2">{type.icon}</div>
            <div className="font-medium text-white text-sm mb-1">{type.value}</div>
            <div className="text-xs text-zinc-400 leading-relaxed">{type.description}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ✅ Fixed metadata form with proper type handling
  const renderMetadataForm = (type: 'ip' | 'nft') => {
    const data = type === 'ip' ? ipMetadata : nftMetadata;
    const setData = type === 'ip' ? setIpMetadata : setNftMetadata;
    const prefix = type === 'ip' ? 'IP Asset' : 'NFT';
    const requiredFields = getRequiredFields();
    
    if (metadataStrategy === "Minimal - No additional metadata") {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-semibold text-white mb-2">Minimal Setup Selected</h3>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            You've chosen minimal setup. No additional metadata will be collected, allowing for quick registration with basic information only.
          </p>
        </div>
      );
    }

    const shouldShow = () => {
      if (metadataStrategy.includes("IP Focus") && type === 'nft') return false;
      if (metadataStrategy.includes("NFT Focus") && type === 'ip') return false;
      return true;
    };

    if (!shouldShow()) return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">{type === 'ip' ? '⚖️' : '🎨'}</div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {type === 'ip' ? 'IP metadata not needed' : 'NFT metadata not needed'}
        </h3>
        <p className="text-zinc-400 text-sm">
          Your selected strategy doesn't require {type === 'ip' ? 'detailed IP' : 'detailed NFT'} metadata.
        </p>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">{prefix} Information</h3>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto">
            {type === 'ip' 
              ? "This information establishes your intellectual property rights and provides legal context for your creation. It's what lawyers, licensees, and rights holders will reference."
              : "This information optimizes your NFT for marketplaces, collectors, and social sharing. It's what appears in wallets, galleries, and trading platforms."
            }
          </p>
        </div>

        <div className="space-y-6">
          {/* Title/Name Field - ✅ Fixed type handling */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {type === 'ip' ? '🏷️ IP Asset Title' : '🎨 NFT Name'}
              {requiredFields.includes(`${type}_title`) || requiredFields.includes(`${type}_name`) ? (
                <span className="text-red-400 ml-1">*</span>
              ) : null}
            </label>
            <p className="text-xs text-zinc-500 mb-3">
              {type === 'ip' 
                ? "The official name of your intellectual property. This appears in legal documents and rights registrations."
                : "The display name for your NFT. This appears in marketplaces, wallets, and social media."
              }
            </p>
            <input
              type="text"
              value={type === 'ip' ? (data as IPMetadata).title : (data as NFTMetadata).name} // ✅ Fixed property access
              onChange={(e) => {
                if (type === 'ip') {
                  setIpMetadata(prev => ({ ...prev, title: e.target.value })); // ✅ Direct type-safe update
                } else {
                  setNftMetadata(prev => ({ ...prev, name: e.target.value })); // ✅ Direct type-safe update
                }
              }}
              className="w-full px-4 py-3 text-sm bg-zinc-800/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={type === 'ip' ? "e.g., 'Ethereal Landscapes: Digital Symphony #1'" : "e.g., 'Ethereal Landscapes #001'"}
            />
          </div>

          {/* Description Field - ✅ Fixed type handling */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              📝 Description
              {requiredFields.includes(`${type}_description`) ? (
                <span className="text-red-400 ml-1">*</span>
              ) : null}
            </label>
            <p className="text-xs text-zinc-500 mb-3">
              {type === 'ip' 
                ? "Detailed description of your creative work, its uniqueness, creation process, and artistic vision. This helps establish the scope of your IP rights."
                : "Compelling description that appeals to collectors and traders. Focus on what makes this NFT special, its rarity, and collectible value."
              }
            </p>
            <textarea
              value={data.description || ''}
              onChange={(e) => {
                if (type === 'ip') {
                  setIpMetadata(prev => ({ ...prev, description: e.target.value })); // ✅ Direct type-safe update
                } else {
                  setNftMetadata(prev => ({ ...prev, description: e.target.value })); // ✅ Direct type-safe update
                }
              }}
              rows={4}
              className="w-full px-4 py-3 text-sm bg-zinc-800/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={type === 'ip' 
                ? "Describe your creation: What inspired it? How was it made? What makes it unique? What rights does it encompass?"
                : "What makes this NFT special? Is it rare? Part of a limited series? What story does it tell?"
              }
            />
            <div className="text-xs text-zinc-500 text-right mt-1">
              {(data.description || '').length} / 1000 characters {type === 'ip' ? '(recommended for IP documentation)' : '(optimal for marketplaces)'}
            </div>
          </div>

          {/* External URL Field - ✅ Fixed type handling */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              🔗 External URL <span className="text-zinc-500">(Optional)</span>
            </label>
            <p className="text-xs text-zinc-500 mb-3">
              {type === 'ip' 
                ? "Link to your official portfolio, project page, or documentation. This becomes the authoritative source for your IP."
                : "Link to your collection website, social media, or project page. This appears on marketplaces as 'Learn More'."
              }
            </p>
            <input
              type="url"
              value={data.external_url || ''}
              onChange={(e) => {
                if (type === 'ip') {
                  setIpMetadata(prev => ({ ...prev, external_url: e.target.value })); // ✅ Direct type-safe update
                } else {
                  setNftMetadata(prev => ({ ...prev, external_url: e.target.value })); // ✅ Direct type-safe update
                }
              }}
              className="w-full px-4 py-3 text-sm bg-zinc-800/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={type === 'ip' ? "https://yourportfolio.com/this-artwork" : "https://yourcollection.com"}
            />
          </div>

          {/* Image Upload Field */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              🖼️ Upload Image <span className="text-zinc-500">(Optional but Recommended)</span>
            </label>
            <p className="text-xs text-zinc-500 mb-3">
              {type === 'ip' 
                ? "Upload the visual representation of your IP. This could be the artwork itself, documentation, or a representative image. Stored securely on IPFS."
                : "Upload the main visual for your NFT. This is what collectors see first in marketplaces and wallets. High quality recommended."
              }
            </p>
            
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-zinc-600 rounded-lg p-6 text-center">
              {data.image ? (
                <div className="space-y-4">
                  <img 
                    src={data.image} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-lg mx-auto border border-zinc-600"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="text-xs text-zinc-400">
                    <p className="text-green-400 mb-1">✅ Uploaded to IPFS</p>
                    <p className="break-all font-mono">{data.image}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (type === 'ip') {
                        setIpMetadata(prev => ({ ...prev, image: '', imageFile: undefined })); // ✅ Direct type-safe update
                      } else {
                        setNftMetadata(prev => ({ ...prev, image: '', imageFile: undefined })); // ✅ Direct type-safe update
                      }
                    }}
                    className="text-red-400 hover:text-red-300 text-xs underline"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {isUploading ? (
                    <div className="text-blue-400">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm">Uploading to IPFS...</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-4xl text-zinc-500">📁</div>
                      <div>
                        <p className="text-sm text-zinc-300 mb-1">Drop an image here or click to browse</p>
                        <p className="text-xs text-zinc-500">Supports: JPEG, PNG, GIF, WebP, SVG (Max 10MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, type);
                        }}
                        className="hidden"
                        id={`file-upload-${type}`}
                      />
                      <label
                        htmlFor={`file-upload-${type}`}
                        className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg cursor-pointer transition-colors"
                      >
                        Choose Image
                      </label>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Alternative URL input - ✅ Fixed type handling */}
            <div className="mt-4">
              <p className="text-xs text-zinc-500 mb-2">
                Or paste an image URL (we'll fetch and store it on IPFS):
              </p>
              <input
                type="url"
                value={data.image && !data.imageFile ? data.image : ''}
                onChange={(e) => {
                  if (type === 'ip') {
                    setIpMetadata(prev => ({ ...prev, image: e.target.value, imageFile: undefined })); // ✅ Direct type-safe update
                  } else {
                    setNftMetadata(prev => ({ ...prev, image: e.target.value, imageFile: undefined })); // ✅ Direct type-safe update
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-zinc-800/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
                disabled={isUploading}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabs = () => {
    const tabs = [
      { id: 'strategy', label: 'Strategy', icon: '🎯', desc: 'Choose approach' },
      ...(cardType === "mint-and-register-ip" ? [{ id: 'content' as const, label: 'Content', icon: '🎨', desc: 'Content type' }] : []),
      { id: 'ip', label: 'IP Data', icon: '⚖️', desc: 'Rights info' },
      { id: 'nft', label: 'NFT Data', icon: '🎨', desc: 'Collectible info' }
    ];

    return (
      <div className="flex space-x-1 bg-zinc-800/30 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'strategy' | 'content' | 'ip' | 'nft')}
            className={`
              flex-1 flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
              }
            `}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
            <span className="text-xs opacity-80">{tab.desc}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="px-6 py-4 border-b border-zinc-700/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">📋 Metadata Configuration</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Configure how your creation will be described, displayed, and discovered
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs - Fixed */}
        <div className="px-6 py-4 flex-shrink-0">
          {renderTabs()}
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 pb-4 flex-1 overflow-y-auto min-h-0">
          {activeTab === 'strategy' && renderStrategySelection()}
          {activeTab === 'content' && renderContentTypeSelection()}
          {activeTab === 'ip' && renderMetadataForm('ip')}
          {activeTab === 'nft' && renderMetadataForm('nft')}
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-zinc-700/50 flex items-center justify-between flex-shrink-0 bg-zinc-900/95">
          <div className="text-sm text-zinc-500">
            {isValid() ? (
              <span className="text-green-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Configuration complete and ready to save
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complete required fields to continue
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid() || isUploading}
              className={`
                px-6 py-2 text-sm rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                ${isValid() && !isUploading
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                  : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                }
              `}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};