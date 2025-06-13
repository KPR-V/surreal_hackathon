"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { transfer_royalty_token } from '../../../lib/story/IP_account/transfer_royaltytoken';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';

interface BuyRTModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: string;
    ipId: string;
    royaltyVaultAddress: string;
    nftAsset: {
      id: string;
      name: string;
      image_url?: string;
      token: {
        address: string;
        name: string;
        symbol: string;
      };
    };
    percentageToSell: number;
    pricePerTokenIP: number;
    listedAt: string;
    ownerAddress?: string; // Add owner address to listing interface
  };
  onPurchaseComplete?: (txHash: string) => void;
}

interface TransactionResult {
  success: boolean;
  txHash?: string;
  receipt?: any;
  message: string;
}

export const BuyRTModal: React.FC<BuyRTModalProps> = ({
  isOpen,
  onClose,
  listing,
  onPurchaseComplete
}) => {
  const { address: buyerAddress, isConnected } = useAccount();
  const { getStoryClient, isReady } = useStoryClient();
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  const [estimatedNetworkFee, setEstimatedNetworkFee] = useState<number>(0.0015); // Mock network fee

  // IP token exchange rate
  const IP_TOKEN_USD_RATE = 4.15;

  // Calculate transaction details
  const totalIPCost = listing.percentageToSell * listing.pricePerTokenIP;
  const totalUSDEquivalent = totalIPCost * IP_TOKEN_USD_RATE;
  const totalWithFees = totalIPCost + estimatedNetworkFee;
  const totalUSDWithFees = totalWithFees * IP_TOKEN_USD_RATE;

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setAgreedToTerms(false);
      setTransactionResult(null);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handlePurchase = async () => {
    if (!isConnected || !buyerAddress || !isReady) {
      setTransactionResult({
        success: false,
        message: 'Please connect your wallet to continue with the purchase.'
      });
      return;
    }

    if (!agreedToTerms) {
      setTransactionResult({
        success: false,
        message: 'Please agree to the terms and conditions before proceeding.'
      });
      return;
    }

    setIsPurchasing(true);
    setTransactionResult(null);

    try {
      // Get Story client
      const client = await getStoryClient();
      
      console.log('Initiating purchase with parameters:', {
        percentageToSell: listing.percentageToSell,
        royaltyVaultAddress: listing.royaltyVaultAddress,
        ipId: listing.ipId,
        buyerAddress,
        totalWithFees: totalWithFees
      });

      // Convert percentage to number of royalty tokens
      // For example: 5% = 5 tokens, 10% = 10 tokens, etc.
      const numberOfRoyaltyTokens = listing.percentageToSell.toString();
      
      // Execute the royalty token transfer with correct parameters
      const result = await transfer_royalty_token(
        numberOfRoyaltyTokens,        // Amount: number of royalty tokens (converted from percentage)
        listing.royaltyVaultAddress,  // Royalty contract address: use the royalty vault address
        listing.ipId,                 // IP ID
        buyerAddress,                 // Receiver address: buyer's wallet address
        client                        // Story client
      );

      console.log('Transfer function result:', result);

      // Check if the transfer was successful
      if (result && typeof result === 'string' && result.includes('Transaction hash:')) {
        // Extract transaction hash from result string
        const txHashMatch = result.match(/Transaction hash: (0x[a-fA-F0-9]{64})/);
        const txHash = txHashMatch ? txHashMatch[1] : '';
        
        // Extract receipt if available
        const receiptMatch = result.match(/transaction receipt: (.+)$/);
        const receipt = receiptMatch ? receiptMatch[1] : '';

        console.log('Extracted transaction details:', {
          txHash,
          receipt,
          originalResult: result
        });

        setTransactionResult({
          success: true,
          txHash,
          receipt,
          message: `Successfully purchased ${listing.percentageToSell}% of royalty tokens! 
          
Transaction Details:
• Royalty Tokens Transferred: ${numberOfRoyaltyTokens} tokens
• From Vault: ${listing.royaltyVaultAddress}
• To Buyer: ${buyerAddress}
• IP Asset: ${listing.ipId}

You will now receive ${listing.percentageToSell}% of all future royalties from this IP asset.`
        });

        // Update localStorage to mark listing as sold
        const existingListings = JSON.parse(localStorage.getItem('royaltyTokenListings') || '[]');
        const updatedListings = existingListings.map((item: any) => 
          item.id === listing.id 
            ? { 
                ...item, 
                status: 'sold', 
                soldTo: buyerAddress, 
                soldAt: new Date().toISOString(),
                soldPrice: totalWithFees,
                txHash: txHash,
                receipt: receipt,
                tokensTransferred: numberOfRoyaltyTokens,
                royaltyVaultUsed: listing.royaltyVaultAddress
              }
            : item
        );
        localStorage.setItem('royaltyTokenListings', JSON.stringify(updatedListings));

        // Call completion callback with transaction hash
        onPurchaseComplete?.(txHash);

        // Auto-close after 8 seconds on success
        setTimeout(() => {
          onClose();
          setTransactionResult(null);
          setAgreedToTerms(false);
        }, 8000);

      } else {
        // Handle case where transfer failed or returned unexpected format
        throw new Error('Transaction failed or returned unexpected response format. Result: ' + JSON.stringify(result));
      }

    } catch (error) {
      console.error('Purchase failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error cases
        if (errorMessage.includes('0x8ea0b111')) {
          errorMessage = `❌ Insufficient Royalty Tokens

The IP account does not have ${listing.percentageToSell} royalty tokens available for transfer.

Details:
• IP Account: ${listing.ipId}
• Royalty Vault: ${listing.royaltyVaultAddress}
• Tokens Requested: ${listing.percentageToSell}
• Buyer: ${buyerAddress}

This could mean:
• The IP account doesn't own enough royalty tokens
• The tokens have already been sold or transferred
• The royalty vault is empty or not properly configured

Please verify the listing details or contact the seller.`;
        } else if (errorMessage.includes('executeBatch')) {
          errorMessage = `❌ Transaction Execution Failed

Unable to execute the royalty token transfer from the IP account.

Transfer Parameters:
• Amount: ${listing.percentageToSell} tokens
• From: ${listing.royaltyVaultAddress}
• To: ${buyerAddress}
• IP ID: ${listing.ipId}

Common causes:
• IP account lacks sufficient royalty tokens
• Royalty vault is not properly configured
• Invalid permissions or addresses`;
        } else if (errorMessage.includes('insufficient funds')) {
          errorMessage = `❌ Insufficient Wallet Balance

You don't have enough IP tokens to complete this purchase.

Required: ${totalWithFees.toFixed(3)} IP tokens
Please add more IP tokens to your wallet: ${buyerAddress}`;
        } else if (errorMessage.includes('Failed to transfer Erc20')) {
          errorMessage = `❌ ERC20 Transfer Failed

The royalty token transfer could not be completed.

Transaction Details:
• Tokens: ${listing.percentageToSell}
• Vault: ${listing.royaltyVaultAddress}
• Receiver: ${buyerAddress}

This typically indicates the IP account doesn't have the requested royalty tokens available.`;
        }
      }
      
      setTransactionResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/30 rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">Purchase Royalty Tokens</h2>
                  <p className="text-xs text-zinc-400">Buy a share of future royalties from this IP asset</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                disabled={isPurchasing}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Transaction Result Display */}
          {transactionResult && (
            <div className={`mx-6 mt-4 p-4 rounded-lg border ${
              transactionResult.success
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-start space-x-3">
                <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  transactionResult.success ? 'text-green-400' : 'text-red-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {transactionResult.success ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-2 ${
                    transactionResult.success ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {transactionResult.success ? '✅ Purchase Successful!' : '❌ Purchase Failed'}
                  </p>
                  <p className={`text-xs mb-3 whitespace-pre-line ${
                    transactionResult.success ? 'text-green-200' : 'text-red-200'
                  }`}>
                    {transactionResult.message}
                  </p>
                  
                  {transactionResult.success && transactionResult.txHash && (
                    <div className="space-y-3">
                      {/* Transaction Hash - Prominent Display */}
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-green-300">🎉 Transaction Hash</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(transactionResult.txHash!);
                            }}
                            className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-xs transition-colors"
                            title="Copy transaction hash"
                          >
                            Copy
                          </button>
                        </div>
                        <code className="text-xs text-green-300 font-mono break-all block bg-zinc-800/50 p-2 rounded">
                          {transactionResult.txHash}
                        </code>
                      </div>

                      {/* Transaction Receipt */}
                      {transactionResult.receipt && (
                        <div className="bg-zinc-800/30 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-zinc-400">Transaction Receipt</p>
                            <button
                              onClick={() => {
                                const receiptText = typeof transactionResult.receipt === 'string' 
                                  ? transactionResult.receipt 
                                  : JSON.stringify(transactionResult.receipt);
                                navigator.clipboard.writeText(receiptText);
                              }}
                              className="px-2 py-1 bg-zinc-700/50 hover:bg-zinc-600/50 text-zinc-300 rounded text-xs transition-colors"
                              title="Copy receipt"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="bg-zinc-900/50 rounded p-2 max-h-24 overflow-y-auto">
                            <code className="text-xs text-green-300 font-mono break-all">
                              {typeof transactionResult.receipt === 'string' 
                                ? transactionResult.receipt 
                                : JSON.stringify(transactionResult.receipt, null, 2)
                              }
                            </code>
                          </div>
                        </div>
                      )}

                      {/* Transfer Summary */}
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                        <h5 className="text-xs font-medium text-green-300 mb-2">Transfer Summary</h5>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Royalty Tokens:</span>
                            <span className="text-green-300 font-medium">{listing.percentageToSell} tokens</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">From Vault:</span>
                            <span className="text-green-300 font-mono text-xs">{listing.royaltyVaultAddress.slice(0, 10)}...{listing.royaltyVaultAddress.slice(-8)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">To Buyer:</span>
                            <span className="text-green-300 font-mono text-xs">{buyerAddress?.slice(0, 10)}...{buyerAddress?.slice(-8)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">IP Asset:</span>
                            <span className="text-green-300 font-mono text-xs">{listing.ipId.slice(0, 10)}...{listing.ipId.slice(-8)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Total Paid:</span>
                            <span className="text-green-300 font-medium">{totalWithFees.toFixed(3)} IP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            
            {/* IP Asset Overview */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 rounded-xl overflow-hidden flex-shrink-0">
                  {listing.nftAsset.image_url ? (
                    <img 
                      src={listing.nftAsset.image_url} 
                      alt={listing.nftAsset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-2">{listing.nftAsset.name}</h3>
                  <p className="text-sm text-zinc-400 mb-3">{listing.nftAsset.token.symbol} • Token #{listing.nftAsset.id}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500">Listed:</span>
                      <span className="text-zinc-300 ml-1">{formatTimeAgo(listing.listedAt)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Token Contract:</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(listing.nftAsset.token.address)}
                        className="text-green-400 hover:text-green-300 ml-1 font-mono transition-colors"
                        title="Click to copy"
                      >
                        {truncateAddress(listing.nftAsset.token.address)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What You're Buying Section */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-300 mb-2">What You're Purchasing</h4>
                  <p className="text-xs text-blue-200 mb-3">
                    You're buying <span className="font-semibold text-blue-100">{listing.percentageToSell}%</span> of all future royalties 
                    from this IP asset. This means you'll receive <span className="font-semibold text-blue-100">{listing.percentageToSell}%</span> of 
                    any revenue generated when this IP is used, licensed, or generates income.
                  </p>
                  <div className="text-xs text-blue-200">
                    <strong>Example:</strong> If this IP generates $1,000 in royalties next month, 
                    you'll receive ${(listing.percentageToSell * 10).toFixed(2)} as your share.
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              
              {/* IP Asset Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">IP Asset Details</h4>
                <div className="space-y-2">
                  <div className="bg-zinc-800/30 rounded-lg p-3">
                    <p className="text-xs text-zinc-400 mb-1">IP Asset ID</p>
                    <div className="flex items-center justify-between">
                      <code className="text-xs text-zinc-300 font-mono">{truncateAddress(listing.ipId)}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(listing.ipId)}
                        className="p-1 text-zinc-400 hover:text-zinc-300 transition-colors"
                        title="Copy IP ID"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-800/30 rounded-lg p-3">
                    <p className="text-xs text-zinc-400 mb-1">Royalty Vault</p>
                    <div className="flex items-center justify-between">
                      <code className="text-xs text-zinc-300 font-mono">{truncateAddress(listing.royaltyVaultAddress)}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(listing.royaltyVaultAddress)}
                        className="p-1 text-zinc-400 hover:text-zinc-300 transition-colors"
                        title="Copy Vault Address"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Summary */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Purchase Summary</h4>
                <div className="bg-zinc-800/30 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Royalty Share:</span>
                    <span className="text-sm font-semibold text-purple-400">{listing.percentageToSell}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Price per 1%:</span>
                    <span className="text-sm text-blue-400">{listing.pricePerTokenIP.toFixed(3)} IP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Subtotal:</span>
                    <span className="text-sm text-white">{totalIPCost.toFixed(3)} IP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Network Fee:</span>
                    <span className="text-sm text-orange-400">{estimatedNetworkFee.toFixed(4)} IP</span>
                  </div>
                  <div className="border-t border-zinc-700/50 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-white">Total Cost:</span>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">{totalWithFees.toFixed(3)} IP</div>
                        <div className="text-xs text-zinc-400">(${totalUSDWithFees.toFixed(2)} USD)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buyer/Seller Info */}
            <div className="bg-zinc-800/20 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-white mb-3">Transaction Parties</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Seller (Current Owner)</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                      S
                    </div>
                    <code className="text-xs text-zinc-300 font-mono">
                      {listing.ownerAddress ? truncateAddress(listing.ownerAddress) : 'Unknown'}
                    </code>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Buyer (You)</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                      B
                    </div>
                    <code className="text-xs text-zinc-300 font-mono">
                      {buyerAddress ? truncateAddress(buyerAddress) : 'Not connected'}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-300 mb-2">Important Terms & Conditions</h4>
                  <ul className="text-xs text-yellow-200 space-y-1 mb-3">
                    <li>• This purchase is final and cannot be reversed</li>
                    <li>• You will own {listing.percentageToSell}% of future royalties permanently</li>
                    <li>• Royalty payments are distributed automatically by the smart contract</li>
                    <li>• The seller will no longer receive this portion of royalties</li>
                    <li>• All transactions are conducted in IP tokens on Story Protocol</li>
                  </ul>
                  
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms-agreement"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-green-400 bg-transparent border-2 border-yellow-400/50 rounded focus:ring-green-500 focus:ring-2"
                      disabled={isPurchasing}
                    />
                    <label htmlFor="terms-agreement" className="text-xs text-yellow-200 cursor-pointer">
                      I understand and agree to these terms. I confirm that I want to purchase {listing.percentageToSell}% 
                      of future royalties from this IP asset for {totalWithFees.toFixed(3)} IP tokens.
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            {!isConnected && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-300 mb-1">Wallet Not Connected</p>
                    <p className="text-xs text-red-200">Please connect your wallet to complete this purchase.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPurchasing}
                className={`flex-1 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 hover:text-white rounded-lg transition-all duration-200 border border-zinc-700/20 text-sm font-medium ${
                  isPurchasing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Cancel
              </button>
              
              <button
                onClick={handlePurchase}
                disabled={!isConnected || !agreedToTerms || isPurchasing || !isReady}
                className={`flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2 ${
                  (!isConnected || !agreedToTerms || isPurchasing || !isReady) ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'
                }`}
              >
                {isPurchasing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing Purchase...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>Purchase for {totalWithFees.toFixed(3)} IP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};