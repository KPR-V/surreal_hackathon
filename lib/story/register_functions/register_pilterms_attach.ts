import { LicenseTerms } from "@story-protocol/core-sdk";
import { useStoryClient } from "../main_functions/story-network";

const register_pilterms_attach = async (
  ipid: string,
  licensetermsdata: LicenseTerms
) => {
  try {
    const { getStoryClient } = useStoryClient();
    const client = await getStoryClient();  
    const response = await client.ipAsset.registerPilTermsAndAttach({
      ipId: ipid.startsWith("0x") ? ipid as `0x${string}` : `0x${ipid}` as `0x${string}`,
      licenseTermsData: [{ terms: licensetermsdata }],
      txOptions: { waitForTransaction: true },
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
