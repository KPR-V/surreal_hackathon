'use client';
import React, { useState,useRef ,useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@tomo-inc/tomo-evm-kit';
import PasswordModal from './passwordmodal';
import { useWalletClient } from 'wagmi';
import { hexToBytes } from 'viem';
import "dotenv/config"
import { createAgentKey } from './wallet';
import { CoreMessage } from 'ai';
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

export default function HomePage() {
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
    //  await  initializeAgentTools();
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
    if (
      !WalletClient ||
      !pendingMsg ||
      !signatureId ||
      !adminAddress ||
      !smartWallet
    ) return;

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
      

      // await decryptAgentKey(agentAddress, currentPassword);
      

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
    setPrompt(''); // Clear the input field
    setIsProcessing(true);
    setStatus('Processing AI request…');
    try {
      // 1. Read the encrypted record from localStorage on the client
      const keyIdentifier = `agentKey_${agentAddress}`;
      const encryptedRecord = localStorage.getItem(keyIdentifier);
  
      if (!encryptedRecord) {
        throw new Error(`No encrypted key found in local storage for agent ${agentAddress}`);
      }
  
      // 2. Send the encrypted record to the backend
      const response = await fetch('/api/crossmint/agent-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: currentPassword, 
          messages: updatedMessages,
          smartWallet,
          userAddress: adminAddress,
          // Add the encrypted data to the payload
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

  // Styles
  const sectionStyle = {
    marginTop: 30,
    padding: 25,
    background: '#181c24',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
  };
  const inputStyle = {
    padding: '12px',
    border: '1px solid #333',
    borderRadius: '8px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box' as const,
    background: '#23272f',
    color: '#fff',
    marginTop: 4,
    marginBottom: 8,
    transition: 'border-color 0.2s ease',
  };

  return (
    <div style={{
      padding: 40,
      maxWidth: 600,
      margin: 'auto',
      fontFamily: 'sans-serif',
      lineHeight: 1.6,
      color: '#fff'
    }}>
      <h1 style={{
        textAlign: 'center',
        marginBottom: 30,
        fontSize: '28px'
      }}>
        Smart-Wallet + AI Agent Setup
      </h1>

      {!isConnected ? (
        <button onClick={openConnectModal} style={{
          width: '100%',
          padding: '12px 20px',
          fontSize: '16px',
          background: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer'
        }}>
          Connect Wallet
        </button>
      ) : (
        <>
          <p>Admin EOA: <code>{adminAddress}</code></p>
          <button onClick={() => setShowPwdModal(true)} style={{
            width: '100%',
            padding: '12px 20px',
            fontSize: '16px',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer'
          }}>
            Create Agent Wallet
          </button>

          <section style={sectionStyle}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 25
            }}>
              <h2 style={{ fontSize: '20px' }}>Token Permissions</h2>
              <select
                onChange={e => {
                  if (e.target.value) {
                    addPermission(e.target.value as Permission['type']);
                    e.target.value = '';
                  }
                }}
                style={{
                  width: 200,
                  padding: '12px 16px',
                  background: '#23272f',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                <option value="">Add Permission</option>
                <option value="native-token-transfer">Native Token</option>
                <option value="erc20-token-transfer">ERC20 Token</option>
                <option value="erc721-token-transfer">ERC721 NFT</option>
                <option value="erc1155-token-transfer">ERC1155</option>
              </select>
            </div>

            {permissions.map((perm, i) => (
              <div key={i} style={{
                marginBottom: 15,
                padding: 20,
                background: '#23272f',
                borderRadius: 8,
                border: '1px solid #333'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ textTransform: 'capitalize' }}>
                    {perm.type.replace(/-/g, ' ')}
                  </span>
                  <button onClick={() => removePermission(i)} style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: 18
                  }}>✕</button>
                </div>

                {perm.type === 'native-token-transfer' && (
                  <div style={{ marginTop: 15, paddingLeft: 10, borderLeft: '2px solid #0070f3' }}>
                    <label style={{ color: '#aaa' }}>
                      Allowance:
                      <input
                        type="text"
                        placeholder="e.g. 1000000000000000000"
                        value={perm.data.allowance || ''}
                        onChange={e => updatePermission(i, 'allowance', e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                  </div>
                )}

                {perm.type === 'erc20-token-transfer' && (
                  <div style={{ marginTop: 15, paddingLeft: 10, borderLeft: '2px solid #0070f3' }}>
                    <label style={{ color: '#aaa' }}>
                      Contract Address:
                      <input
                        type="text"
                        placeholder="0x..."
                        value={perm.data.address || ''}
                        onChange={e => updatePermission(i, 'address', e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ color: '#aaa' }}>
                      Allowance:
                      <input
                        type="text"
                        placeholder="e.g. 1000000000000000000"
                        value={perm.data.allowance || ''}
                        onChange={e => updatePermission(i, 'allowance', e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                  </div>
                )}

                {perm.type === 'erc721-token-transfer' && (
                  <div style={{ marginTop: 15, paddingLeft: 10, borderLeft: '2px solid #0070f3' }}>
                    <label style={{ color: '#aaa' }}>
                      Contract Address:
                      <input
                        type="text"
                        placeholder="0x..."
                        value={perm.data.address || ''}
                        onChange={e => updatePermission(i, 'address', e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ color: '#aaa' }}>
                      Token ID:
                      <input
                        type="text"
                        placeholder="e.g. 1234"
                        value={perm.data.tokenId || ''}
                        onChange={e => updatePermission(i, 'tokenId', e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                  </div>
                )}

                {perm.type === 'erc1155-token-transfer' && (
                  <div style={{ marginTop: 15, paddingLeft: 10, borderLeft: '2px solid #0070f3' }}>
                    <label style={{ color: '#aaa' }}>
                      Contract Address:
                      <input
                        type="text"
                        placeholder="0x..."
                        value={perm.data.address || ''}
                        onChange={e => updatePermission(i, 'address', e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ color: '#aaa' }}>
                      Token ID:
                      <input
                        type="text"
                        placeholder="e.g. 1234"
                        value={perm.data.tokenId || ''}
                        onChange={e => updatePermission(i, 'tokenId', e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ color: '#aaa' }}>
                      Amount:
                      <input
                        type="text"
                        placeholder="e.g. 10"
                        value={perm.data.amount || ''}
                        onChange={e => updatePermission(i, 'amount', e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}
          </section>

          {agentTools && (
            <section style={sectionStyle}>
              <h2 style={{ fontSize: '20px', marginBottom: 20 }}>AI Agent Chat</h2>
              
              <div ref={chatContainerRef} style={{ border: '1px solid #333', padding: '15px', height: '400px', overflowY: 'scroll', marginBottom: '20px', borderRadius: '8px', background: '#101217' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ marginBottom: '15px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  background: msg.role === 'user' ? '#0070f3' : '#2a2f38',
                  color: 'white',
                  padding: '10px 15px', 
                  borderRadius: '18px', 
                  maxWidth: '75%',
                  lineHeight: '1.5'
                }}>
                  <strong style={{ display: 'block', marginBottom: '5px', opacity: 0.8 }}>{msg.role === 'user' ? 'You' : 'ChainIntellect'}</strong>
                  {/* Use pre-wrap to respect newlines in the agent's response */}
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg?.content as string}</p>
                </div>
              </div>
            ))}
          </div>
              
              
              
              <form onSubmit={(e) => { e.preventDefault(); processAIPrompt(); }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ask your AI agent..."
                style={{...inputStyle, flexGrow: 1, margin: 0}}
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing || !prompt.trim()}
                style={{
                  padding: '12px 20px',
                  fontSize: '16px',
                  background: isProcessing ? '#666' : '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer'
                }}
              >
                {isProcessing ? 'Thinking...' : 'Send'}
              </button>
            </div>
          </form>
            </section>
          )}

          {agentAddress && (
            <p>Agent Address: <code>{agentAddress}</code></p>
          )}
          {smartWallet && (
            <p>Smart Wallet: <code>{smartWallet}</code></p>
          )}

          {pendingMsg && signatureId && !isExistingSigner && (
            <button onClick={onApprove} style={{
              width: '100%',
              marginTop: 20,
              padding: '12px 20px',
              fontSize: '16px',
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}>
              Finalize Authorization
            </button>
          )}

          {agentTools && (
            <p style={{ 
              color: '#4caf50', 
              marginTop: 20, 
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '10px',
              background: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}>
              {isExistingSigner 
                ? '✅ Agent was already authorized and is ready for AI commands!' 
                : '✅ Agent successfully authorized and ready for AI commands!'}
            </p>
          )}

          <p style={{ marginTop: 20, fontStyle: 'italic' }}>
            Status: {status}
          </p>

          <PasswordModal
            open={showPwdModal}
            onSubmit={onPasswordSubmit}
            onClose={() => setShowPwdModal(false)}
          />
        </>
      )}
    </div>
  );
}
