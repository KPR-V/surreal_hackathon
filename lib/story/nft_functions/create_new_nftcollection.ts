import { zeroAddress,Address } from "viem";

import { StoryClient } from "@story-protocol/core-sdk";

 export const createSpgNftCollection = async (client: StoryClient ,name?:string, symbol?:string,mintFeeRecipient?:Address ,isPublicMinting?:boolean,mintOpen?:boolean) => {
 try {
  const newCollection = await client.nftClient.createNFTCollection({
    name: name || "My Custom Collection",
    symbol: symbol || "MCC",
    isPublicMinting: isPublicMinting || false,
    mintOpen: mintOpen || true,
    mintFeeRecipient: mintFeeRecipient || zeroAddress,
    contractURI: "",
    txOptions: { confirmations: 5 ,retryCount: 3 , pollingInterval: 1000 },
  });
  console.log("New collection created:");
  console.log("SPG NFT Contract Address:", newCollection.spgNftContract);
  console.log("Transaction Hash:", newCollection.txHash);
  return newCollection.spgNftContract
 } catch (error) {
  console.error("Collection creation failed:", error instanceof Error ? error.message : String(error));
 }
}


