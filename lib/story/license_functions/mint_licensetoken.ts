import { StoryClient } from "@story-protocol/core-sdk";

export const mint_licensetoken = async (
  licenseTermsId: string | number | bigint,
  licensorIpId: string,
  receiver: string,
  client: StoryClient,
  amount?: string | number | bigint,
  maxMintingFee?: string | number | bigint,
  maxRevenueShare?: string | number
) => {
  try {
    console.log('=== MINT LICENSE TOKEN START ===');
    console.log('Parameters received:', {
      licenseTermsId: typeof licenseTermsId === 'bigint' ? licenseTermsId.toString() : licenseTermsId,
      licensorIpId,
      receiver,
      amount,
      maxMintingFee,
      maxRevenueShare
    });

    // Format addresses properly
    const formattedLicensorId = licensorIpId.startsWith("0x") ? licensorIpId : `0x${licensorIpId}`;
    const formattedReceiver = receiver.startsWith("0x") ? receiver : `0x${receiver}`;

    // Convert parameters according to SDK requirements
    const licenseTermsIdFormatted = typeof licenseTermsId === 'bigint' 
      ? licenseTermsId 
      : BigInt(licenseTermsId);

    const amountFormatted = amount ? BigInt(amount) : BigInt(1);

    // Handle minting fee - SDK requires bigint, string, or number
    let maxMintingFeeFormatted: bigint;
    if (maxMintingFee === undefined || maxMintingFee === null) {
      maxMintingFeeFormatted = BigInt(0); // Free license
    } else {
      maxMintingFeeFormatted = typeof maxMintingFee === 'bigint' 
        ? maxMintingFee 
        : BigInt(maxMintingFee);
    }

    // Handle revenue share - SDK requires number or string
    const maxRevenueShareFormatted = maxRevenueShare !== undefined 
      ? Number(maxRevenueShare) 
      : 100; // Default 100%

    console.log('Formatted parameters:', {
      licenseTermsId: licenseTermsIdFormatted.toString(),
      licensorIpId: formattedLicensorId,
      receiver: formattedReceiver,
      amount: amountFormatted.toString(),
      maxMintingFee: maxMintingFeeFormatted.toString(),
      maxRevenueShare: maxRevenueShareFormatted
    });

    // Call the SDK function with correct parameter structure
    const response = await client.license.mintLicenseTokens({
      licensorIpId: formattedLicensorId as `0x${string}`,
      licenseTermsId: licenseTermsIdFormatted,
      receiver: formattedReceiver as `0x${string}`,
      amount: amountFormatted,
      maxMintingFee: maxMintingFeeFormatted,
      maxRevenueShare: maxRevenueShareFormatted,
      txOptions: { confirmations: 5 ,retryCount: 3 , pollingInterval: 1000 },
    });

    console.log('=== MINT RESPONSE SUCCESS ===');
    console.log('Response:', {
      txHash: response.txHash,
      licenseTokenIds: response.licenseTokenIds?.map(id => id.toString()),
      receipt: !!response.receipt
    });

    return {
      txHash: response.txHash,
      licenseTokenIds: response.licenseTokenIds,
      success: true,
      receipt: response.receipt
    };

  } catch (error) {
    console.error("=== LICENSE TOKEN MINTING FAILED ===");
    console.error("Error details:", error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false
    };
  }
};

