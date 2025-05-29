import { useStoryClient } from "../main_functions/story-network";
export const attachpilterms = async (licenseTermsId: string | number | bigint,ipid: string) => {
  try {
    const { getStoryClient } = useStoryClient();
    const client = await getStoryClient();
    const response = await client.license.attachLicenseTerms({
      licenseTermsId: licenseTermsId,
      ipId: ipid.startsWith("0x") ? ipid as `0x${string}` : `0x${ipid}` as `0x${string}`,
      txOptions: { waitForTransaction: true },
    });
  
    if (response.success) {
      return `Attached License Terms to IPA at transaction hash ${response.txHash}.`;
    } else {
      return `License Terms already attached to this IPA.`;
    }
  } catch (error) {
    console.error("Attachment failed:", error instanceof Error ? error.message : String(error));
  }
};
