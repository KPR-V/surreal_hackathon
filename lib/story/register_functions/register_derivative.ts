import { StoryClient } from "@story-protocol/core-sdk";

const register_derivative = async (
  childIpId: string,
  parentIpIds: string[],
  licenseTermsIds: string[] | bigint[] | number[],
  client: StoryClient
) => {
  try {
    const response = await client.ipAsset.registerDerivative({
      childIpId: childIpId.startsWith("0x") ? childIpId as `0x${string}` : `0x${childIpId}` as `0x${string}`,
      parentIpIds: parentIpIds.map((id) => id.startsWith("0x") ? id as `0x${string}` : `0x${id}` as `0x${string}`),
      licenseTermsIds: licenseTermsIds,
      txOptions: { confirmations: 5 ,retryCount: 3 , pollingInterval: 1000 },
    });

    return {
      txHash: response.txHash,
    };
  } catch (error) {
    console.log(error instanceof Error ? error.message:String(error));
  }
};
export default register_derivative;
