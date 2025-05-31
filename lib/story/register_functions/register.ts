
import ipcid_nftcid from "../main_functions/ipcid_nftcid";
import {  IpMetadata, StoryClient } from "@story-protocol/core-sdk";

interface BatchRegisterItem {
  nftContract: string;
  tokenId: string | number | bigint;
  ipMetadata?: IpMetadata;
  nftMetadata?: any;
}

export const register = async (nftContract: string,tokenId: string | number | bigint, client: StoryClient, ipMetadata?: IpMetadata,nftMetadata?:any) => {
  const { ipcid, ipHash, nftcid, nftHash } = await ipcid_nftcid(ipMetadata, nftMetadata);
  try {
    const response = await client.ipAsset.register({
      nftContract: (nftContract.startsWith("0x") ? nftContract as `0x${string}` : `0x${nftContract}` as `0x${string}`),
      tokenId: tokenId,
      ipMetadata: {
        ipMetadataURI: ipcid ? `https://ipfs.io/ipfs/${ipcid}` : "",
        ipMetadataHash: ipHash ? `0x${ipHash}` as `0x${string}` : undefined,
        nftMetadataURI: nftcid ? `https://ipfs.io/ipfs/${nftcid}` : "",
        nftMetadataHash: nftHash ? `0x${nftHash}` as `0x${string}` : undefined,
      },
      txOptions: { waitForTransaction: true },
    });
  
    return {
      explorerUrl: `https://aeneid.explorer.story.foundation/ipa/${response.ipId}`,
      ipId: response.ipId,
      txHash: response.txHash,
      receipt: response.receipt
    };
  } catch (error) {
    console.error("Registration failed:", error instanceof Error ? error.message:String(error));
  }
};




export const batchRegister = async (items: BatchRegisterItem[], client: StoryClient) => {
  const args = await Promise.all(
    items.map(async (item) => {
      const { ipcid, ipHash, nftcid, nftHash } = await ipcid_nftcid(item.ipMetadata,item.nftMetadata);
      return {
        nftContract: (item.nftContract.startsWith("0x") 
          ? item.nftContract as `0x${string}`
          : `0x${item.nftContract}` as `0x${string}`),
        tokenId: item.tokenId,
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
    const response = await client.ipAsset.batchRegister({
      args,
      txOptions: { waitForTransaction: true },
    });

  const explorerBase = "https://aeneid.explorer.story.foundation/ipa";
  const links: string[] =
    response.results?.map((result) => `${explorerBase}/${result.ipId}`) || [];
  
    return {
      links,
      tokenid:response.results?.map((result)=>result.tokenId),
      ipid:response.results?.map((result)=>result.ipId),
      txhash:response.txHash,
      spgTxHash:response.spgTxHash
    };
  } catch (error) {
    console.error("Batch registration failed:", error instanceof Error ? error.message:String(error));
  }
};
