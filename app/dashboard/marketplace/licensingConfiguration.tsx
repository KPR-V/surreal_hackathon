"use client";

import React, { useState, useEffect } from 'react';
import { useStoryClient } from '../../../lib/story/main_functions/story-network';
import { useAccount } from 'wagmi';
import { mint_licensetoken } from '../../../lib/story/license_functions/mint_licensetoken';
import { MessageModal, MessageModalData } from '../../../components/ui/MessageModal';

interface LicenseConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLicense: any;
  ipId: string;
}

// Add Yakoa status interface
interface YakoaStatus {
  isRegistered: boolean;
  loading: boolean;
  error?: string;
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
  
  // Yakoa related states
  const [yakoaStatus, setYakoaStatus] = useState<YakoaStatus>({ isRegistered: false, loading: true });
  const [yakoaBrandName, setYakoaBrandName] = useState('');
  const [yakoaEmail, setYakoaEmail] = useState('');
  const [yakoaBrandCreating, setYakoaBrandCreating] = useState(false);
  const [yakoaBrandCreated, setYakoaBrandCreated] = useState(false);
  
  // Message Modal State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModalData, setMessageModalData] = useState<MessageModalData | null>(null);
  
  const { getStoryClient } = useStoryClient();
  const { address } = useAccount();

  // Update pages array to include Yakoa step when needed
  const getPages = () => {
    const basePages = ['Details', 'Pricing', 'Rights'];
    if (yakoaStatus.isRegistered) {
      basePages.push('Yakoa Brand', 'Terms');
    } else {
      basePages.push('Terms');
    }
    return basePages;
  };

  const pages = getPages();

  // Add these declarations to your component state declarations at the top
  // Right after other useState declarations, add:
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const termsContainerRef = React.useRef<HTMLDivElement>(null);

  // Check Yakoa registration status
  const checkYakoaStatus = async () => {
    try {
      setYakoaStatus(prev => ({ ...prev, loading: true }));
      
      const response = await fetch('/api/yakoa/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          network: 'story-aeneid',
          tokenId: ipId
        })
      });

      const data = await response.json();
      
      if (response.ok && data.response && !data.response.status_code) {
        console.log('IP is registered with Yakoa:', data.response);
        setYakoaStatus({ isRegistered: true, loading: false });
      } else if (response.status === 404 || (data.response && data.response.status_code === 404)) {
        console.log('IP is not registered with Yakoa');
        setYakoaStatus({ isRegistered: false, loading: false });
      } else {
        console.error('Error checking Yakoa status:', data.error || 'Unknown error');
        setYakoaStatus({ isRegistered: false, loading: false, error: data.error || 'Unknown error' });
      }
    } catch (error) {
      console.error('Error checking Yakoa status:', error);
      setYakoaStatus({ isRegistered: false, loading: false, error: 'Network error' });
    }
  };

  // Fetch detailed license information
  useEffect(() => {
    const fetchLicenseDetails = async () => {
      if (!selectedLicense?.id || !isOpen) {
        return;
      }
      
      try {
        setDetailsLoading(true);
        const response = await fetch(`/api/licenses/terms/${selectedLicense.id}`);
        if (response.ok) {
          const data = await response.json();
          setLicenseDetails(data.data);
        } else {
          throw new Error('Failed to fetch license details');
        }
        setDetailsLoaded(true);
      } catch (error) {
        console.error('Error fetching license details:', error);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchLicenseDetails();
  }, [ipId, isOpen, selectedLicense]);

  // Check Yakoa status when modal opens
  useEffect(() => {
    if (isOpen && ipId) {
      checkYakoaStatus();
    }
  }, [isOpen, ipId]);

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
      setYakoaBrandName('');
      setYakoaEmail('');
      setYakoaBrandCreating(false);
      setYakoaBrandCreated(false);
      setHasScrolledTerms(false);
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

  // Create Yakoa brand
  const createYakoaBrand = async () => {
  if (!yakoaBrandName.trim() || !yakoaEmail.trim()) {
    alert('Please enter both brand name and email address');
    return false;
  }

  try {
    setYakoaBrandCreating(true);
    
    const response = await fetch('/api/yakoa/create-update-token-brand-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        network: 'story-aeneid',
        tokenId: ipId,
        brandName: yakoaBrandName.trim(),
        data: {
          type: 'email',
          email_address: yakoaEmail.trim()
        }
      })
    });

    const data = await response.json();
    
    if (response.ok && data.response) {
      console.log('Yakoa brand created successfully:', data.response);
      setYakoaBrandCreated(true);
      
      // Show success alert with results
      alert(`🎉 Yakoa Brand Creation Successful! 🎉

✅ Brand Name: "${yakoaBrandName.trim()}"
✅ Email: ${yakoaEmail.trim()}
✅ IP Asset: ${ipId}
✅ Network: Story Protocol

Your brand has been successfully registered with Yakoa and linked to this IP asset for infringement protection monitoring.`);
      
      return true;
    } else {
      console.error('Error creating Yakoa brand:', data.error || 'Unknown error');
      
      // Show error alert
      alert(`❌ Yakoa Brand Creation Failed

Error: ${data.error || 'Unknown error'}

Please check your brand name and email address and try again. Note that brand names must be unique.`);
      
      return false;
    }
  } catch (error) {
    console.error('Error creating Yakoa brand:', error);
    
    // Show network error alert
    alert(`❌ Yakoa Brand Creation Failed

Network Error: ${error instanceof Error ? error.message : 'Unknown error'}

Please check your internet connection and try again.`);
    
    return false;
  } finally {
    setYakoaBrandCreating(false);
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

  const handleNextPage = async () => {
    // If we're on the Yakoa page and advancing, try to create the brand first
    if (isYakoaPage()) {
      const success = await createYakoaBrand();
      if (!success) return; // Don't advance if brand creation failed
    }
    
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get the actual page content index based on whether Yakoa is registered
  const getPageContentIndex = () => {
    if (yakoaStatus.isRegistered) {
      return currentPage; // With Yakoa: [0=Details, 1=Pricing, 2=Rights, 3=Yakoa, 4=Terms]
    } else {
      // Without Yakoa: [0=Details, 1=Pricing, 2=Rights, 3=Terms]
      return currentPage; 
    }
  };

  // Check if we're on the Yakoa page
  const isYakoaPage = () => yakoaStatus.isRegistered && currentPage === 3;
  
  // Check if we're on the Terms page (last page)
  const isTermsPage = () => {
    return yakoaStatus.isRegistered ? currentPage === 4 : currentPage === 3;
  };

  const handleLicenseAsset = async () => {
    if (!termsAccepted) return;

    // If Yakoa is registered and we haven't created the brand yet, do that first
    if (yakoaStatus.isRegistered && !yakoaBrandCreated) {
      alert('Please complete the Yakoa brand creation step first');
      // Go back to the Yakoa page
      setCurrentPage(3);
      return;
    }

    // Initialize variables at function scope to avoid "used before assigned" errors
    let userAddress = '';
    let licenseTermsId: string | number = '';
    let yakoaBrandSuccess = false;

    try {
      setIsLoading(true);

      const client = await getStoryClient();
      
      // Fix: Use the address from useAccount hook instead
      userAddress = address || '';
      
      if (!userAddress) {
        throw new Error('User wallet address not found');
      }

      console.log('=== STARTING LICENSE MINTING PROCESS ===');
      console.log('License data:', selectedLicense);
      console.log('IP ID:', ipId);
      console.log('User address:', userAddress);

      // Extract the license terms ID properly
      if (selectedLicense.termsId) {
        licenseTermsId = selectedLicense.termsId;
      } else if (selectedLicense.id) {
        licenseTermsId = selectedLicense.id;
      } else {
        throw new Error('License terms ID not found');
      }

      console.log('Extracted license terms ID:', licenseTermsId);

      // FIX: Handle composite license terms ID format
      // First check if it's empty
      if (!licenseTermsId) {
        throw new Error('Empty license terms ID');
      }
      
      // Convert to string for processing
      const licenseIdString = String(licenseTermsId).trim();
      
      // Check if it's a composite format like "address1:address2:numericId"
      if (licenseIdString.includes(':')) {
        const parts = licenseIdString.split(':');
        if (parts.length >= 3) {
          // Extract the numeric part (last part)
          const numericPart = parts[parts.length - 1];
          
          // Validate that the numeric part is actually a number
          if (isNaN(Number(numericPart))) {
            throw new Error(`Invalid numeric license terms ID: ${numericPart}`);
          }
          
          // Use the numeric part as the license terms ID
          licenseTermsId = numericPart;
          console.log('Extracted numeric license terms ID from composite:', licenseTermsId);
        } else {
          throw new Error(`Invalid composite license terms ID format: ${licenseIdString}`);
        }
      } else {
        // If it's not composite, validate as a simple numeric string
        if (isNaN(Number(licenseIdString))) {
          throw new Error(`Invalid license terms ID format: ${licenseIdString}`);
        }
        licenseTermsId = licenseIdString;
      }

      // Determine minting fee
      const mintingFee = selectedLicense.mintingFee || 0;
      const maxMintingFee = typeof mintingFee === 'number' ? mintingFee : Number(mintingFee);
      
      console.log('Minting fee:', mintingFee, 'Formatted:', maxMintingFee);
      console.log('Final license terms ID to use:', licenseTermsId);

      // Call the mint function with proper parameters
      const result = await mint_licensetoken(
        licenseTermsId,
        ipId,
        userAddress,
        client,
        1,
        maxMintingFee,
        100
      );

      console.log('=== MINT RESULT ===', result);
      
      // Check if the result indicates success
      if (!result.success) {
        throw new Error(result.error || 'License minting failed');
      }
      
      // If Yakoa is registered and we have a brand name, create the brand after successful mint
      if (yakoaStatus.isRegistered && !yakoaBrandCreated) {
        yakoaBrandSuccess = await createYakoaBrand();
      }

      // Show success message
      setMessageModalData({
        type: 'success',
        title: 'License Acquired Successfully!',
        message: yakoaBrandCreated || yakoaBrandSuccess ? 
          'You have successfully acquired this license and registered with Yakoa.' : 
          'You have successfully acquired this license.',
        details: { message: 'You now have permissions to use this IP according to the license terms.' }
      });
      setShowMessageModal(true);
      
      // Close the modal after a delay
      setTimeout(() => {
        onClose();
      }, 5000);

    } catch (error) {
      console.error('Error licensing asset:', error);
      setMessageModalData({
        type: 'error',
        title: 'License Acquisition Failed',
        message: `There was a problem acquiring this license: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { message: 'Please try again later or contact support if the issue persists.' }
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
    const pageIndex = getPageContentIndex();
    
    // Details page
    if (pageIndex === 0) {
      return (
        <div className="mb-6 space-y-4">
          <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">License Summary</h3>
              <div className="flex items-center space-x-1">
                <span className="text-xl">{getLicenseTypeIcon(selectedLicense)}</span>
                <span className="text-sm font-medium text-blue-400">{getLicenseTypeName(selectedLicense)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center">
                  {selectedLicense.commercialUse ? (
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm text-white">Commercial Use</p>
                  <p className="text-xs text-zinc-400">Use in commercial projects and profit from the IP</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center">
                  {selectedLicense.derivativesAllowed ? (
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm text-white">Derivatives Allowed</p>
                  <p className="text-xs text-zinc-400">Create modified versions or derivative works</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-white">Attribution Required</p>
                  <p className="text-xs text-zinc-400">Credit the original creator when using the IP</p>
                </div>
              </div>
            </div>
          </div>

          {detailsLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : licenseDetails ? (
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">Additional Details</h3>
              <div className="space-y-3">
                {licenseDetails.description && (
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Description</p>
                    <p className="text-sm text-zinc-400 mt-1">{licenseDetails.description}</p>
                  </div>
                )}

                {licenseDetails.termsUri && (
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Terms Document</p>
                    <a 
                      href={licenseDetails.termsUri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 mt-1 flex items-center"
                    >
                      <span>View Full Terms</span>
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      );
    }
    
    // Pricing page
    if (pageIndex === 1) {
      return (
        <div className="mb-6 space-y-4">
          <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">Licensing Fee</h3>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <p className="text-sm text-zinc-300">Minting Fee</p>
                <p className="text-xs text-zinc-400">One-time fee to acquire this license</p>
              </div>
              <div className="text-right">
                <p className="text-base font-medium text-blue-400">{feeInfo.display}</p>
                <p className="text-xs text-zinc-400">{feeInfo.usd}</p>
              </div>
            </div>
            
            <div className="border-t border-zinc-700/40 my-3"></div>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <p className="text-sm text-zinc-300">Royalty Rate</p>
                <p className="text-xs text-zinc-400">Percentage of revenue shared with IP owner</p>
              </div>
              <div className="text-right">
                <p className="text-base font-medium text-blue-400">
                  {selectedLicense.royaltyPercentage ? `${selectedLicense.royaltyPercentage}%` : 'None'}
                </p>
              </div>
            </div>
            
            {selectedLicense.royaltyPercentage > 0 && (
              <div className="mt-3 p-3 bg-zinc-700/20 rounded-lg">
                <p className="text-xs text-zinc-400">
                  By accepting this license, you agree to pay {selectedLicense.royaltyPercentage}% of revenue 
                  generated from commercial use of this IP to the IP owner.
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">Payment Information</h3>
            
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">Payment Method</p>
              <div className="flex items-center space-x-3 p-3 bg-zinc-700/30 rounded-lg">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Wallet Balance</p>
                  <p className="text-xs text-zinc-400">Connected Wallet: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Rights page
    if (pageIndex === 2) {
      return (
        <div className="mb-6 space-y-4">
          <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">Rights Granted</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-2">What you can do with this license:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-zinc-400">Use the IP in personal and non-commercial projects</span>
                  </li>
                  
                  {selectedLicense.commercialUse && (
                    <li className="flex items-start">
                      <svg className="w-4 h-4 text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-zinc-400">Use the IP in commercial projects and monetize your work</span>
                    </li>
                  )}
                  
                  {selectedLicense.derivativesAllowed && (
                    <li className="flex items-start">
                      <svg className="w-4 h-4 text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-zinc-400">Create and distribute derivative works based on the IP</span>
                    </li>
                  )}
                  
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-zinc-400">Display and distribute the IP in its original or permitted modified form</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Restrictions:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-zinc-400">You cannot claim the IP as your own original creation</span>
                  </li>
                  
                  {!selectedLicense.commercialUse && (
                    <li className="flex items-start">
                      <svg className="w-4 h-4 text-red-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm text-zinc-400">You cannot use the IP for commercial purposes</span>
                    </li>
                  )}
                  
                  {!selectedLicense.derivativesAllowed && (
                    <li className="flex items-start">
                      <svg className="w-4 h-4 text-red-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm text-zinc-400">You cannot create derivative works based on the IP</span>
                    </li>
                  )}
                  
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-zinc-400">You cannot sublicense or transfer your rights to others</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">Attribution Requirements</h3>
            
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                When using this IP, you must provide appropriate credit to the original creator:
              </p>
              
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-xs text-blue-400">1</span>
                  </div>
                  <span className="text-sm text-zinc-400">Include the name of the original creator</span>
                </li>
                
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-xs text-blue-400">2</span>
                  </div>
                  <span className="text-sm text-zinc-400">Link back to the original IP when used digitally</span>
                </li>
                
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-xs text-blue-400">3</span>
                  </div>
                  <span className="text-sm text-zinc-400">Indicate if changes were made to the original IP</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      );
    }
    
    // Yakoa Brand page - only shown if yakoaStatus.isRegistered is true
    if (pageIndex === 3 && yakoaStatus.isRegistered) {
      return (
        <div className="mb-6 space-y-4">
          <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Yakoa Brand Registration</h3>
            </div>
            
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                This IP asset is registered with Yakoa, which helps protect against infringement. Creating a brand will link your email to this IP for verification purposes.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-2">What is a Yakoa Brand?</h4>
                <p className="text-sm text-zinc-400">
                  A Brand represents an external IP owner (company, organization, or individual). 
                  Brands are the basis against which Tokens are checked for infringement.
                </p>
                <p className="text-sm text-zinc-400 mt-2">
                  Yakoa monitors for infringements against well known, public IP and matches against 
                  Brands deemed to own the IP. This helps protect your intellectual property rights.
                </p>
              </div>
              
              {!yakoaBrandCreated && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="brandName" className="block text-sm font-medium text-zinc-300 mb-1">
                      Brand Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="brandName"
                      value={yakoaBrandName}
                      onChange={(e) => setYakoaBrandName(e.target.value)}
                      placeholder="Enter brand name"
                      className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="emailAddress" className="block text-sm font-medium text-zinc-300 mb-1">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="emailAddress"
                      value={yakoaEmail}
                      onChange={(e) => setYakoaEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      This email will be associated with your brand for verification purposes.
                    </p>
                  </div>
                </div>
              )}
              
              {yakoaBrandCreated && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start">
                  <svg className="w-5 h-5 text-green-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-400">Brand Successfully Created</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Your brand "{yakoaBrandName}" has been registered with Yakoa and linked to this IP asset.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // Terms page (always the last page)
    if (isTermsPage()) {
      return (
        <div className="mb-6 space-y-4">
          <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">License Agreement</h3>
            
            <div 
              className="h-60 overflow-y-auto p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg mb-4 text-sm text-zinc-400"
              ref={termsContainerRef}
              onScroll={handleTermsScroll}
            >
              <h4 className="text-sm font-semibold text-zinc-300 mb-2">STORY PROTOCOL LICENSE AGREEMENT</h4>
              
              <p className="mb-3">
                This License Agreement (the "Agreement") is entered into between the IP Owner ("Licensor") 
                and you ("Licensee"), and grants you certain rights to use the intellectual property 
                identified in the license token that will be minted to your wallet address.
              </p>
              
              <h5 className="text-sm font-medium text-zinc-300 mb-1">1. GRANT OF LICENSE</h5>
              <p className="mb-3">
                Subject to the terms and conditions of this Agreement, Licensor grants to Licensee a 
                {selectedLicense.commercialUse ? ' commercial' : ' non-commercial'}, 
                {selectedLicense.derivativesAllowed ? ' modifiable' : ' non-modifiable'}, 
                non-exclusive, non-transferable license to use the IP for the purposes outlined in this Agreement.
              </p>
              
              <h5 className="text-sm font-medium text-zinc-300 mb-1">2. RESTRICTIONS</h5>
              <p className="mb-3">
                Licensee shall not: (a) claim ownership over the original IP; (b) use the IP in any manner 
                that violates applicable laws or regulations; (c) use the IP in a way that implies endorsement 
                by the Licensor; {!selectedLicense.commercialUse && '(d) use the IP for commercial purposes; '}
                {!selectedLicense.derivativesAllowed && '(e) create derivative works based on the IP; '}
                (f) sublicense or transfer your rights under this Agreement to others.
              </p>
              
              <h5 className="text-sm font-medium text-zinc-300 mb-1">3. ATTRIBUTION</h5>
              <p className="mb-3">
                Licensee shall provide appropriate attribution to the Licensor when using the IP by: 
                (a) including the name of the original creator; (b) providing a link to the original IP 
                when used digitally; and (c) indicating if changes were made to the original IP.
              </p>
              
              {selectedLicense.royaltyPercentage > 0 && (
                <>
                  <h5 className="text-sm font-medium text-zinc-300 mb-1">4. ROYALTIES</h5>
                  <p className="mb-3">
                    Licensee agrees to pay Licensor a royalty of {selectedLicense.royaltyPercentage}% of 
                    the gross revenue generated from commercial use of the IP. Royalty payments shall be 
                    made through the Story Protocol platform or as otherwise specified by the Licensor.
                  </p>
                </>
              )}
              
              <h5 className="text-sm font-medium text-zinc-300 mb-1">{selectedLicense.royaltyPercentage > 0 ? '5' : '4'}. TERM AND TERMINATION</h5>
              <p className="mb-3">
                This license is valid as long as you comply with the terms of this Agreement. This license 
                will terminate automatically if you breach any of its terms. Upon termination, you must cease 
                all use of the IP and destroy all copies in your possession.
              </p>
              
              <h5 className="text-sm font-medium text-zinc-300 mb-1">{selectedLicense.royaltyPercentage > 0 ? '6' : '5'}. DISCLAIMER OF WARRANTIES</h5>
              <p className="mb-3">
                THE IP IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. LICENSOR DISCLAIMS ALL WARRANTIES, 
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, 
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              
              <h5 className="text-sm font-medium text-zinc-300 mb-1">{selectedLicense.royaltyPercentage > 0 ? '7' : '6'}. LIMITATION OF LIABILITY</h5>
              <p className="mb-3">
                IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY SPECIAL, INCIDENTAL, INDIRECT, OR CONSEQUENTIAL 
                DAMAGES ARISING OUT OF THE USE OR INABILITY TO USE THE IP, EVEN IF LICENSOR HAS BEEN ADVISED 
                OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              
              <h5 className="text-sm font-medium text-zinc-300 mb-1">{selectedLicense.royaltyPercentage > 0 ? '8' : '7'}. GOVERNING LAW</h5>
              <p className="mb-3">
                This Agreement shall be governed by and construed in accordance with the laws of the 
                jurisdiction in which the Licensor is located, without regard to its conflict of law principles.
              </p>
              
              <h5 className="text-sm font-medium text-zinc-300 mb-1">{selectedLicense.royaltyPercentage > 0 ? '9' : '8'}. ENTIRE AGREEMENT</h5>
              <p>
                This Agreement constitutes the entire understanding between the parties concerning the subject 
                matter hereof and supersedes all prior agreements, understandings, or negotiations.
              </p>
            </div>
            
            <div className="flex items-start space-x-3 pb-2">
              <input
                type="checkbox"
                id="termsAccepted"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={!hasScrolledTerms}
                className="mt-1"
              />
              <label htmlFor="termsAccepted" className="text-sm text-zinc-400">
                I have read, understand, and agree to the license terms and conditions governing my use of this IP asset.
                {!hasScrolledTerms && (
                  <span className="block text-xs text-orange-400 mt-1">
                    Please read the entire agreement before accepting
                  </span>
                )}
              </label>
            </div>
          </div>
        </div>
      );
    }

    // Fallback (shouldn't reach here with proper indices)
    return (
      <div className="mb-6">
        <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4">
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <p className="text-zinc-400">Something went wrong with the licensing configuration.</p>
              <button 
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                Close and try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`fixed inset-0 z-40 flex items-center justify-center ${isOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`relative z-50 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-2xl transition-all ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {/* Header */}
          <div className="border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-medium text-white">License Configuration</h2>
            <button 
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="px-6 py-3 border-b border-zinc-800/50">
            <div className="flex items-center">
              {pages.map((step, index) => (
                <React.Fragment key={step}>
                  {/* Step Circle */}
                  <div 
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                      currentPage === index 
                        ? 'bg-blue-500 text-white' 
                        : currentPage > index 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {currentPage > index ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Step Name */}
                  <div className="ml-2 mr-auto">
                    <p className={`text-sm ${
                      currentPage === index 
                        ? 'font-medium text-blue-400' 
                        : currentPage > index 
                          ? 'font-medium text-zinc-300' 
                          : 'text-zinc-500'
                    }`}>
                      {step}
                    </p>
                  </div>
                  
                  {/* Connector Line */}
                  {index < pages.length - 1 && (
                    <div 
                      className={`flex-grow h-0.5 mx-2 ${
                        currentPage > index ? 'bg-blue-500/30' : 'bg-zinc-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4 h-[50vh] overflow-y-auto">
            {renderPageContent()}
          </div>
          
          {/* Footer */}
          <div className="border-t border-zinc-800/50 px-6 py-4 flex items-center justify-between">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            
            <div className="flex items-center space-x-3">
              {currentPage === pages.length - 1 ? (
                <button
                  onClick={handleLicenseAsset}
                  disabled={isLoading || !termsAccepted}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-blue-500 hover:to-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Acquire License</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextPage}
                  disabled={isLoading || (isYakoaPage() && (!yakoaBrandName.trim() || !yakoaEmail.trim()))}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  {isYakoaPage() && yakoaBrandCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Creating Brand...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
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

      <MessageModal
        isOpen={showMessageModal}
        onClose={handleMessageModalClose}
        data={messageModalData}
      />
    </>
  );
};