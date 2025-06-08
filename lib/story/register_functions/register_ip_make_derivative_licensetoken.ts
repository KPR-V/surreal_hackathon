
import ipcid_nftcid from "../main_functions/ipcid_nftcid";
import { IpMetadata, StoryClient } from "@story-protocol/core-sdk";

const register_ip_make_derivative_licensetoken = async (
  nftContract: string,
  tokenId: string | number | bigint,
  licenseTokenIds: string[] | bigint[] | number[],
  maxRts: number | string,
  client: StoryClient,
  ipmetadata?: IpMetadata,
  nftmetadata?:any
) => {
  try {
    const { ipcid, nftcid, ipHash, nftHash } = await ipcid_nftcid(ipmetadata,nftmetadata);
    const response = await client.ipAsset.registerIpAndMakeDerivativeWithLicenseTokens({
        nftContract: nftContract.startsWith("0x") ? nftContract as `0x${string}` : `0x${nftContract}` as `0x${string}`, 
        tokenId: tokenId,
        licenseTokenIds: licenseTokenIds,
        maxRts: maxRts,
        ipMetadata: {
          ipMetadataURI: ipcid ? `https://ipfs.io/ipfs/${ipcid}` : "",
          ipMetadataHash: ipHash ? (`0x${ipHash}` as `0x${string}`) : undefined,
          nftMetadataURI: nftcid ? `https://ipfs.io/ipfs/${nftcid}` : "",
          nftMetadataHash: nftHash
            ? (`0x${nftHash}` as `0x${string}`)
            : undefined,
        },
        txOptions: { confirmations: 5 ,retryCount: 3 , pollingInterval: 1000 },
      });

    return {
      explorerUrl: `https://aeneid.explorer.story.foundation/ipa/${response.ipId}`,
      ipId: response.ipId,
      txHash: response.txHash,
    };
  } catch (error) {
    console.log(error instanceof Error ? error.message:String(error));
  }
};
export default register_ip_make_derivative_licensetoken;
