import { StoryClient } from "@story-protocol/core-sdk";

export const update_metadata = async (ipId: string, metadataURI: string, metadataHash: string,client: StoryClient) => {
    try{
    const txHash = await client.ipAccount.setIpMetadata({
        ipId: ipId.startsWith("0x") ? ipId as `0x${string}` : `0x${ipId}` as `0x${string}`,
        metadataURI: metadataURI,
        metadataHash: metadataHash.startsWith("0x") ? metadataHash as `0x${string}` : `0x${metadataHash}` as `0x${string}`,
        txOptions: { confirmations: 5 ,retryCount: 3 , pollingInterval: 1000 },
    });
    return {
        txHash: txHash,
    };
    } catch (error) {
        console.error("Metadata update failed:", error instanceof Error ? error.message : String(error));
    }
};
