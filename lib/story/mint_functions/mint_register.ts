import { IpMetadata, StoryClient } from "@story-protocol/core-sdk";
import ipcid_nftcid from "../main_functions/ipcid_nftcid";



export const mintandregisterip = async (
  client: StoryClient,
  ipMetadata?: IpMetadata,
  nftMetadata?:any,
  spgnftcontract?: string,
 
) => {
  const { ipcid, ipHash, nftcid, nftHash } = await ipcid_nftcid(ipMetadata, nftMetadata);
  try { 
  const response = await client.ipAsset.mintAndRegisterIp({
    spgNftContract: (spgnftcontract? spgnftcontract.startsWith("0x")? spgnftcontract as `0x${string}` : `0x${spgnftcontract}` as `0x${string}`: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc") as `0x${string}`,
    ipMetadata:ipMetadata && nftMetadata
        ? {
            ipMetadataURI: `https://ipfs.io/ipfs/${ipcid}`,
            ipMetadataHash: `0x${ipHash}` as `0x${string}`,
            nftMetadataURI: `https://ipfs.io/ipfs/${nftcid}`,
            nftMetadataHash: `0x${nftHash}` as `0x${string}`,
          }
        : nftMetadata
        ? {
            nftMetadataURI: `https://ipfs.io/ipfs/${nftcid}`,
            nftMetadataHash: `0x${nftHash}` as `0x${string}`,
          }
        : ipMetadata
        ? {
            ipMetadataURI: `https://ipfs.io/ipfs/${ipcid}`,
            ipMetadataHash: `0x${ipHash}` as `0x${string}`,
          }
        : {},
    txOptions: { waitForTransaction: true },
  });

    return {
      txHash: response.txHash,
      ipId: response.ipId,
      tokenId: response.tokenId,
      explorerUrl: `https://aeneid.explorer.story.foundation/ipa/${response.ipId}`,
    };
  } catch (error) {
    console.error("Mint and register failed:", error instanceof Error ? error.message:String(error));
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
