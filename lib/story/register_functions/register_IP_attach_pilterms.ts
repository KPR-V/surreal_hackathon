import { IpMetadata, LicenseTerms } from "@story-protocol/core-sdk";
import  ipcid_nftcid  from "../main_functions/ipcid_nftcid";
import { useStoryClient } from "../main_functions/story-network";
export const register_pilterms = async (
  nftContract: string,
  tokenId: string | number | bigint,
  licenseTermsData: LicenseTerms,
  ipmetadata?: IpMetadata,
  nftmetadata?:any
) => {
  const { ipcid, ipHash, nftcid, nftHash } = await ipcid_nftcid(ipmetadata,nftmetadata);
  try {
    const { getStoryClient } = useStoryClient();
    const client = await getStoryClient();
    const response = await client.ipAsset.registerIpAndAttachPilTerms({
      nftContract: (nftContract.startsWith("0x") ? nftContract : `0x${nftContract}`) as `0x${string}`,
      tokenId: tokenId,
      licenseTermsData: [{ terms: licenseTermsData }],
      ipMetadata: {
        ipMetadataURI: ipcid ? `https://ipfs.io/ipfs/${ipcid}` : "",
        ipMetadataHash: ipHash ? `0x${ipHash}` as `0x${string}` : undefined,
        nftMetadataURI: nftcid ? `https://ipfs.io/ipfs/${nftcid}` : "",
        nftMetadataHash: nftHash ? `0x${nftHash}` as `0x${string}` : undefined,
      },
      txOptions: { waitForTransaction: true },
    });

    return {
      txHash: response.txHash,
      ipId: response.ipId,
    };
  } catch (error) {
    console.error("Registration failed:", error instanceof Error ? error.message:String(error));
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
