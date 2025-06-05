"use client";

import React, { useState, useEffect } from 'react';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';
import { mint_licensetoken } from '../../../lib/story/license_functions/mint_licensetoken';
import { useAccount } from 'wagmi';
import { MessageModal, MessageModalData } from '../../../components/ui/MessageModal';

interface LicenseConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLicense: any;
  ipId: string;
}

// Currency conversion service
const CurrencyService = {
  convertWeiToIP(weiAmount: string | number): number {
    const wei = typeof weiAmount === 'string' ? parseFloat(weiAmount) : weiAmount;
    if (isNaN(wei) || wei === 0) return 0;
    
    const eth = wei / 1000000000000000000;
    const usd = eth * 2500;
    const ipTokens = usd / 4.15;
    
    return ipTokens;
  },

  formatIPAmount(amount: number): string {
    if (amount === 0) return 'Free';
    if (amount < 0.0001) return `${amount.toExponential(2)} IP`;
    if (amount < 1) return `${amount.toFixed(4)} IP`;
    if (amount < 1000) return `${amount.toFixed(2)} IP`;
    return `${(amount / 1000).toFixed(2)}K IP`;
  },

  getUSDValue(ipAmount: number): string {
    const usd = ipAmount * 4.15;
    if (usd < 0.01) return '$0.00';
    if (usd < 1) return `$${usd.toFixed(3)}`;
    return `$${usd.toFixed(2)}`;
  }
};

export const LicenseConfigurationModal: React.FC<LicenseConfigurationModalProps> = ({
  isOpen,
  onClose,
  selectedLicense,
  ipId
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [licenseDetails, setLicenseDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  
  // Message Modal State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModalData, setMessageModalData] = useState<MessageModalData | null>(null);
  
  const { getStoryClient } = useStoryClient();

  const pages = ['Details', 'Pricing', 'Rights', 'Terms'];

  // Add these declarations to your component state declarations at the top
  // Right after other useState declarations, add:
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const termsContainerRef = React.useRef<HTMLDivElement>(null);

  // Fetch detailed license information
  useEffect(() => {
    const fetchLicenseDetails = async () => {
      if (!selectedLicense?.id || !isOpen) {
        setDetailsLoaded(false);
        return;
      }
      
      try {
        setDetailsLoaded(false); // Reset the loaded state
        setDetailsLoading(true);
        
        const response = await fetch(`/api/licenses/terms/${selectedLicense.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setLicenseDetails(data);
          setDetailsLoaded(true); // Set to true when details are loaded
        } else {
          // Even if API fails, we should allow user to proceed
          console.error('Failed to fetch license details:', response.status);
          setDetailsLoaded(true); 
        }
      } catch (error) {
        console.error('Error fetching license details:', error);
        // Even if there's an error, we should allow user to proceed
        setDetailsLoaded(true);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchLicenseDetails();
  }, [selectedLicense?.id, isOpen]);

  // Also set detailsLoaded to true if no API call is needed
  useEffect(() => {
    // If license doesn't require fetching additional details, mark as loaded
    if (isOpen && selectedLicense && !selectedLicense.id) {
      setDetailsLoaded(true);
    }
  }, [isOpen, selectedLicense]);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
      setTermsAccepted(false);
      setShowMessageModal(false);
      setMessageModalData(null);
    }
  }, [isOpen]);

  // Add this function within the LicenseConfigurationModal component
  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!termsContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Mark terms as read when user has scrolled through at least 70% of content
    if (scrollTop + clientHeight >= scrollHeight * 0.7 && !hasScrolledTerms) {
      console.log('Terms scrolled sufficiently, enabling checkbox');
      setHasScrolledTerms(true);
    }
  };

  if (!isOpen || !selectedLicense) return null;

  const formatMintingFee = (fee: string | number) => {
    try {
      const feeNumber = typeof fee === 'string' ? parseFloat(fee) : fee;
      if (feeNumber === 0) return { ipTokens: 0, display: 'Free', usd: '$0.00' };
      
      const ipTokens = CurrencyService.convertWeiToIP(feeNumber);
      const formattedIP = CurrencyService.formatIPAmount(ipTokens);
      const usdValue = CurrencyService.getUSDValue(ipTokens);
      
      return {
        ipTokens,
        display: formattedIP,
        usd: usdValue
      };
    } catch {
      return { ipTokens: 0, display: 'N/A', usd: '$0.00' };
    }
  };

  const getLicenseTypeIcon = (license: any) => {
    if (license.commercialUse && license.derivativesAllowed) return '🔓';
    if (license.commercialUse) return '💼';
    if (license.derivativesAllowed) return '🔄';
    return '📄';
  };

  const getLicenseTypeName = (license: any) => {
    if (license.commercialUse && license.derivativesAllowed) return 'Commercial + Derivatives';
    if (license.commercialUse) return 'Commercial Use';
    if (license.derivativesAllowed) return 'Derivatives';
    return 'Basic License';
  };

  const handleNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleLicenseAsset = async () => {
    if (!termsAccepted) return;

    try {
      setIsLoading(true);

      const client = await getStoryClient();
      const userAddress = client.wallet.account.address;
      
      if (!userAddress) {
        throw new Error('Unable to get user address from wallet');
      }

      console.log('=== STARTING LICENSE MINTING PROCESS ===');
      console.log('License data:', selectedLicense);
      console.log('IP ID:', ipId);
      console.log('User address:', userAddress);

      // Extract the license terms ID properly
      let licenseTermsId: string | number;
      
      if (selectedLicense.termsId) {
        licenseTermsId = selectedLicense.termsId;
      } else if (selectedLicense.id) {
        // Handle complex IDs like "0x123:1474"
        if (typeof selectedLicense.id === 'string' && selectedLicense.id.includes(':')) {
          const parts = selectedLicense.id.split(':');
          licenseTermsId = parts[parts.length - 1];
        } else {
          licenseTermsId = selectedLicense.id;
        }
      } else {
        throw new Error('No valid license terms ID found');
      }

      console.log('Extracted license terms ID:', licenseTermsId);

      // Validate license terms ID
      if (!licenseTermsId || isNaN(Number(licenseTermsId))) {
        throw new Error(`Invalid license terms ID: ${licenseTermsId}. Expected a numeric value.`);
      }

      // Determine minting fee
      const mintingFee = selectedLicense.mintingFee || 0;
      const maxMintingFee = typeof mintingFee === 'number' ? mintingFee : Number(mintingFee);
      
      console.log('Minting fee:', mintingFee, 'Formatted:', maxMintingFee);

      // Call the mint function with proper parameters
      const result = await mint_licensetoken(
        licenseTermsId,           // licenseTermsId
        ipId,                     // licensorIpId  
        userAddress,              // receiver
        client,                   // StoryClient
        1,                        // amount
        maxMintingFee,           // maxMintingFee
        100                       // maxRevenueShare
      );

      console.log('=== MINT RESULT ===', result);

      if (!result.success || result.error) {
        throw new Error(result.error || 'License minting failed');
      }

      // Show success modal instead of alert
      const feeInfo = formatMintingFee(selectedLicense.mintingFee || 0);
      setMessageModalData({
        title: 'License Successfully Acquired! 🎉',
        message: 'Your license token has been minted successfully. You now have the rights to use this IP according to the selected terms.',
        type: 'success',
        details: {
          transactionHash: result.txHash || 'N/A',
          licenseTokenIds: Array.isArray(result.licenseTokenIds) 
            ? result.licenseTokenIds.map(id => id.toString()).join(', ') 
            : (result.licenseTokenIds?.toString() || 'N/A'),
          licenseTermsId: String(licenseTermsId),
          actualFeePaid: feeInfo.ipTokens === 0 ? 'Free (Network fees only)' : `${feeInfo.display} + Network fees`,
          ipAssetId: ipId,
          licenseType: getLicenseTypeName(selectedLicense),
          yourAddress: userAddress,
          timestamp: new Date().toLocaleString()
        },
        actions: [
          {
            label: 'View on Explorer',
            action: () => {
              if (result.txHash) {
                // Changed from mainnet to Aeneid testnet explorer URL
                window.open(`https://explorer.aeneid.story.xyz/tx/${result.txHash}`, '_blank');
              }
            },
            variant: 'secondary'
          },
          {
            label: 'Go to My Licenses',
            action: () => {
              // Navigate to My Account page, License Tokens tab
              window.location.href = '/dashboard/my-account?tab=license-tokens';
            },
            variant: 'primary'
          }
        ]
      });
      setShowMessageModal(true);
      
      // Trigger refresh event for My Account section
      window.dispatchEvent(new CustomEvent('licenseTokenMinted', {
        detail: {
          userAddress,
          licenseTokenIds: result.licenseTokenIds,
          transactionHash: result.txHash,
          ipId,
          licenseTermsId,
          timestamp: Date.now()
        }
      }));

     

    } catch (error) {
      console.error('=== LICENSE MINTING ERROR ===', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Show error modal instead of alert
      setMessageModalData({
        title: 'License Transaction Failed ❌',
        message: 'An error occurred while processing your license request. Please review the details below and try again.',
        type: 'error',
        details: {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown Error',
          errorMessage: errorMessage,
          ipAssetId: ipId,
          licenseType: getLicenseTypeName(selectedLicense),
          userAddress: userAddress || 'Unknown', // FIX: Remove the await here
          licenseTermsId: String(licenseTermsId || 'N/A'),
          timestamp: new Date().toLocaleString(),
          troubleshooting: 'Check wallet balance and network connection'
        },
        actions: [
          {
            label: 'Try Again',
            action: () => {
              setShowMessageModal(false);
              setMessageModalData(null);
            },
            variant: 'primary'
          },
          {
            label: 'Get Help',
            action: () => {
              window.open('https://docs.story.foundation/', '_blank');
            },
            variant: 'secondary'
          }
        ]
      });
      setShowMessageModal(true);
      
    } finally {
      setIsLoading(false);
    }
  };

  const feeInfo = formatMintingFee(selectedLicense.mintingFee || 0);

  // Handle message modal close
  const handleMessageModalClose = () => {
    setShowMessageModal(false);
    setMessageModalData(null);
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 0: // Details
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">{getLicenseTypeIcon(selectedLicense)}</div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {getLicenseTypeName(selectedLicense)}
              </h3>
              <p className="text-sm text-zinc-400">License Terms Details</p>
            </div>

            {detailsLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-zinc-400">Loading details...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                  <h4 className="text-xs font-medium text-zinc-300 mb-2">License Information</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">License ID:</span>
                      <span className="text-zinc-300 font-mono">
                        {selectedLicense.id?.slice(0, 8)}...{selectedLicense.id?.slice(-6)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Transferable:</span>
                      <span className={`text-xs ${selectedLicense.transferable ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedLicense.transferable ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Expiration:</span>
                      <span className="text-zinc-300">
                        {selectedLicense.expiration === 0 ? 'Never' : 'Set'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                  <h4 className="text-xs font-medium text-zinc-300 mb-2">Usage Rights</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedLicense.commercialUse ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-xs text-zinc-400">Commercial Use</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedLicense.derivativesAllowed ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-xs text-zinc-400">Derivative Works</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedLicense.commercialAttribution ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                      <span className="text-xs text-zinc-400">Attribution Required</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-blue-300">About This License</h5>
                  <p className="mt-1 text-xs text-blue-200/70">
                    This license grants you specific rights to use this intellectual property. 
                    Review all details carefully before proceeding with the licensing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Pricing
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">License Pricing</h3>
              <p className="text-sm text-zinc-400">Review the cost for this license</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300 mb-1">{feeInfo.display}</div>
                <div className="text-sm text-zinc-400 mb-3">{feeInfo.usd}</div>
                
                {feeInfo.ipTokens > 0 && (
                  <div className="text-xs text-zinc-500">
                    Rate: 1 IP = $4.15 USD
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                <h4 className="text-xs font-medium text-zinc-300 mb-2">Payment Details</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">License Fee:</span>
                    <span className="text-white">{feeInfo.display}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">USD Equivalent:</span>
                    <span className="text-white">{feeInfo.usd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Currency:</span>
                    <span className="text-white">IP Tokens</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-700/50 pt-1 mt-1">
                    <span className="text-zinc-300 font-medium">Total:</span>
                    <span className="text-blue-300 font-medium">{feeInfo.display}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                <h4 className="text-xs font-medium text-zinc-300 mb-2">Revenue Sharing</h4>
                <div className="space-y-1 text-xs">
                  {selectedLicense.commercialRevShare > 0 ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Revenue Share:</span>
                        <span className="text-yellow-400">{selectedLicense.commercialRevShare / 100}%</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        If you earn revenue using this license, {selectedLicense.commercialRevShare / 100}% will be shared with the IP owner.
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-1">
                      <span className="text-green-400">No Revenue Sharing Required</span>
                      <p className="text-xs text-zinc-500 mt-1">
                        Keep 100% of any revenue you generate.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fix issue 1: In the Payment Information section (case 1: Pricing) */}
            <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/30">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-yellow-300">Payment Information</h5>
                  <p className="mt-1 text-xs text-yellow-200/70">
                    Payment will be processed using IP tokens from your connected wallet. 
                    Ensure you have sufficient balance before proceeding.
                  </p>
                </div>
              </div>
            </div>
            {/* END OF FIX */}
          </div>
        
        );

      case 2: // Rights
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">Your Rights</h3>
              <p className="text-sm text-zinc-400">What you can do with this license</p>
            </div>

            <div className="grid gap-3">
              {/* Commercial Use Rights */}
              <div className={`rounded-lg p-4 border ${
                selectedLicense.commercialUse 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${
                    selectedLicense.commercialUse 
                      ? 'bg-green-500/20' 
                      : 'bg-red-500/20'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      selectedLicense.commercialUse ? 'text-green-400' : 'text-red-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={selectedLicense.commercialUse 
                          ? "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" 
                          : "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 21l-2.121-2.121m0 0L15 18l-1.5-1.5m0 0L12 15l-1.5-1.5m0 0L9 12l-1.5-1.5m0 0L6 9l-1.5-1.5M5.636 5.636L3.515 3.515"
                        } 
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${
                      selectedLicense.commercialUse ? 'text-green-300' : 'text-red-300'
                    }`}>
                      Commercial Use
                    </h4>
                    <p className="text-xs text-zinc-400">
                      {selectedLicense.commercialUse 
                        ? 'You can use this IP for commercial purposes and profit'
                        : 'Commercial use is not permitted with this license'
                      }
                    </p>
                  </div>
                </div>
                {selectedLicense.commercialUse && (
                  <div className="text-xs text-green-200/70 bg-green-500/5 rounded-lg p-2">
                    ✓ Sell products or services using this IP<br/>
                    ✓ Use in commercial projects and campaigns<br/>
                    ✓ Generate revenue from IP-based content
                  </div>
                )}
              </div>

              {/* Derivative Rights */}
              <div className={`rounded-lg p-4 border ${
                selectedLicense.derivativesAllowed 
                  ? 'bg-blue-500/10 border-blue-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${
                    selectedLicense.derivativesAllowed 
                      ? 'bg-blue-500/20' 
                      : 'bg-red-500/20'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      selectedLicense.derivativesAllowed ? 'text-blue-400' : 'text-red-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={selectedLicense.derivativesAllowed 
                          ? "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                          : "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"
                        } 
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${
                      selectedLicense.derivativesAllowed ? 'text-blue-300' : 'text-red-300'
                    }`}>
                      Derivative Works
                    </h4>
                    <p className="text-xs text-zinc-400">
                      {selectedLicense.derivativesAllowed 
                        ? 'You can create new works based on this IP'
                        : 'Creating derivative works is not permitted'
                      }
                    </p>
                  </div>
                </div>
                {selectedLicense.derivativesAllowed && (
                  <div className="text-xs text-blue-200/70 bg-blue-500/5 rounded-lg p-2">
                    ✓ Modify and adapt the original work<br/>
                    ✓ Create remixes and variations<br/>
                    ✓ Build upon the IP for new creations
                  </div>
                )}
              </div>

              {/* Attribution Requirements - FIX IS HERE */}
              <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-1.5 bg-yellow-500/20 rounded-lg">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-300">Attribution</h4>
                    <p className="text-xs text-zinc-400">
                      {selectedLicense.commercialAttribution 
                        ? 'You must provide proper attribution to the original creator'
                        : 'No attribution required'
                      }
                    </p>
                  </div>
                </div>
                {selectedLicense.commercialAttribution && (
                  <div className="text-xs text-yellow-200/70 bg-yellow-500/5 rounded-lg p-2">
                    ⚠ Include creator name and IP source in your work<br/>
                    ⚠ Maintain attribution in derivative works<br/>
                    ⚠ Follow platform-specific attribution guidelines
                  </div>
                )}
              </div>
              {/* END OF FIX */}
            </div>

            <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-purple-300">License Token</h5>
                  <p className="mt-1 text-xs text-purple-200/70">
                    After licensing, you'll receive a license token NFT that proves your rights to use this IP according to these terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Terms
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">Terms & Conditions</h3>
              <p className="text-sm text-zinc-400">Review and accept the licensing terms</p>
            </div>

            <div 
              ref={termsContainerRef}
              onScroll={handleTermsScroll}
              className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50 max-h-48 overflow-y-auto"
            >
              <h4 className="text-sm font-medium text-white mb-3">Licensing Agreement</h4>
              <div className="text-xs text-zinc-300 space-y-2 leading-relaxed">
                <p>
                  By licensing this intellectual property, you agree to the following terms and conditions:
                </p>
                
                <div className="space-y-1">
                  <p><strong>1. Grant of License:</strong> Subject to payment of the license fee and compliance with these terms, you are granted a license to use the IP according to the specified rights.</p>
                  
                  <p><strong>2. Commercial Use:</strong> {selectedLicense.commercialUse ? 'Commercial use is permitted under this license.' : 'Commercial use is strictly prohibited.'}</p>
                  
                  <p><strong>3. Derivative Works:</strong> {selectedLicense.derivativesAllowed ? 'You may create derivative works based on the licensed IP.' : 'Creation of derivative works is not permitted.'}</p>
                  
                  <p><strong>4. Attribution:</strong> {selectedLicense.commercialAttribution ? 'Proper attribution to the original creator is required in all uses.' : 'No attribution requirement.'}</p>
                  
                  {selectedLicense.commercialRevShare > 0 && (
                    <p><strong>5. Revenue Sharing:</strong> You agree to share {selectedLicense.commercialRevShare / 100}% of net revenue generated from commercial use of this IP.</p>
                  )}
                  
                  <p><strong>6. License Token:</strong> This license is represented by an NFT token that serves as proof of your licensing rights.</p>
                  
                  <p><strong>7. Compliance:</strong> You must comply with all terms throughout the license period. Violations may result in license termination.</p>
                  
                  <p><strong>8. Blockchain Record:</strong> This license agreement is recorded on the blockchain and is immutable.</p>
                </div>
              </div>
            </div>

            {/* Fix issue 2: In the Important Notice section (case 3: Terms) */}
            <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-red-300">Important Notice</h5>
                  <p className="mt-1 text-xs text-red-200/70">
                    This is a legally binding agreement recorded on the blockchain. 
                    Please ensure you understand all terms before proceeding.
                  </p>
                </div>
              </div>
            </div>
            {/* END OF FIX */}

            {/* Show scroll prompt if user hasn't scrolled enough */}
            {!hasScrolledTerms && (
              <div className="flex justify-center items-center text-xs text-blue-400 animate-pulse">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Scroll down to review all terms
              </div>
            )}

            <div className="space-y-3">
              <label className={`flex items-start space-x-2 ${hasScrolledTerms ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => hasScrolledTerms && setTermsAccepted(e.target.checked)}
                  disabled={!hasScrolledTerms}
                  className={`mt-0.5 w-4 h-4 text-blue-500 border-zinc-600 rounded focus:ring-blue-500 focus:ring-offset-zinc-800 ${!hasScrolledTerms ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                />
                <div className="text-xs">
                  <span className="text-zinc-300">
                    I have read, understood, and agree to the terms and conditions of this license agreement.
                  </span>
                  <p className="text-xs text-zinc-500 mt-1">
                    {hasScrolledTerms 
                      ? "By checking this box, you confirm your acceptance of all licensing terms."
                      : "Please scroll through and read the entire agreement to enable this checkbox."}
                  </p>
                </div>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Main License Configuration Modal */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[100vh] overflow-hidden flex flex-col">
          
          {/* Header - Fixed height */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-white">License Configuration</h2>
                <div className="flex items-center space-x-2">
                  {pages.map((page, index) => (
                    <div key={page} className="flex items-center">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                        index === currentPage 
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300' 
                          : index < currentPage 
                            ? 'border-green-500 bg-green-500/20 text-green-300'
                            : 'border-zinc-600 text-zinc-400'
                      }`}>
                        {index < currentPage ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>
                      {index < pages.length - 1 && (
                        <div className={`w-6 h-0.5 mx-1 transition-all duration-300 ${
                          index < currentPage ? 'bg-green-500' : 'bg-zinc-600'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Page indicator */}
            <div className="mt-2">
              <div className="text-sm text-zinc-400">
                Step {currentPage + 1} of {pages.length}: {pages[currentPage]}
              </div>
            </div>
          </div>

          {/* Content - Scrollable area */}
          <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 160px)' }}>
            {renderPageContent()}
          </div>

          {/* Footer - Fixed height */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-zinc-700/50 flex justify-between">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="px-5 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Previous</span>
            </button>
            
            <div className="flex space-x-3">
              {currentPage === pages.length - 1 ? (
                <button
                  onClick={handleLicenseAsset}
                  disabled={!termsAccepted || isLoading}
                  className={`px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 ${
                    !termsAccepted || isLoading
                      ? 'bg-gray-600 cursor-not-allowed opacity-50 text-gray-300'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z" />
                      </svg>
                      <span>License Asset</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextPage}
                  // Only disable Next on first page during loading
                  disabled={currentPage === 0 && detailsLoading}
                  className={`px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                    (currentPage === 0 && detailsLoading) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {currentPage === 0 && detailsLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal for Success/Error */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={handleMessageModalClose}
        data={messageModalData}
      />
    </>
  );
};