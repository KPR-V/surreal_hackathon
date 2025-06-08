import { createTool } from "@goat-sdk/core";
import { StoryClient } from "@story-protocol/core-sdk";
import { http } from "viem";
import { z } from "zod";
import axios from "axios";

export const storyKitTool = (options: { 
  crossmintApiKey: string,
  rpcUrl: string 
}) => {
  return createTool(
    {
      name: "create_storykit_collection",
      description: "Creates and registers an IP collection on Story Protocol via Crossmint StoryKit",
      parameters: z.object({
        collectionName: z.string().describe("Name of the IP collection"),
        collectionSymbol: z.string().describe("Symbol for the collection"),
        contractURI: z.string().describe("IPFS URI for collection metadata"),
        creatorEmail: z.string().email().describe("Creator's email address"),
        publicMinting: z.boolean().default(true),
        mintFeeRecipient: z.string().optional().describe("Address to receive mint fees"),
        chain: z.enum(["story-testnet", "story-mainnet"]).default("story-testnet")
      }),
    },
    async (params) => {
      try {
        // 1. Initialize Story Protocol Client
        const client = StoryClient.newClient({
          transport: http(options.rpcUrl),
          account: params.mintFeeRecipient as `0x${string}`,
        });

        // 2. Create NFT Collection Transaction
        const creationTx = await client.nftClient.createNFTCollection({
          name: params.collectionName,
          symbol: params.collectionSymbol,
          contractURI: params.contractURI,
          isPublicMinting: params.publicMinting,
          mintOpen: true,
          mintFeeRecipient: params.mintFeeRecipient as `0x${string}`,
          txOptions: {
            encodedTxDataOnly: true,
          },
        });

        // 3. Execute via Crossmint API
        const response = await axios.post(
          `https://staging.crossmint.com/api/2022-06-09/wallets/${params.mintFeeRecipient}/transactions`,
          {
            params: {
              call: {
                data: creationTx.encodedTxData?.data,
                to: creationTx.encodedTxData?.to,
              },
              chain: params.chain,
            },
          },
          {
            headers: {
              "X-API-KEY": options.crossmintApiKey,
              "Content-Type": "application/json",
            },
          }
        );

        return {
          success: true,
          collectionId: response.data.id,
          actionId: response.data.actionId,
          transactionHash: response.data.txHash,
          details: `Collection "${params.collectionName}" creation initiated on Story Protocol`,
          nextSteps: [
            "Check action status using get_action_status tool",
            "Register individual IP assets in the new collection"
          ]
        };

      } catch (error: any) {
        console.error("StoryKit operation failed:", error);
        return {
          success: false,
          error: "Failed to create Story Protocol collection",
          details: error.response?.data?.message || error.message,
          recoverySteps: [
            "Verify RPC endpoint connectivity",
            "Check Crossmint API key permissions",
            "Validate contract URI format"
          ]
        };
      }
    }
  );
};
