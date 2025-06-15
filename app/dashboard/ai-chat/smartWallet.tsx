"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@tomo-inc/tomo-evm-kit';
import { useWalletClient } from 'wagmi';
import { hexToBytes } from 'viem';
import { createAgentKey } from '../../test-page/wallet';
import { CoreMessage } from 'ai';
import { ArrowLeft, Settings, Plus, Trash2, Info, Wallet, Bot, ShieldCheck, Sparkles, MessageCircle, ChevronRight, LayoutDashboard, Coins } from 'lucide-react';

interface Permission {
  type:
    | 'native-token-transfer'
    | 'erc20-token-transfer'
    | 'erc721-token-transfer'
    | 'erc1155-token-transfer';
  data: {
    allowance?: string;
    address?: string;
    tokenId?: string;
    tokenIds?: string[];
    amount?: string;
    allowances?: Record<string, string>;
  };
}

interface PasswordModalProps {
  open: boolean;
  onSubmit: (pwd: string) => void;
  onClose: () => void;
}

function PasswordModal({ open, onSubmit, onClose }: PasswordModalProps) {
  const [pwd, setPwd] = useState('');
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-semibold text-white mb-6">Enter encryption password</h3>
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="Password"
          className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/50 mb-6"
          onKeyDown={(e) => e.key === 'Enter' && pwd && onSubmit(pwd)}
        />
        <div className="flex space-x-3">
          <button
            onClick={() => { onSubmit(pwd); setPwd('') }}
            disabled={!pwd}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-pink-500/20 to-blue-500/20 hover:from-pink-500/30 hover:to-blue-500/30 border border-pink-500/30 rounded-xl text-pink-300 transition-all duration-200 disabled:opacity-50"
          >
            Confirm
          </button>
          <button
            onClick={() => { onClose(); setPwd('') }}
            className="flex-1 py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white/70 hover:text-white transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface SmartWalletProps {
  onBack: () => void;
}

export default function SmartWallet({ onBack }: SmartWalletProps) {
  const { address: adminAddress, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { data: WalletClient } = useWalletClient();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [agentAddress, setAgentAddress] = useState<string>();
  const [smartWallet, setSmartWallet] = useState<string>();
  const [pendingMsg, setPendingMsg] = useState<string>();
  const [signatureId, setSignatureId] = useState<string>();
  const [status, setStatus] = useState<string>('');
  const [isExistingSigner, setIsExistingSigner] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [agentTools, setAgentTools] = useState<any>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('setup'); // 'setup' or 'chat'
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  async function onPasswordSubmit(pwd: string) {
    setShowPwdModal(false);
    setCurrentPassword(pwd);
    setStatus('Generating agent key…');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const ag = await createAgentKey(pwd, adminAddress as string);
      setAgentAddress(ag);

      setStatus('Calling backend to create smart wallet…');
      const resp = await fetch('/api/crossmint/create-agent-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminAddress, permissions, agentAddress: ag }),
      });
      const j = await resp.json();
      if (!j.success) throw new Error(j.error || 'backend error');

      if (j.isExistingSigner) {
        setSmartWallet(j.smartWalletAddress);
        setIsExistingSigner(true);
        setStatus('Agent is already a signer. Initializing tools…');
        setAgentTools(true);
        setStatus('Agent tools initialized successfully!');
        return;
      }

      setSmartWallet(j.smartWalletAddress);
      setPendingMsg(j.signatureRequired.message);
      setSignatureId(j.signatureRequired.signatureId);
      setIsExistingSigner(false);
      setStatus('Ready to approve signer. Please sign the message.');
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
  }

  async function onApprove() {
    if (!WalletClient || !pendingMsg || !signatureId || !adminAddress || !smartWallet) return;

    setStatus('Signing approval…');
    try {
      const sig = await WalletClient.signMessage({
        message: { raw: hexToBytes(pendingMsg as `0x${string}`) },
      });

      setStatus('Sending approval to backend…');
      const resp = await fetch('/api/crossmint/approve-agent-signer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smartWalletAddress: smartWallet,
          signatureId,
          adminSignerLocator: `evm-keypair:${adminAddress}`,
          signature: sig,
        }),
      });
      const j = await resp.json();
      if (!j.success) throw new Error(j.error || 'approve error');

      await initializeAgentTools();
      setStatus('Agent signer approved! Agent ready for AI commands.');
      setPendingMsg(undefined);
      setSignatureId(undefined);
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
  }

  async function initializeAgentTools() {
    if (!smartWallet || !agentAddress || !currentPassword) return;
    try {
      setStatus('Initializing AI agent tools…');
      setAgentTools(true);
      setStatus('Agent tools initialized successfully!');
    } catch (e: any) {
      setStatus('Tool init error: ' + e.message);
      console.error(e);
    }
  }

  async function processAIPrompt() {
    if (!agentTools || !prompt.trim() || !currentPassword || !agentAddress) return;

    const userMessage: CoreMessage = { role: 'user', content: prompt };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setPrompt('');
    setIsProcessing(true);
    setStatus('Processing AI request…');
    
    try {
      const keyIdentifier = `agentKey_${agentAddress}`;
      const encryptedRecord = localStorage.getItem(keyIdentifier);

      if (!encryptedRecord) {
        throw new Error(`No encrypted key found in local storage for agent ${agentAddress}`);
      }

      const response = await fetch('/api/crossmint/agent-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: currentPassword,
          messages: updatedMessages,
          smartWallet,
          userAddress: adminAddress,
          encryptedRecord: JSON.parse(encryptedRecord),
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'AI processing failed');
      }
      
      const assistantMessage: CoreMessage = { role: 'assistant', content: result.response };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      setStatus('AI request completed successfully!');
    } catch (error: any) {
      const errorMessage: CoreMessage = { role: 'assistant', content: `Error: ${error.message}` };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      setStatus('Error processing AI request: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  const removePermission = (i: number) =>
    setPermissions(permissions.filter((_, idx) => idx !== i));

  const updatePermission = (i: number, field: string, value: any) => {
    const copy = [...permissions];
    copy[i] = {
      ...copy[i],
      data: { ...copy[i].data, [field]: value },
    };
    setPermissions(copy);
  };

  const addPermission = (type: Permission['type']) => {
    const template: Permission =
      type === 'native-token-transfer'
        ? { type, data: { allowance: '' } }
        : type === 'erc20-token-transfer'
        ? { type, data: { address: '', allowance: '' } }
        : type === 'erc721-token-transfer'
        ? { type, data: { address: '', tokenId: '' } }
        : { type, data: { address: '', tokenId: '', amount: '' } };
    setPermissions([...permissions, template]);
  };

  return (
    <div className="relative z-10 p-6 w-4/5 mx-auto max-w-7xl">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6 mt-20">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to AI Chat</span>
        </button>
        <div className='flex flex-col items-center'>
        <h2 className="text-3xl font-light font-redHatDisplay text-white bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
          Smart Wallet + AI Agent
        </h2>
        <span className='underline italic text-blue-500 text-xs'>Powered by Crossmint</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-400/20">
          <Sparkles className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400 text-xs font-medium">Beta</span>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-gradient-to-r from-blue-900/20 to-green-900/20 backdrop-blur-md border border-blue-500/20 rounded-xl p-5 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-start space-x-4">
            <div className="mt-1 p-2 bg-blue-500/10 rounded-lg">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Streamlined IP Registration with AI & Blockchain</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-3">
                This tool simplifies the process of registering intellectual property on the Story Protocol blockchain using AI assistance. 
                We've integrated Crossmint's Story Kit and endpoints, along with the GOAT SDK and its plugins. 
                Additionally, we've incorporated a custom Tavily plugin for enhanced web search capabilities.
              </p>
              <p className="text-white/80 text-sm leading-relaxed">
                The system creates a Smart Wallet via Crossmint with your wallet address as the owner. The AI agent acts as a delegated 
                signer, allowing you to allocate specific funds for the agent to use. This design protects against overuse 
                while enabling the agent to independently register IP on your behalf.
              </p>
              <div className="mt-3 px-3 py-1.5 bg-amber-500/10 border border-amber-400/20 rounded-lg inline-flex items-center">
                <Info className="w-4 h-4 text-amber-400 mr-2" />
                <span className="text-xs text-amber-300">This feature is in beta testing and may undergo improvements in future updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Navigation */}
        <div className="lg:w-1/4">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
            {/* Navigation Tabs */}
            <div className="p-1">
              <button
                onClick={() => setActiveTab('setup')}
                className={`flex items-center w-full p-3 mb-1 rounded-lg text-sm transition-colors ${
                  activeTab === 'setup' 
                    ? 'bg-white/10 text-white font-medium'
                    : 'hover:bg-white/5 text-white/70'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mr-3" />
                <span>Agent Setup</span>
                {agentTools && <span className="ml-auto text-green-400 text-xs">✓ Active</span>}
              </button>
              
              <button
                onClick={() => setActiveTab('chat')}
                disabled={!agentTools}
                className={`flex items-center w-full p-3 rounded-lg text-sm transition-colors ${
                  !agentTools ? 'opacity-50 cursor-not-allowed text-white/40' :
                  activeTab === 'chat'
                    ? 'bg-white/10 text-white font-medium'
                    : 'hover:bg-white/5 text-white/70'
                }`}
              >
                <MessageCircle className="w-4 h-4 mr-3" />
                <span>AI Agent Chat</span>
                {activeTab === 'chat' && <ChevronRight className="ml-auto w-4 h-4" />}
              </button>
            </div>
            
            {/* Status Card */}
            <div className="p-4 mt-3 border-t border-white/10 bg-white/[0.03]">
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Status</div>
              <div className="flex items-center space-x-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${agentTools ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
                <span className={`text-sm font-medium ${agentTools ? 'text-green-400' : 'text-amber-400'}`}>
                  {agentTools ? 'Agent Ready' : 'Setup Required'}
                </span>
              </div>
              <p className="text-xs text-white/60 line-clamp-2">{status}</p>
            </div>
          </div>
          
          {/* Wallet Info */}
          {(smartWallet || agentAddress) && (
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden mt-4 p-4">
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Wallet Information</div>
              
              {agentAddress && (
                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Bot className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-white/80">Agent Address</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-xs text-white/70 font-mono break-all">
                    {agentAddress}
                  </div>
                </div>
              )}
              
              {smartWallet && (
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Wallet className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-medium text-white/80">Smart Wallet</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-xs text-white/70 font-mono break-all">
                    {smartWallet}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Right Side - Content Area */}
        <div className="lg:w-3/4">
          {/* Setup Tab */}
          {activeTab === 'setup' && (
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-xl p-8 max-w-md mx-auto">
                    <Wallet className="w-12 h-12 text-blue-400/70 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Connect Your Wallet</h3>
                    <p className="text-white/60 mb-6">Connect your wallet to start setting up your Smart Wallet and AI Agent</p>
                    <button 
                      onClick={openConnectModal}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-green-500/20 hover:from-blue-500/30 hover:to-green-500/30 border border-blue-500/30 rounded-xl text-blue-300 transition-all duration-200 font-medium"
                    >
                      Connect Wallet
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Connection Info */}
                  <div className="flex items-center justify-between mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white/70 mb-1">Connected as Admin</div>
                        <div className="text-white font-mono text-sm">{adminAddress}</div>
                      </div>
                    </div>
                    <div className="bg-green-500/10 px-3 py-1 rounded-full text-green-400 text-xs font-medium">
                      Connected
                    </div>
                  </div>

                  {/* Setup Steps */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium text-white flex items-center">
                      <span className="relative flex h-3 w-3 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      Create Agent Wallet
                    </h3>
                    <p className="text-white/60 text-sm mb-3 ml-5 pl-1">
                      Create a password-encrypted agent key that will act as a delegated signer for your Smart Wallet
                    </p>
                    <button 
                      onClick={() => setShowPwdModal(true)}
                      className="w-full py-3 px-6 bg-gradient-to-r from-blue-500/20 to-green-500/20 hover:from-blue-500/30 hover:to-green-500/30 border border-blue-500/30 rounded-xl text-blue-300 transition-all duration-200 flex items-center justify-center"
                    >
                      {agentAddress ? "Recreate Agent Wallet" : "Create Agent Wallet"}
                      {!agentAddress && <ChevronRight className="ml-2 w-4 h-4" />}
                    </button>
                  </div>

                  {/* Token Permissions */}
                  <div className="space-y-2 mt-8">
                    <h3 className="text-lg font-medium text-white flex items-center mb-2">
                      <Coins className="w-5 h-5 mr-2 text-amber-400" />
                      Token Permissions
                    </h3>
                    <p className="text-white/60 text-sm mb-4">
                      Define which tokens and amounts your AI agent can access. This protects your assets while allowing the agent to perform transactions.
                    </p>
                    
                    <div className="flex justify-end mb-2">
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            addPermission(e.target.value as Permission['type']);
                            e.target.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 hover:bg-white/10 transition-colors"
                      >
                        <option value="">Add Permission</option>
                        <option value="native-token-transfer">Native Token (ETH)</option>
                        <option value="erc20-token-transfer">ERC20 Token</option>
                        <option value="erc721-token-transfer">ERC721 NFT</option>
                        <option value="erc1155-token-transfer">ERC1155 Token</option>
                      </select>
                    </div>

                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                      {permissions.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-white/20 rounded-xl bg-white/[0.02]">
                          <p className="text-white/40 text-sm">No permissions added yet</p>
                          <p className="text-white/30 text-xs mt-1">Add permissions to allow your agent to move tokens</p>
                        </div>
                      ) : (
                        permissions.map((perm, i) => (
                          <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <span className=" capitalize text-sm font-medium px-2 py-1 bg-blue-500/10 rounded-md text-blue-300">
                                {perm.type.replace(/-/g, ' ')}
                              </span>
                              <button 
                                onClick={() => removePermission(i)}
                                className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {perm.type === 'native-token-transfer' && (
                              <div className="space-y-2">
                                <div className="flex items-center mb-1">
                                  <span className="text-xs text-white/60">Maximum allowance in wei:</span>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Allowance (e.g. 1000000000000000000)"
                                  value={perm.data.allowance || ''}
                                  onChange={e => updatePermission(i, 'allowance', e.target.value)}
                                  className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                                />
                              </div>
                            )}

                            {perm.type === 'erc20-token-transfer' && (
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center mb-1">
                                    <span className="text-xs text-white/60">Token contract address:</span>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Contract Address (0x...)"
                                    value={perm.data.address || ''}
                                    onChange={e => updatePermission(i, 'address', e.target.value)}
                                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center mb-1">
                                    <span className="text-xs text-white/60">Maximum allowance in token units:</span>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Allowance (e.g. 1000000000000000000)"
                                    value={perm.data.allowance || ''}
                                    onChange={e => updatePermission(i, 'allowance', e.target.value)}
                                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                                  />
                                </div>
                              </div>
                            )}

                            {perm.type === 'erc721-token-transfer' && (
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center mb-1">
                                    <span className="text-xs text-white/60">NFT contract address:</span>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Contract Address (0x...)"
                                    value={perm.data.address || ''}
                                    onChange={e => updatePermission(i, 'address', e.target.value)}
                                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center mb-1">
                                    <span className="text-xs text-white/60">Token ID:</span>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Token ID (e.g. 1234)"
                                    value={perm.data.tokenId || ''}
                                    onChange={e => updatePermission(i, 'tokenId', e.target.value)}
                                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                                  />
                                </div>
                              </div>
                            )}

                            {perm.type === 'erc1155-token-transfer' && (
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center mb-1">
                                    <span className="text-xs text-white/60">Token contract address:</span>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Contract Address (0x...)"
                                    value={perm.data.address || ''}
                                    onChange={e => updatePermission(i, 'address', e.target.value)}
                                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center mb-1">
                                    <span className="text-xs text-white/60">Token ID:</span>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Token ID (e.g. 1234)"
                                    value={perm.data.tokenId || ''}
                                    onChange={e => updatePermission(i, 'tokenId', e.target.value)}
                                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center mb-1">
                                    <span className="text-xs text-white/60">Amount:</span>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Amount (e.g. 10)"
                                    value={perm.data.amount || ''}
                                    onChange={e => updatePermission(i, 'amount', e.target.value)}
                                    className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Approve Button */}
                  {pendingMsg && signatureId && !isExistingSigner && (
                    <div className="mt-6 p-5 bg-green-500/10 rounded-xl border border-green-400/20">
                      <h4 className="text-green-300 font-medium mb-2">Authorization Required</h4>
                      <p className="text-white/70 text-sm mb-4">
                        One more step! You need to authorize your agent as a signer for your smart wallet.
                        This allows it to perform transactions within the permission limits you've set.
                      </p>
                      <button 
                        onClick={onApprove}
                        className="w-full py-3 px-6 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl text-green-300 transition-all duration-200 font-medium"
                      >
                        Finalize Authorization
                      </button>
                    </div>
                  )}

                  {/* Success Message */}
                  {agentTools && (
                    <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-5 text-center">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="w-6 h-6 text-green-400" />
                      </div>
                      <h4 className="text-green-300 font-medium mb-2">
                        {isExistingSigner 
                          ? 'Agent Already Authorized' 
                          : 'Agent Successfully Authorized'}
                      </h4>
                      <p className="text-white/70 text-sm mb-4">
                        {isExistingSigner 
                          ? 'Your AI agent is configured and ready to help with your IP registration and blockchain operations.' 
                          : 'Your AI agent is now authorized and ready to help with your IP registration and blockchain operations.'}
                      </p>
                      <button 
                        onClick={() => setActiveTab('chat')}
                        className="px-6 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-xl text-green-300 transition-all duration-200 text-sm inline-flex items-center"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Open Agent Chat
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-green-400 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">ChainIntellect</h3>
                    <p className="text-white/60 text-xs">AI Agent Assistant</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="px-2 py-0.5 bg-green-500/10 rounded text-green-400 text-xs">Online</div>
                </div>
              </div>
              
              <div
                ref={chatContainerRef}
                className="h-[calc(70vh-10rem)] overflow-y-auto p-5 space-y-4 custom-scrollbar"
                style={{ scrollBehavior: "smooth" }}
              >
                {/* Welcome Message */}
                {messages.length === 0 && (
                  <div className="flex justify-start mb-6">
                    <div className="bg-white/10 rounded-xl p-4 max-w-[80%] relative">
                      <div className="text-xs text-white/60 mb-1">ChainIntellect</div>
                      <p className="text-white/90 whitespace-pre-wrap">
                        Hello! I'm your AI agent assistant for IP registration on Story Protocol. 
                        I can help you register your digital assets, manage your IP, and execute blockchain transactions within your permission limits.
                        <br/><br/>
                        What would you like to do today?
                      </p>
                    </div>
                  </div>
                )}
                
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-xl ${
                      msg.role === 'user' 
                        ? 'bg-blue-500/20 text-blue-100' 
                        : 'bg-white/10 text-white/90'
                    }`}>
                      <div className="text-xs opacity-70 mb-1">
                        {msg.role === 'user' ? 'You' : 'ChainIntellect'}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content as string}</div>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-xl p-4 max-w-[80%]">
                      <div className="text-xs text-white/60 mb-2">ChainIntellect</div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-white/10">
                <form onSubmit={(e) => { e.preventDefault(); processAIPrompt(); }} className="flex gap-3">
                  <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Ask your AI agent about IP registration or blockchain operations..."
                    className="flex-1 p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    disabled={isProcessing}
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || !prompt.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-green-500/20 hover:from-blue-500/30 hover:to-green-500/30 border border-blue-500/30 rounded-xl text-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Thinking...' : 'Send'}
                  </button>
                </form>
                <p className="mt-2 text-xs text-white/40 text-center">
                  The AI agent can perform actions based on the permissions you've granted
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      <PasswordModal
        open={showPwdModal}
        onSubmit={onPasswordSubmit}
        onClose={() => setShowPwdModal(false)}
      />
      
      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
}