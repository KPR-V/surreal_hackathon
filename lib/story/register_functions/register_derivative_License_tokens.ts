import { StoryClient } from "@story-protocol/core-sdk";

const register_derivative_License_tokens = async (
  childIpId: string,
  licenseTokenIds: string[] | bigint[] | number[],
  maxRts: number | string,
  client: StoryClient
) => {
  try {
    const response = await client.ipAsset.registerDerivativeWithLicenseTokens({
      childIpId: childIpId.startsWith("0x") ? childIpId as `0x${string}` : `0x${childIpId}` as `0x${string}`,
      licenseTokenIds: licenseTokenIds,
      maxRts: maxRts,
      txOptions: { confirmations: 5 ,retryCount: 3 , pollingInterval: 1000 },
    });
    return {
      txHash: response.txHash,
    };
  } catch (error) {
    console.log(error instanceof Error ? error.message:String(error));
  }
};

export default register_derivative_License_tokens;
