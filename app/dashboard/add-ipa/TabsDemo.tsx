"use client";

import { useState } from "react";
import { Tabs } from "../../../components/ui/tabs-component";
import { FeatureCard } from "../../../components/ui/feature-card";
import { TimelineDemo } from "./TimelineDemo";
import { cardConfigurations } from "../../../config/cardQuestions";

export function TabsDemo() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // IP Registration & Minting Cards - Now with three cards
  const ipRegistrationCards = [
    {
      id: "register-ip",
      header: "Register/Batch Register IP",
      description: "I have NFT(s) and just need to register it as intellectual property. Optionally attach PIL terms.",
    },
    {
      id: "mint-and-register-ip",
      header: "Mint and Register IP",
      description: "I have content that needs to be minted as an NFT and registered as IP in a single transaction. Optionally attach PIL terms.",
    },
    {
      id: "attach-pil-to-ip",
      header: "Attach PIL Terms to Existing IP",
      description: "I have an existing IP asset and want to attach existing PIL license terms or create new PIL terms for it.",
    },
  ];

  // Derivatives & Licensing Cards - Three functional cards
  const derivativesCards = [
    {
      id: "register-derivative-ip",
      header: "Register Derivative IP",
      description: "I already have an NFT and want to register it as IP and link it as a derivative of another IP Asset without using license tokens.",
    },
    {
      id: "mint-and-register-derivative-ip",
      header: "Mint and Register Derivative IP",
      description: "I have derivative content that needs to be minted as an NFT and registered as a derivative IP in a single transaction.",
    },
    {
      id: "register-derivative",
      header: "Link as Derivative",
      description: "I have existing IP assets and want to establish a parent-child relationship between them without using license tokens.",
    },
  ];

  // License Token Cards - Updated with three cards
  const licenseTokenCards = [
    {
      id: "mint-and-register-derivative-with-license-tokens",
      header: "Mint and Register Derivative with License Tokens",
      description: "Create a derivative IP by minting new content and using license tokens from parent IPs for proper licensing.",
    },
    {
      id: "register-ip-and-make-derivative-with-license-tokens",
      header: "Register IP and Make Derivative with License Tokens",
      description: "Register an existing NFT as IP and then make it a derivative using license tokens from parent IPs.",
    },
    {
      id: "register-derivative-with-license-tokens",
      header: "Register Derivative with License Tokens",
      description: "Register an existing IP as a derivative of parent IPs using license tokens without additional IP registration.",
    },
  ];

  const handleCardClick = (cardId: string) => {
    // Check if the card exists in our configurations
    if (cardConfigurations[cardId]) {
      setSelectedCard(cardId);
    } else {
      // For cards not yet implemented, show a coming soon message
      alert(`${cardId} functionality is coming soon!`);
    }
  };

  const handleBackToTabs = () => {
    setSelectedCard(null);
  };

  // If a card is selected, show the timeline form
  if (selectedCard) {
    const cardConfig = cardConfigurations[selectedCard];
    if (cardConfig) {
      return (
        <div className="w-full relative">
          {/* Updated Back to Options button - positioned in top right corner */}
           <div className="absolute top-4 right-4 z-50">
            <button
              onClick={handleBackToTabs}
              className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 hover:from-zinc-700/90 hover:to-zinc-800/90 backdrop-blur-sm border border-zinc-600/50 hover:border-blue-500/70 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <svg 
                className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
          
          {/* Add padding to prevent overlap with the button */}
          <div className="pt-20">
            <TimelineDemo 
              cardConfig={cardConfig}
              onBack={handleBackToTabs}
            />
          </div>
        </div>
      );
    }
  }

  const tabs = [
    {
      title: "IP Creation Hub",
      value: "ip-creation",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-neutral-900 border-t-4 border-blue-500 shadow-[0_-4px_20px_rgba(59,130,246,0.5)]">
          {/* Subtle inner gradients */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-neutral-600/10 to-transparent rounded-bl-2xl"></div>

          <div className="relative z-10 h-full flex flex-col p-6">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex-shrink-0">
                IP Creation Hub
              </h2>
              <p className="text-zinc-400 text-sm">
                Register existing NFTs as IP or mint new content and register as IP
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-6 no-visible-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-2">
                {ipRegistrationCards.map((card, index) => (
                  <FeatureCard
                    key={index}
                    header={card.header}
                    description={card.description}
                    onClick={() => handleCardClick(card.id)}
                  />
                ))}
              </div>
              
              {/* Information Section */}
              <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-300">IP Registration & Creation</h3>
                </div>
                <p className="text-blue-200/80 text-sm leading-relaxed">
                  Transform your digital assets into protected intellectual property. Register existing NFTs as IP assets or mint new content directly as IP. 
                  Both options support optional PIL (Programmable IP License) terms for flexible licensing and batch processing for efficiency.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-blue-300/70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span><strong>Register IP:</strong> Convert existing NFTs into protected IP assets</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-blue-300/70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>Mint and Register:</strong> Create new NFTs and register as IP in one transaction</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-blue-300/70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z" />
                    </svg>
                    <span><strong>PIL Terms:</strong> Attach programmable licensing terms for automated royalties</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-blue-300/70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Both options support batch processing for multiple assets</span>
                  </div>
                </div>
              </div>
              
              {/* Extra space at bottom for better scrolling */}
              <div className="h-20"></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Derivatives & Licensing",
      value: "derivatives-licensing",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-neutral-900 border-t-4 border-purple-500 shadow-[0_-4px_20px_rgba(168,85,247,0.5)]">
          {/* Subtle inner gradients */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-neutral-600/10 to-transparent rounded-bl-2xl"></div>

          <div className="relative z-10 h-full flex flex-col p-6">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex-shrink-0">
                Derivatives & Licensing
              </h2>
              <p className="text-zinc-400 text-sm">
                Register derivative works and manage IP relationships
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-6 no-visible-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-2">
                {derivativesCards.map((card, index) => (
                  <FeatureCard
                    key={index}
                    header={card.header}
                    description={card.description}
                    onClick={() => handleCardClick(card.id)}
                  />
                ))}
              </div>
              
              {/* Information Section */}
              <div className="mt-8 p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-purple-300">Derivative IP Management</h3>
                </div>
                <p className="text-purple-200/80 text-sm leading-relaxed">
                  Create and manage derivative intellectual property assets. Register existing NFTs as derivatives, mint new derivative content, or establish relationships between existing IP assets. 
                  Batch processing is supported for multiple derivatives.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-purple-300/70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>Register Derivative IP:</strong> Link existing NFTs as derivatives</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-purple-300/70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>Mint and Register Derivative:</strong> Create new derivative NFTs in one transaction</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-purple-300/70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>Link as Derivative:</strong> Establish relationships between existing IP assets</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-purple-300/70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>All options support batch processing for efficiency</span>
                  </div>
                </div>
              </div>
              
              {/* Extra space at bottom for better scrolling */}
              <div className="h-20"></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "License Tokens",
      value: "license-tokens",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-neutral-900 border-t-4 border-pink-500 shadow-[0_-4px_20px_rgba(236,72,153,0.5)]">
          {/* Subtle inner gradients */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-neutral-600/10 to-transparent rounded-bl-2xl"></div>

          <div className="relative z-10 h-full flex flex-col p-6">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex-shrink-0">
                License Tokens
              </h2>
              <p className="text-zinc-400 text-sm">
                Create derivative works using license tokens for proper IP licensing
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-6 no-visible-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-2">
                {licenseTokenCards.map((card, index) => (
                  <FeatureCard
                    key={index}
                    header={card.header}
                    description={card.description}
                    onClick={() => handleCardClick(card.id)}
                  />
                ))}
              </div>
              
              {/* Information Section */}
              <div className="mt-8 p-6 bg-pink-500/10 border border-pink-500/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-pink-300">License Token Operations</h3>
                </div>
                <p className="text-pink-200/80 text-sm leading-relaxed">
                  Use license tokens to create derivative works with proper licensing compliance. License tokens represent 
                  the right to create derivatives from specific parent IPs and are burned during the derivative creation process 
                  to establish the legal relationship.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-pink-300/70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>License Token Burning:</strong> Tokens are consumed to create derivatives</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-pink-300/70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>Royalty Distribution:</strong> Set maximum royalty tokens (0-100M)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-pink-300/70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>Automated Compliance:</strong> Ensures proper licensing relationships</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-pink-300/70">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Single operation - no batch processing required</span>
                  </div>
                </div>
              </div>
              
              {/* Extra space at bottom for better scrolling */}
              <div className="h-20"></div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="h-[85vh] md:h-[85vh] [perspective:1000px] relative flex flex-col max-w-7xl mx-auto w-full items-start justify-start py-8 px-4">
      <Tabs tabs={tabs} />
    </div>
  );
}
