
import ipcid_nftcid from "../main_functions/ipcid_nftcid";
import { IpMetadata, StoryClient } from "@story-protocol/core-sdk";




export const register_derivative_ip = async (
  nftContract: string,
  client: StoryClient,
  tokenId: string | number | bigint,
  parentIpIds: string[],
  licenseTermsIds: string[] | bigint[] | number[],
  ipmetadata?: IpMetadata,
  nftmetadata?:any
) => {
    try {
        const {ipcid,ipHash,nftcid,nftHash} = await ipcid_nftcid(ipmetadata,nftmetadata);
  const response = await client.ipAsset.registerDerivativeIp({
  nftContract: nftContract.startsWith("0x") ? nftContract as `0x${string}` : `0x${nftContract}` as `0x${string}`, 
  tokenId: tokenId,
  derivData: {
    parentIpIds: parentIpIds.map((id) => id.startsWith("0x") ? id as `0x${string}` : `0x${id}` as `0x${string}`),
    licenseTermsIds: licenseTermsIds,
  },
      ipMetadata: {
    ipMetadataURI: ipcid ? `https://ipfs.io/ipfs/${ipcid}` : "",
    ipMetadataHash: ipHash ? `0x${ipHash}` as `0x${string}` : undefined,
    nftMetadataHash: nftHash ? `0x${nftHash}` as `0x${string}` : undefined,
    nftMetadataURI: nftcid ? `https://ipfs.io/ipfs/${nftcid}` : "",
  },
  txOptions: { confirmations: 5 ,retryCount: 3 , pollingInterval: 1000 },
});

return {
    txHash: response.txHash,
    ipId: response.ipId,
    tokenId: response.tokenId,
    receipt: response.receipt,
    explorerUrl: `https://aeneid.explorer.story.foundation/ipa/${response.ipId}`,
  };

    }catch(error){
      console.log(error instanceof Error ? error.message:String(error));
    }
}




export const batch_register_derivative_ip = async (
    childIpIds: string[],
    client: StoryClient,
    parentIpIdsArray: string[][],
    licenseTermsIdsArray: (string[] | bigint[] | number[])[],
    maxMintingFees?: (bigint | string | number)[],
    maxRevenueShares?: (number | string)[],
    maxRtsArray?: (number | string)[],
    licenseTemplates?: string[],
  ) => {
    try {
      const args= childIpIds.map((childIpId, index) => ({
        childIpId: childIpId.startsWith("0x") ? childIpId as `0x${string}` : `0x${childIpId}` as `0x${string}`,
        parentIpIds: parentIpIdsArray[index].map((id) => id.startsWith("0x") ? id as `0x${string}` : `0x${id}` as `0x${string}`),
        licenseTermsIds: licenseTermsIdsArray[index],
        maxMintingFee: maxMintingFees ? maxMintingFees[index] : undefined,
        maxRevenueShare: maxRevenueShares ? maxRevenueShares[index] : undefined,
        maxRts: maxRtsArray ? maxRtsArray[index] : undefined,
        licenseTemplate: licenseTemplates ? `0x${licenseTemplates[index]}` as `0x${string}` : undefined,
      }));
  
      const response = await client.ipAsset.batchRegisterDerivative({
        args,
        txOptions : {confirmations: 5 ,retryCount: 3 , pollingInterval: 1000},
      });
  
      return {
        txHash: response.txHash,
      };
    } catch (error) {
      console.log(error instanceof Error ? error.message:String(error));
    }
  };
  
