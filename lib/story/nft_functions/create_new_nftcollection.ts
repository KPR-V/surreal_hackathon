import { zeroAddress, Address } from "viem";
import { StoryClient } from "@story-protocol/core-sdk";

export const createSpgNftCollection = async (
  client: StoryClient,
  owner: Address,
  name?: string,
  symbol?: string,
  mintFeeRecipient?: Address,
  isPublicMinting?: boolean,
  mintOpen?: boolean
) => {
  try {
    // 1. Determine the fee recipient with a clear fallback
    const feeRecipient = mintFeeRecipient
      ? mintFeeRecipient.startsWith("0x")
        ? mintFeeRecipient
        : (`0x${mintFeeRecipient}` as Address)
      : zeroAddress;

    const newCollection = await client.nftClient.createNFTCollection({
      name: name || "My Custom Collection",
      symbol: symbol || "MCC",
      isPublicMinting: isPublicMinting || false,
      mintOpen: mintOpen || true,
      owner: owner,
      // 2. Use the correctly determined recipient
      mintFeeRecipient: feeRecipient,
      contractURI: "",
      txOptions: { confirmations: 5, retryCount: 3, pollingInterval: 1000 },
    });

    console.log("New collection created:");
    console.log("SPG NFT Contract Address:", newCollection.spgNftContract);
    console.log("Transaction Hash:", newCollection.txHash);

    return {
      spgNftContract: newCollection.spgNftContract,
      txHash: newCollection.txHash,
    };
  } catch (error) {
    console.error(
      "Collection creation failed:",
      error instanceof Error ? error.message : String(error)
    );
  }
};
