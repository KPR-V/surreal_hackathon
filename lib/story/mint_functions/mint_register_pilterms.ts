import { IpMetadata, LicenseTerms, StoryClient } from "@story-protocol/core-sdk";
import ipcid_nftcid from "../main_functions/ipcid_nftcid";

export const mint_register_pilterms = async (
  terms: LicenseTerms,
  client: StoryClient,
  spgnftcontract?: string,
  ipMetadata?: IpMetadata,
  nftMetadata?: any
) => {
  const { ipcid, ipHash, nftcid, nftHash } = await ipcid_nftcid(ipMetadata, nftMetadata);
  
  console.log("IPFS data for PIL terms:", { ipcid, ipHash, nftcid, nftHash });
  console.log("PIL terms received:", terms);
  
  // Validate and format the PIL terms to ensure all required BigInt fields are present
  const formattedTerms: LicenseTerms = {
    transferable: terms.transferable ?? true,
    royaltyPolicy: terms.royaltyPolicy || "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E", // RoyaltyPolicyLAP address
    defaultMintingFee: BigInt(terms.defaultMintingFee || (terms as any).mintingFee || 0),
    expiration: BigInt(terms.expiration || 0),
    commercialUse: terms.commercialUse ?? false,
    // Important: commercialAttribution can only be true if commercialUse is true
    commercialAttribution: terms.commercialUse ? (terms.commercialAttribution ?? false) : false,
    commercializerChecker: terms.commercializerChecker || "0x0000000000000000000000000000000000000000",
    commercializerCheckerData: terms.commercializerCheckerData || "0x0000000000000000000000000000000000000000",
    commercialRevShare: Number(terms.commercialRevShare || (terms as any).revenueSharePercentage || 0),
    commercialRevCeiling: BigInt(terms.commercialRevCeiling || 0),
    derivativesAllowed: terms.derivativesAllowed ?? false,
    derivativesAttribution: terms.derivativesAttribution ?? false,
    derivativesApproval: terms.derivativesApproval ?? false,
    derivativesReciprocal: terms.derivativesReciprocal ?? false,
    derivativeRevCeiling: BigInt(terms.derivativeRevCeiling || 0),
    currency: terms.currency || "0x1514000000000000000000000000000000000000", // $WIP address
    uri: terms.uri || "",
  };

  console.log("Formatted PIL terms:", formattedTerms);
  
  // Additional validation
  if (formattedTerms.commercialAttribution && !formattedTerms.commercialUse) {
    console.warn("Fixing PIL terms: Commercial attribution cannot be true when commercial use is false");
    formattedTerms.commercialAttribution = false;
  }
  
  // If commercial use is disabled, ensure commercial-related fields are reset
  if (!formattedTerms.commercialUse) {
    formattedTerms.commercialAttribution = false;
    formattedTerms.commercialRevShare = 0;
    formattedTerms.commercialRevCeiling = 0n;
  }
  
  try {
    const response = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
      spgNftContract: (spgnftcontract ? 
        spgnftcontract.startsWith("0x") ? 
          spgnftcontract as `0x${string}` : 
          `0x${spgnftcontract}` as `0x${string}` : 
        "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc") as `0x${string}`,
      allowDuplicates: true,
      licenseTermsData: [{ terms: formattedTerms }],
      ipMetadata: {
        ipMetadataURI: ipcid ? `https://ipfs.io/ipfs/${ipcid}` : "",
        ipMetadataHash: ipHash ? `0x${ipHash}` as `0x${string}` : undefined,
        nftMetadataURI: nftcid ? `https://ipfs.io/ipfs/${nftcid}` : "",
        nftMetadataHash: nftHash ? `0x${nftHash}` as `0x${string}` : undefined,
      },
      txOptions: { 
        waitForTransaction: true, // This is crucial - wait for transaction completion
      },
    });

    console.log("Mint and register PIL terms response:", response);

    // Verify we have the required data
    if (!response.ipId || !response.tokenId) {
      console.warn("Missing ipId or tokenId in PIL response:", response);
    }

    return {
      tokenId: response.tokenId,
      ipId: response.ipId,
      licenseTermsIds: response.licenseTermsIds,
      txHash: response.txHash,
    };
  } catch (error) {
    console.error("Mint and register PIL terms failed:", error instanceof Error ? error.message : String(error));
    throw error; // Re-throw the error instead of returning undefined
  }
};

export const batch_mint_register_pilterms = async (items: {
  spgNftContract?: string;
  terms: LicenseTerms;
  ipMetadata?: IpMetadata;
  nftMetadata?: any;
}[],
client: StoryClient
) => {
  const args = await Promise.all(
    items.map(async (item) => {
      const { ipcid, ipHash, nftcid, nftHash } = await ipcid_nftcid(
        item.ipMetadata,
        item.nftMetadata
      );

      return {
        spgNftContract: (item.spgNftContract
          ? item.spgNftContract.startsWith("0x")
            ? item.spgNftContract
            : `0x${item.spgNftContract}` as `0x${string}`
          : "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc") as `0x${string}`,
        allowDuplicates: true,
        licenseTermsData: [{ terms: item.terms }],
        ipMetadata: {
          ipMetadataURI: ipcid ? `https://ipfs.io/ipfs/${ipcid}` : "",
          ipMetadataHash: ipHash ? `0x${ipHash}` as `0x${string}` : undefined,
          nftMetadataURI: nftcid ? `https://ipfs.io/ipfs/${nftcid}` : "",
          nftMetadataHash: nftHash ? `0x${nftHash}` as `0x${string}` : undefined,
        },
      };
    })
  );
  
  try {
    const response = await client.ipAsset.batchMintAndRegisterIpAssetWithPilTerms({
      args,
      txOptions: { 
        waitForTransaction: true,
      },
    });

    const results = response.results?.map((result) => ({
      tokenId: result.tokenId,
      ipId: result.ipId,
      licenseTermsIds: result.licenseTermsIds,
      spgNftContract: result.spgNftContract,
    }));

    return {
      results: results,
      txHash: response.txHash,
    };
  } catch (error) {
    console.error("Batch mint and register failed:", error instanceof Error ? error.message : String(error));
    throw error;
  }
};