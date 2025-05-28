import { IpMetadata, LicenseTerms } from "@story-protocol/core-sdk";
import ipcid_nftcid from "../main_functions/ipcid_nftcid";
import { useStoryClient } from "../main_functions/story-network";

export const mint_register_pilterms = async (
  terms: LicenseTerms,
  spgnftcontract?: string,
  ipMetadata?: IpMetadata,
  nftMetadata?:any
) => {
  const { ipcid, ipHash, nftcid, nftHash } = await ipcid_nftcid(ipMetadata,nftMetadata);
  try {
    const { getStoryClient } = useStoryClient();
    const client = await getStoryClient();
    const response = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
      spgNftContract: (spgnftcontract? spgnftcontract.startsWith("0x")? spgnftcontract as `0x${string}` : `0x${spgnftcontract}` as `0x${string}`: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc") as `0x${string}`,
    licenseTermsData: [{ terms: terms }],
    ipMetadata: {
      ipMetadataURI: ipcid ? `https://ipfs.io/ipfs/${ipcid}` : "",
      ipMetadataHash: ipHash ? `0x${ipHash}` : undefined,
      nftMetadataURI: nftcid ? `https://ipfs.io/ipfs/${nftcid}` : "",
      nftMetadataHash: nftHash ? `0x${nftHash}` : undefined,
    },
    txOptions: { waitForTransaction: true },
  });
  return {
    tokenId: response.tokenId,
    ipId: response.ipId,
    licenseTermsIds: response.licenseTermsIds,
    txHash: response.txHash,
  };
  } catch (error) {
    console.error("Mint and register failed:", error instanceof Error ? error.message:String(error));
  }
};

export const batch_mint_register_pilterms = async (items: {
  spgNftContract?: string;
  terms: LicenseTerms;
  ipMetadata?: IpMetadata;
  nftMetadata?: any;
}[]) => {
  const { getStoryClient } = useStoryClient();
  const client = await getStoryClient();
  const args = await Promise.all(
    items.map(async (item) => {
      const { ipcid, ipHash, nftcid, nftHash } = await ipcid_nftcid(
        item.ipMetadata,
        item.nftMetadata
      );

      return {
        spgNftContract: (item.spgNftContract
          ? item.spgNftContract.startsWith("0x")
            ? item.spgNftContract
            : `0x${item.spgNftContract}` as `0x${string}`
          : "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc") as `0x${string}`,
        licenseTermsData: [{ terms: item.terms }],
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
    const response = await client.ipAsset.batchMintAndRegisterIpAssetWithPilTerms({
      args,
      txOptions: { waitForTransaction: true },
    });

  const results = response.results?.map((result) => ({
    tokenId: result.tokenId,
    ipId: result.ipId,
    licenseTermsIds: result.licenseTermsIds,
    spgNftContract: result.spgNftContract,
  }));

  return {
    results: results,
    txHash: response.txHash,
  };
  } catch (error) {
    console.error("Batch mint and register failed:", error instanceof Error ? error.message:String(error));
  }
};