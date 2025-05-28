import ipcid_nftcid from "../main_functions/ipcid_nftcid";
import { IpMetadata } from "@story-protocol/core-sdk";
import { useStoryClient } from "../main_functions/story-network";


export const mint_registerIp_makederivative = async (
  spgnftcontract: string,
  parentIpIds: string[] | bigint[] | number[],
  licenseTermsIds: string[] | bigint[] | number[],
  ipMetadata?: IpMetadata,
  nftMetadata?:any
) => {  
try {
  const { getStoryClient } = useStoryClient();
  const client = await getStoryClient();
    const {ipcid,ipHash,nftcid,nftHash} = await ipcid_nftcid(ipMetadata,nftMetadata);
    const response = await client.ipAsset.mintAndRegisterIpAndMakeDerivative({
        spgNftContract: spgnftcontract.startsWith("0x") ? spgnftcontract as `0x${string}` : `0x${spgnftcontract}` as `0x${string}`,
        derivData: {
          parentIpIds: parentIpIds.map((id) => id.toString().startsWith("0x") ? id.toString() as `0x${string}` : `0x${id.toString()}` as `0x${string}`),
          licenseTermsIds: licenseTermsIds,
        },
        ipMetadata: {
          ipMetadataURI: ipcid ? `https://ipfs.io/ipfs/${ipcid}` : "",
          ipMetadataHash: ipHash ? (`0x${ipHash}` as `0x${string}`) : undefined,
          nftMetadataURI: nftcid ? `https://ipfs.io/ipfs/${nftcid}` : "",
          nftMetadataHash: nftHash
            ? (`0x${nftHash}` as `0x${string}`)
            : undefined,
        },
        txOptions: { waitForTransaction: true },
      });
      
      return {
        txHash: response.txHash,
        ipId: response.ipId,
        receipt: response.receipt,
        tokenId: response.tokenId,
        explorerUrl: `https://aeneid.explorer.story.foundation/ipa/${response.ipId}`,
      };
} catch (error) {
    console.log(error instanceof Error? error.message :String(error))
}

}




export const batch_mint_registerIp_makederivative = async (
  items: {
    spgNftContract: string;
    parentIpIds: string[];
    licenseTermsIds: (string | number | bigint)[];
    ipMetadata?: IpMetadata;
    nftMetadata?:any
  }[]
) => {
  try {
    const { getStoryClient } = useStoryClient();
    const client = await getStoryClient();
    const args = await Promise.all(
      items.map(async (item) => {
        const { ipcid, ipHash, nftcid, nftHash } = await ipcid_nftcid(item.ipMetadata,item.nftMetadata);
        return {
          spgNftContract: item.spgNftContract.startsWith("0x")
            ? (item.spgNftContract as `0x${string}`)
            : (`0x${item.spgNftContract}` as `0x${string}`),

          derivData: {
            parentIpIds: item.parentIpIds.map((id) =>
              (id.startsWith("0x") ? id as `0x${string}` : `0x${id}` as `0x${string}`)
            ),
            licenseTermsIds: item.licenseTermsIds
              .map((id) => id.toString())
              .map((s) => s.startsWith("0x") ? s as `0x${string}` : `0x${s}` as `0x${string}`) as `0x${string}`[],
          },

          ipMetadata: {
            ipMetadataURI: ipcid ? `https://ipfs.io/ipfs/${ipcid}` : undefined,
            ipMetadataHash: ipHash
              ? (`0x${ipHash}` as `0x${string}`)
              : undefined,
            nftMetadataURI: nftcid
              ? `https://ipfs.io/ipfs/${nftcid}`
              : undefined,
            nftMetadataHash: nftHash
              ? (`0x${nftHash}` as `0x${string}`)
              : undefined,
          },
        };
      })
    );

    const response = await client.ipAsset.batchMintAndRegisterIpAndMakeDerivative({
      args,
      txOptions: { waitForTransaction: true },
    });


    return {
      txHash: response.txHash,
      ipIds: response.results?.map((r) => r.ipId) ?? [],
      tokenIds: response.results?.map((r) => r.tokenId) ?? [],
      explorerUrls: response.results?.map(
        (r) => `https://aeneid.explorer.story.foundation/ipa/${r.ipId}`
      ),
    };
  } catch (error: any) {
    console.error("Batch mint/register derivative error:", error instanceof Error ? error.message : String(error));
  }
};


