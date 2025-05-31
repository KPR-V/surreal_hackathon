import ipcid_nftcid from "../main_functions/ipcid_nftcid";
import { IpMetadata, StoryClient } from "@story-protocol/core-sdk";

const mint_registerIp_makederivative_licensetokens = async (
  spgnftcontract: string,
  licenseTokenIds: string[] | bigint[] | number[],
  maxRts: number | string,
  client: StoryClient,
  ipMetadata?: IpMetadata,
  nftMetadata?:any
) => {
  try {
    const { ipcid, ipHash, nftcid, nftHash } = await ipcid_nftcid(
      ipMetadata,
      nftMetadata
    );
    const response =
      await client.ipAsset.mintAndRegisterIpAndMakeDerivativeWithLicenseTokens({
        spgNftContract: spgnftcontract.startsWith("0x") ? spgnftcontract as `0x${string}` : `0x${spgnftcontract}` as `0x${string}`,
        licenseTokenIds: licenseTokenIds,
        ipMetadata: {
          ipMetadataURI: ipcid ? `https://ipfs.io/ipfs/${ipcid}` : "",
          ipMetadataHash: ipHash ? (`0x${ipHash}` as `0x${string}`) : undefined,
          nftMetadataURI: nftcid ? `https://ipfs.io/ipfs/${nftcid}` : "",
          nftMetadataHash: nftHash
            ? (`0x${nftHash}` as `0x${string}`)
            : undefined,
        },
        maxRts: maxRts,
        txOptions: { waitForTransaction: true },
      });

    return {
      txHash: response.txHash,
      ipId: response.ipId,
      tokenId: response.tokenId,
    };
  } catch (error) {
    console.log(error instanceof Error ? error.message :String(error));
  }
};
export default mint_registerIp_makederivative_licensetokens;
