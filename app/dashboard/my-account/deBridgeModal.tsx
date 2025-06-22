"use client";

import React, { useState, useEffect, useRef } from 'react';

interface DeBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeBridgeModal: React.FC<DeBridgeModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'bridge' | 'history'>('guide');
  const [isWidgetLoading, setIsWidgetLoading] = useState(true);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  // Updated widget configuration with refined styling
  const widgetConfig = {
    "v": "1",
    "element": "debridgeWidget",
    "title": "",
    "description": "",
    "width": "100%",
    "height": "800",
    "r": null,
    "supportedChains": "{\"inputChains\":{\"1\":\"all\",\"10\":\"all\",\"56\":\"all\",\"100\":\"all\",\"137\":\"all\",\"146\":\"all\",\"250\":\"all\",\"388\":\"all\",\"747\":\"all\",\"998\":\"all\",\"999\":\"all\",\"1088\":\"all\",\"1514\":\"all\",\"2741\":\"all\",\"4158\":\"all\",\"5000\":\"all\",\"8453\":\"all\",\"32769\":\"all\",\"42161\":\"all\",\"43114\":\"all\",\"48900\":\"all\",\"50104\":\"all\",\"59144\":\"all\",\"60808\":\"all\",\"80094\":\"all\",\"98866\":\"all\",\"7565164\":\"all\",\"245022934\":\"all\"},\"outputChains\":{\"1\":\"all\",\"10\":\"all\",\"56\":\"all\",\"100\":\"all\",\"137\":\"all\",\"146\":\"all\",\"250\":\"all\",\"388\":\"all\",\"747\":\"all\",\"998\":\"all\",\"999\":\"all\",\"1088\":\"all\",\"1514\":\"all\",\"2741\":\"all\",\"4158\":\"all\",\"5000\":\"all\",\"8453\":\"all\",\"32769\":\"all\",\"42161\":\"all\",\"43114\":\"all\",\"48900\":\"all\",\"50104\":\"all\",\"59144\":\"all\",\"60808\":\"all\",\"80094\":\"all\",\"98866\":\"all\",\"7565164\":\"all\",\"245022934\":\"all\"}}",
    "inputChain": 1,
    "outputChain": 1514,
    "inputCurrency": "",
    "outputCurrency": "0x1514000000000000000000000000000000000000",
    "address": "",
    "showSwapTransfer": true,
    "amount": "",
    "outputAmount": "",
    "isAmountFromNotModifiable": false,
    "isAmountToNotModifiable": false,
    "lang": "en",
    "mode": "deswap",
    "isEnableCalldata": false,
    "styles": "eyJhcHBCYWNrZ3JvdW5kIjoiIzBhMGExMSIsInRvb2x0aXBCZyI6IiMxNzE3MmEiLCJwcmltYXJ5IjoiI2Y5ZmFmYiIsInByaW1hcnlCdG5CZyI6IiMzZjNmNDYiLCJwcmltYXJ5QnRuVGV4dCI6IiNmOWZhZmIifQ==",
    "theme": "dark",
    "isHideLogo": false,
    "logo": "",
    "disabledWallets": [],
    "disabledElements": []
  };

  // Load deBridge widget script
  const loadDeBridgeScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (scriptLoadedRef.current || (window as any).deBridge) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://app.debridge.finance/assets/scripts/widget.js';
      script.async = true;
      
      script.onload = () => {
        scriptLoadedRef.current = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load deBridge widget script'));
      };

      document.head.appendChild(script);
    });
  };

  // Initialize widget
  const initializeWidget = async () => {
    try {
      setIsWidgetLoading(true);
      setWidgetError(null);

      await loadDeBridgeScript();
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!(window as any).deBridge) {
        throw new Error('deBridge widget not available');
      }

      // Clear any existing widget content
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }

      const widget = await (window as any).deBridge.widget(widgetConfig);

      // Enhanced event listeners with better logging
      widget.on('needConnect', (widget: any) => {
        console.log('User needs to connect wallet', widget);
      });

      widget.on('order', (widget: any, params: any) => {
        console.log('Bridge order created:', params);
      });

      widget.on('bridge', (widget: any, params: any) => {
        console.log('Bridge transaction initiated:', widget, params);
      });

      widget.on('inputChainChanged', (widget: any, params: any) => {
        console.log('Input chain changed to:', params);
      });

      widget.on('outputChainChanged', (widget: any, params: any) => {
        console.log('Output chain changed to:', params);
      });

      widget.on('inputTokenChanged', (widget: any, params: any) => {
        console.log('Input token changed to:', params);
      });

      widget.on('outputTokenChanged', (widget: any, params: any) => {
        console.log('Output token changed to:', params);
      });

      setIsWidgetLoading(false);
    } catch (error) {
      console.error('Failed to initialize deBridge widget:', error);
      setWidgetError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsWidgetLoading(false);
    }
  };

  // Only initialize widget when the bridge tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'bridge') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeWidget();
      }, 200);
    }
  }, [isOpen, activeTab]);

  // Reset widget state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsWidgetLoading(true);
      setWidgetError(null);
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" onClick={onClose}></div>
      
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-black/95 to-zinc-950/98 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-5 border-b border-zinc-800/60 bg-gradient-to-r from-black/60 to-zinc-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-700/50">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-200">Bridge to Story Network</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Cross-chain bridge powered by deBridge Protocol</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 rounded-lg transition-all duration-200 border border-transparent hover:border-zinc-700/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-5 flex-shrink-0">
            <div className="flex space-x-1 bg-zinc-900/70 rounded-xl p-1.5 border border-zinc-800/50">
              <button
                onClick={() => setActiveTab('guide')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'guide'
                    ? 'bg-zinc-800/80 text-zinc-200 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                How to Use
              </button>
              <button
                onClick={() => setActiveTab('bridge')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'bridge'
                    ? 'bg-zinc-800/80 text-zinc-200 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                Bridge Assets
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'bg-zinc-800/80 text-zinc-200 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                Transaction History
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 scrollbar-thin scrollbar-thumb-zinc-700/60 scrollbar-track-transparent">
            {activeTab === 'guide' ? (
              /* Guide Tab - Labeled Interface Diagram */
              <div className="space-y-8 max-w-5xl mx-auto">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-semibold text-zinc-200 mb-3">Bridge Interface Guide</h3>
                  <p className="text-zinc-500">Interactive diagram showing all bridge components and how to use them</p>
                </div>

                {/* Mock Bridge Interface with Labels */}
                <div className="relative bg-gradient-to-br from-zinc-900/60 to-black/80 border border-zinc-800/60 rounded-2xl p-8">
                  
                  {/* Header Section */}
                  <div className="mb-8">
                    <div className="relative bg-zinc-900/80 rounded-xl p-4 border border-zinc-700/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500/30 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </div>
                          <span className="text-zinc-300 font-medium">deBridge Protocol</span>
                        </div>
                        <button className="px-3 py-1.5 bg-blue-600/90 hover:bg-blue-500/90 text-zinc-200 rounded-lg text-sm transition-colors duration-200">Connect Wallet</button>
                      </div>
                      
                      {/* Label for header */}
                      <div className="absolute -top-3 -right-3 bg-emerald-600/90 text-black px-3 py-1 rounded-full text-xs font-medium">
                        1. Connection Status
                      </div>
                    </div>
                    <p className="text-zinc-500 text-sm mt-2 pl-4">
                      Connect your Web3 wallet to start bridging. Supported wallets: MetaMask, WalletConnect, Coinbase Wallet
                    </p>
                  </div>

                  {/* Network Selection */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* From Network */}
                    <div className="relative">
                      <div className="bg-zinc-900/80 rounded-xl p-5 border border-zinc-700/40">
                        <label className="text-zinc-400 text-sm font-medium mb-3 block">From Network</label>
                        <div className="flex items-center space-x-3 bg-zinc-800/60 rounded-lg p-3 border border-zinc-700/30">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-zinc-100 text-xs font-bold">ETH</span>
                          </div>
                          <div>
                            <div className="text-zinc-300 font-medium">Ethereum</div>
                            <div className="text-zinc-500 text-xs">Mainnet</div>
                          </div>
                          <svg className="w-4 h-4 text-zinc-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute -top-3 -left-3 bg-orange-600/90 text-black px-3 py-1 rounded-full text-xs font-medium">
                        2. Source Chain
                      </div>
                    </div>

                    {/* Bridge Arrow */}
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <div className="w-12 h-12 bg-zinc-800/70 rounded-full flex items-center justify-center border border-zinc-700/40">
                          <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-purple-600/90 text-black px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                          Bridge Direction
                        </div>
                      </div>
                    </div>

                    {/* To Network */}
                    <div className="relative">
                      <div className="bg-zinc-900/80 rounded-xl p-5 border border-zinc-700/40">
                        <label className="text-zinc-400 text-sm font-medium mb-3 block">To Network</label>
                        <div className="flex items-center space-x-3 bg-emerald-500/20 rounded-lg p-3 border border-emerald-500/30">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-zinc-100 text-xs font-bold">ST</span>
                          </div>
                          <div>
                            <div className="text-zinc-300 font-medium">Story Network</div>
                            <div className="text-emerald-400 text-xs">Testnet</div>
                          </div>
                          <svg className="w-4 h-4 text-zinc-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute -top-3 -right-3 bg-emerald-600/90 text-black px-3 py-1 rounded-full text-xs font-medium">
                        3. Destination
                      </div>
                    </div>
                  </div>

                  {/* Asset Selection */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* From Asset */}
                    <div className="relative">
                      <div className="bg-zinc-900/80 rounded-xl p-5 border border-zinc-700/40">
                        <label className="text-zinc-400 text-sm font-medium mb-3 block">Send Asset</label>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 bg-zinc-800/60 rounded-lg p-3 border border-zinc-700/30">
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-zinc-100 text-xs font-bold">ETH</span>
                            </div>
                            <div className="flex-1">
                              <div className="text-zinc-300 font-medium">Ethereum</div>
                              <div className="text-zinc-500 text-xs">Balance: 2.543 ETH</div>
                            </div>
                          </div>
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="0.0" 
                              className="w-full bg-black/60 border border-zinc-700/40 rounded-lg p-4 text-zinc-300 text-xl font-medium focus:border-blue-500/60 focus:outline-none placeholder-zinc-600"
                            />
                            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors">
                              MAX
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-3 -left-3 bg-yellow-600/90 text-black px-3 py-1 rounded-full text-xs font-medium">
                        4. Input Amount
                      </div>
                    </div>

                    {/* To Asset */}
                    <div className="relative">
                      <div className="bg-zinc-900/80 rounded-xl p-5 border border-zinc-700/40">
                        <label className="text-zinc-400 text-sm font-medium mb-3 block">Receive Asset</label>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 bg-zinc-800/60 rounded-lg p-3 border border-zinc-700/30">
                            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                              <span className="text-zinc-100 text-xs font-bold">IP</span>
                            </div>
                            <div className="flex-1">
                              <div className="text-zinc-300 font-medium">Story IP Token</div>
                              <div className="text-zinc-500 text-xs">Story Network</div>
                            </div>
                          </div>
                          <div className="bg-black/60 border border-zinc-700/40 rounded-lg p-4">
                            <div className="text-zinc-300 text-xl font-medium">≈ 2.537</div>
                            <div className="text-zinc-500 text-sm">Estimated output</div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-3 -right-3 bg-emerald-600/90 text-black px-3 py-1 rounded-full text-xs font-medium">
                        5. Output Preview
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="relative mb-8">
                    <div className="bg-zinc-900/60 rounded-xl p-5 border border-zinc-800/30">
                      <h4 className="text-zinc-300 font-medium mb-4">Transaction Details</h4>
                      <div className="space-y-3">
                        {Object.entries({
                          'Bridge Fee': '0.003 ETH',
                          'Gas Fee': '≈ $15',
                          'Exchange Rate': '1 ETH = 1.012 IP',
                          'Estimated Time': '3-5 minutes'
                        }).map(([key, value], index) => (
                          <div key={index} className="flex justify-between items-center py-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-zinc-400">{key}</span>
                              <div className="group relative">
                                <svg className="w-3 h-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-zinc-300 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-700/50">
                                  {`Info about ${key.toLowerCase()}`}
                                </div>
                              </div>
                            </div>
                            <span className="text-zinc-300 font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="absolute -top-3 -left-3 bg-blue-600/90 text-black px-3 py-1 rounded-full text-xs font-medium">
                      6. Fee Breakdown
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="relative">
                    <button className="w-full bg-gradient-to-r from-blue-600/90 to-purple-600/90 hover:from-blue-500/90 hover:to-purple-500/90 text-zinc-200 font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg">
                      Review & Confirm Bridge
                    </button>
                    <div className="absolute -top-3 -right-3 bg-purple-600/90 text-black px-3 py-1 rounded-full text-xs font-medium">
                      7. Execute Bridge
                    </div>
                  </div>
                </div>

                {/* Key Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-800/40">
                    <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h4 className="text-zinc-300 font-semibold mb-2">Secure Protocol</h4>
                    <p className="text-zinc-500 text-sm">Multi-signature validation and smart contract security ensure safe transfers</p>
                  </div>

                  <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-800/40">
                    <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-zinc-300 font-semibold mb-2">Fast Transfers</h4>
                    <p className="text-zinc-500 text-sm">Average completion time of 3-5 minutes across supported networks</p>
                  </div>

                  <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-800/40">
                    <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h4 className="text-zinc-300 font-semibold mb-2">Low Fees</h4>
                    <p className="text-zinc-500 text-sm">Competitive bridging fees with transparent cost breakdown</p>
                  </div>
                </div>

                {/* Ready to Bridge CTA */}
                <div className="text-center pt-8">
                  <button
                    onClick={() => setActiveTab('bridge')}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600/90 to-purple-600/90 hover:from-blue-500/90 hover:to-purple-500/90 text-zinc-200 rounded-xl transition-all duration-200 font-semibold shadow-lg"
                  >
                    Start Bridging Assets →
                  </button>
                </div>
              </div>
            ) : activeTab === 'bridge' ? (
              /* Bridge Tab - Widget only loaded here */
              <div className="space-y-6">
                {/* Quick Info Banner */}
                <div className="bg-gradient-to-r from-zinc-900/70 to-zinc-800/50 border border-zinc-700/60 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-zinc-800/90 rounded-xl flex items-center justify-center flex-shrink-0 border border-zinc-700/60">
                      <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-zinc-300 text-sm font-semibold">deBridge Cross-Chain Protocol</p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        Secure, fast, and efficient cross-chain asset transfers
                      </p>
                    </div>
                  </div>
                </div>

                {/* Widget Container */}
                <div className="relative">
                  {/* Loading State */}
                  {isWidgetLoading && !widgetError && (
                    <div className="bg-zinc-900/60 rounded-xl p-8 text-center min-h-[700px] flex items-center justify-center border border-zinc-800/50">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-zinc-800/90 rounded-full flex items-center justify-center mx-auto border border-zinc-700/70">
                          <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-zinc-300 mb-2">Loading Bridge Interface</h4>
                          <p className="text-zinc-500 text-sm">
                            Setting up cross-chain bridge powered by deBridge...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {widgetError && (
                    <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-8 text-center min-h-[700px] flex items-center justify-center">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto border border-red-700/70">
                          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-zinc-300 mb-2">Unable to Load Bridge</h4>
                          <p className="text-red-400 text-sm mb-4">{widgetError}</p>
                          <button
                            onClick={initializeWidget}
                            className="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 hover:text-red-200 rounded-lg transition-all duration-200 border border-red-700/70 text-sm font-medium"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Widget Container - Enhanced scrolling */}
                  <div 
                    ref={widgetRef}
                    id="debridgeWidget" 
                    className={`${isWidgetLoading || widgetError ? 'hidden' : 'block'} rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-950/30`}
                    style={{ 
                      minHeight: '700px',
                      overflowY: 'auto',
                      overflowX: 'hidden'
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              /* History Tab */
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-zinc-300 mb-1">Your Bridge History</h3>
                  <p className="text-sm text-zinc-500">Track your cross-chain bridge transactions</p>
                </div>

                <div className="bg-zinc-900/60 rounded-xl p-8 text-center border border-zinc-800/50">
                  <div className="w-16 h-16 bg-zinc-800/90 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700/70">
                    <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-zinc-300 mb-2">No Bridge Transactions Yet</h4>
                  <p className="text-zinc-500 text-sm mb-4">
                    Once you bridge assets between networks, your transaction history will appear here.
                  </p>
                  <button
                    onClick={() => setActiveTab('bridge')}
                    className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 rounded-lg transition-all duration-200 text-sm font-medium"
                  >
                    Bridge Assets Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-zinc-800/60 bg-gradient-to-r from-black/40 to-zinc-950/30">
            <div className="flex justify-between items-center">
              <div className="text-xs text-zinc-600">
                Powered by deBridge Protocol • Secure Cross-Chain Infrastructure
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-400 hover:text-zinc-300 rounded-lg transition-all duration-200 border border-zinc-700/60 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};