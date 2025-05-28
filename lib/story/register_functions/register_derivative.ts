import { useStoryClient } from "../main_functions/story-network";

const register_derivative = async (
  childIpId: string,
  parentIpIds: string[],
  licenseTermsIds: string[] | bigint[] | number[]
) => {
  try {
    const { getStoryClient } = useStoryClient();
    const client = await getStoryClient();
    const response = await client.ipAsset.registerDerivative({
      childIpId: childIpId.startsWith("0x") ? childIpId as `0x${string}` : `0x${childIpId}` as `0x${string}`,
      parentIpIds: parentIpIds.map((id) => id.startsWith("0x") ? id as `0x${string}` : `0x${id}` as `0x${string}`),
      licenseTermsIds: licenseTermsIds,
      txOptions: { waitForTransaction: true },
    });

    return {
      txHash: response.txHash,
    };
  } catch (error) {
    console.log(error instanceof Error ? error.message:String(error));
  }
};
export default register_derivative;
