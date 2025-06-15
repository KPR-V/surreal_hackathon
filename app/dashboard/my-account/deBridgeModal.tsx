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

  // Updated widget configuration matching your provided config
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
    "styles": "eyJhcHBCYWNrZ3JvdW5kIjoiIzAxMDYwYiIsInRvb2x0aXBCZyI6IiMwODBiMTEiLCJwcmltYXJ5IjoiI2RhZTBmMSIsInByaW1hcnlCdG5CZyI6IiM0MzViZGIiLCJwcmltYXJ5QnRuVGV4dCI6IiNlM2U4ZWQifQ==",
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-blue-950/95 to-slate-900/95 backdrop-blur-xl border border-blue-800/30 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-blue-800/30 bg-gradient-to-r from-blue-900/20 to-slate-800/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-slate-100">Bridge to Story Network</h2>
                  <p className="text-xs text-blue-200/70">Cross-chain bridge powered by deBridge Protocol</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-blue-800/30 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-600/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-4 flex-shrink-0">
            <div className="flex space-x-1 bg-blue-900/20 rounded-lg p-1 border border-blue-700/20">
              <button
                onClick={() => setActiveTab('guide')}
                className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  activeTab === 'guide'
                    ? 'bg-blue-600/40 text-blue-200 border border-blue-500/30'
                    : 'text-slate-300 hover:text-slate-200 hover:bg-blue-800/20'
                }`}
              >
                How to Use
              </button>
              <button
                onClick={() => setActiveTab('bridge')}
                className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  activeTab === 'bridge'
                    ? 'bg-blue-600/40 text-blue-200 border border-blue-500/30'
                    : 'text-slate-300 hover:text-slate-200 hover:bg-blue-800/20'
                }`}
              >
                Bridge Assets
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'bg-blue-600/40 text-blue-200 border border-blue-500/30'
                    : 'text-slate-300 hover:text-slate-200 hover:bg-blue-800/20'
                }`}
              >
                Transaction History
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 scrollbar-thin scrollbar-thumb-blue-600/30 scrollbar-track-transparent">
            {activeTab === 'guide' ? (
              /* Guide Tab - Pure informational content only */
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-medium text-slate-100 mb-2">Cross-Chain Bridge Guide</h3>
                  <p className="text-blue-200/70">Learn how to transfer assets seamlessly between different blockchain networks</p>
                </div>

                {/* Why Bridge */}
                <div className="bg-gradient-to-br from-blue-600/10 to-blue-500/5 border border-blue-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl flex-shrink-0 border border-blue-400/30">
                      <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-slate-100 mb-2">Why Use Cross-Chain Bridging?</h4>
                      <p className="text-blue-200/80 text-sm leading-relaxed">
                        Move your assets between different blockchain networks to access unique features, 
                        lower fees, or participate in specific ecosystems. Story Network offers optimized 
                        infrastructure for intellectual property and creative assets.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pre-configured Setup */}
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-5">
                  <div className="flex items-center space-x-3 mb-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-slate-100 font-medium">Multi-Chain Support</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-700/20">
                      <div className="text-blue-200/70 mb-1">Supported Networks</div>
                      <div className="text-slate-100 font-medium">30+ Blockchains</div>
                      <div className="text-blue-300/60 text-xs">Ethereum, Polygon, BSC, Arbitrum & more</div>
                    </div>
                    <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-700/20">
                      <div className="text-blue-200/70 mb-1">Default Destination</div>
                      <div className="text-slate-100 font-medium">Story Network</div>
                      <div className="text-blue-300/60 text-xs">Optimized for IP transactions</div>
                    </div>
                  </div>
                </div>

                {/* Step by Step Guide */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-slate-100 mb-4">Simple 4-Step Process</h4>
                  
                  {/* Step 1 */}
                  <div className="bg-blue-900/20 rounded-lg p-5 border border-blue-700/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-blue-400/30">
                        <span className="text-blue-200 text-sm font-medium">1</span>
                      </div>
                      <div>
                        <h5 className="text-slate-100 font-medium mb-1">Connect Your Wallet</h5>
                        <p className="text-blue-200/70 text-sm">
                          Connect your Web3 wallet and ensure you have assets on the source network.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-blue-900/20 rounded-lg p-5 border border-blue-700/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-blue-400/30">
                        <span className="text-blue-200 text-sm font-medium">2</span>
                      </div>
                      <div>
                        <h5 className="text-slate-100 font-medium mb-1">Select Networks & Assets</h5>
                        <p className="text-blue-200/70 text-sm">
                          Choose source and destination networks, then select the asset and amount to bridge.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-blue-900/20 rounded-lg p-5 border border-blue-700/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-blue-400/30">
                        <span className="text-blue-200 text-sm font-medium">3</span>
                      </div>
                      <div>
                        <h5 className="text-slate-100 font-medium mb-1">Review & Confirm</h5>
                        <p className="text-blue-200/70 text-sm">
                          Check transaction details, fees, and estimated arrival time before confirming.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-blue-900/20 rounded-lg p-5 border border-blue-700/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-blue-400/30">
                        <span className="text-blue-200 text-sm font-medium">4</span>
                      </div>
                      <div>
                        <h5 className="text-slate-100 font-medium mb-1">Wait for Completion</h5>
                        <p className="text-blue-200/70 text-sm">
                          Your assets will arrive on the destination network within a few minutes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5 mt-6">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h5 className="text-amber-300 font-medium mb-2">Important Reminders</h5>
                      <ul className="space-y-1 text-amber-200/80 text-sm">
                        <li>• Ensure you have enough native tokens for gas fees on the source network</li>
                        <li>• Bridge transactions typically take 2-15 minutes depending on networks</li>
                        <li>• Double-check destination network and address before confirming</li>
                        <li>• Keep transaction hash for tracking and support purposes</li>
                        <li>• Minimum bridge amounts apply for each asset and network pair</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Ready to Bridge CTA */}
                <div className="text-center pt-4">
                  <button
                    onClick={() => setActiveTab('bridge')}
                    className="px-6 py-3 bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 hover:text-blue-100 rounded-lg transition-all duration-200 border border-blue-500/30 font-medium"
                  >
                    Start Bridging Assets →
                  </button>
                </div>
              </div>
            ) : activeTab === 'bridge' ? (
              /* Bridge Tab - Widget only loaded here */
              <div className="space-y-6">
                {/* Quick Info Banner */}
                <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-400/30">
                      <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-200 text-sm font-medium">deBridge Cross-Chain Protocol</p>
                      <p className="text-blue-300/70 text-xs mt-0.5">
                        Secure, fast, and efficient cross-chain asset transfers
                      </p>
                    </div>
                  </div>
                </div>

                {/* Widget Container */}
                <div className="relative">
                  {/* Loading State */}
                  {isWidgetLoading && !widgetError && (
                    <div className="bg-blue-900/20 rounded-lg p-8 text-center min-h-[700px] flex items-center justify-center border border-blue-700/20">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto border border-blue-400/30">
                          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-slate-100 mb-2">Loading Bridge Interface</h4>
                          <p className="text-blue-200/70 text-sm">
                            Setting up cross-chain bridge powered by deBridge...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {widgetError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center min-h-[700px] flex items-center justify-center">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-400/30">
                          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-slate-100 mb-2">Unable to Load Bridge</h4>
                          <p className="text-red-300 text-sm mb-4">{widgetError}</p>
                          <button
                            onClick={initializeWidget}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all duration-200 border border-red-500/30 text-sm"
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
                    className={`${isWidgetLoading || widgetError ? 'hidden' : 'block'} rounded-lg overflow-hidden border border-blue-700/20`}
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
                  <h3 className="text-xl font-medium text-slate-100 mb-1">Your Bridge History</h3>
                  <p className="text-sm text-blue-200/70">Track your cross-chain bridge transactions</p>
                </div>

                <div className="bg-blue-900/20 rounded-lg p-8 text-center border border-blue-700/20">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-400/30">
                    <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-slate-100 mb-2">No Bridge Transactions Yet</h4>
                  <p className="text-blue-200/70 text-sm mb-4">
                    Once you bridge assets between networks, your transaction history will appear here.
                  </p>
                  <button
                    onClick={() => setActiveTab('bridge')}
                    className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 hover:text-blue-100 rounded-lg transition-all duration-200 border border-blue-500/30 text-sm"
                  >
                    Bridge Assets Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-blue-700/30 bg-gradient-to-r from-blue-900/10 to-slate-800/10">
            <div className="flex justify-between items-center">
              <div className="text-xs text-blue-200/60">
                Powered by deBridge Protocol • Secure Cross-Chain Infrastructure
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-800/30 hover:bg-blue-700/40 text-blue-200 hover:text-slate-100 rounded-lg transition-all duration-200 border border-blue-600/30 text-sm"
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