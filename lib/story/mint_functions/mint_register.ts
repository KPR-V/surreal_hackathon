import { IpMetadata, StoryClient } from "@story-protocol/core-sdk";
import ipcid_nftcid from "../main_functions/ipcid_nftcid";

export const mintandregisterip = async (
  client: StoryClient,
  ipMetadata?: IpMetadata,
  nftMetadata?: any,
  spgnftcontract?: string
) => {
  const { ipcid, ipHash, nftcid, nftHash } = await ipcid_nftcid(
    ipMetadata,
    nftMetadata
  );


  console.log("IPFS data:", { ipcid, ipHash, nftcid, nftHash });

  try {
    const response = await client.ipAsset.mintAndRegisterIp({
      spgNftContract: (spgnftcontract
        ? spgnftcontract.startsWith("0x")
          ? (spgnftcontract as `0x${string}`)
          : (`0x${spgnftcontract}` as `0x${string}`)
        : "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc") as `0x${string}`,
      allowDuplicates: true,
      ipMetadata: {
        ipMetadataURI: ipcid ? `https://ipfs.io/ipfs/${ipcid}` : "",
        ipMetadataHash: ipHash ? (`0x${ipHash}` as `0x${string}`) : undefined,
        nftMetadataURI: nftcid ? `https://ipfs.io/ipfs/${nftcid}` : "",
        nftMetadataHash: nftHash
          ? (`0x${nftHash}` as `0x${string}`)
          : undefined,
      },
      txOptions: {
        confirmations: 5,
        retryCount: 3,
        pollingInterval: 1000,
      },
    });

    console.log("Mint and register response:", response);

    // Verify we have the required data
    if (!response.ipId || !response.tokenId) {
      console.warn("Missing ipId or tokenId in response:", response);
      // Still return what we have, but with a warning
    }

    return {
      txHash: response.txHash,
      ipId: response.ipId,
      tokenId: response.tokenId,
      explorerUrl: response.ipId
        ? `https://aeneid.explorer.story.foundation/ipa/${response.ipId}`
        : undefined,
    };
  } catch (error) {
    console.error(
      "Mint and register failed:",
      error instanceof Error ? error.message : String(error)
    );
    throw error; // Re-throw the error instead of returning undefined values
  }
};
