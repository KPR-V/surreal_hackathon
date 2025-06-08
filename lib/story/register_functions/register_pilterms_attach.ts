import { LicenseTerms, StoryClient } from "@story-protocol/core-sdk";


const register_pilterms_attach = async (
  ipid: string,
  licensetermsdata: LicenseTerms,
  client: StoryClient
) => {
  try {
    const response = await client.ipAsset.registerPilTermsAndAttach({
      ipId: ipid.startsWith("0x") ? ipid as `0x${string}` : `0x${ipid}` as `0x${string}`,
      licenseTermsData: [{ terms: licensetermsdata }],
      txOptions: { confirmations: 5 ,retryCount: 3 , pollingInterval: 1000 },
    });

    return {
      licensetermsids: response.licenseTermsIds,
      txHash: response.txHash,
    };
  } catch (error) {
    console.log(error instanceof Error ? error.message:String(error));
  }
};

export default register_pilterms_attach;
