import { useStoryClient } from "../main_functions/story-network";

export const update_metadata = async (ipId: string, metadataURI: string, metadataHash: string) => {
    try{
    const { getStoryClient } = useStoryClient();
    const client = await getStoryClient();
    const txHash = await client.ipAccount.setIpMetadata({
        ipId: ipId.startsWith("0x") ? ipId as `0x${string}` : `0x${ipId}` as `0x${string}`,
        metadataURI: metadataURI,
        metadataHash: metadataHash.startsWith("0x") ? metadataHash as `0x${string}` : `0x${metadataHash}` as `0x${string}`,
        txOptions: { waitForTransaction: true },
    });
    return {
        txHash: txHash,
    };
    } catch (error) {
        console.error("Metadata update failed:", error instanceof Error ? error.message : String(error));
    }
};
