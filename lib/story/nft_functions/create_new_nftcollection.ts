import { zeroAddress,Address } from "viem";
import { useStoryClient } from "../main_functions/story-network";

 export const createSpgNftCollection = async (name?:string, symbol?:string,mintFeeRecipient?:Address ,isPublicMinting?:boolean,mintOpen?:boolean) => {
 try {
  const { getStoryClient } = useStoryClient();
  const client = await getStoryClient();
  const newCollection = await client.nftClient.createNFTCollection({
    name: name || "My Custom Collection",
    symbol: symbol || "MCC",
    isPublicMinting: isPublicMinting || false,
    mintOpen: mintOpen || true,
    mintFeeRecipient: mintFeeRecipient || zeroAddress,
    contractURI: "",
    txOptions: { waitForTransaction: true },
  });
  console.log("New collection created:");
  console.log("SPG NFT Contract Address:", newCollection.spgNftContract);
  console.log("Transaction Hash:", newCollection.txHash);
  return newCollection.spgNftContract
 } catch (error) {
  console.error("Collection creation failed:", error instanceof Error ? error.message : String(error));
 }
}


