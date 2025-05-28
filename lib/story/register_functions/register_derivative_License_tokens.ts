import { useStoryClient } from "../main_functions/story-network";

const register_derivative_License_tokens = async (
  childIpId: string,
  licenseTokenIds: string[] | bigint[] | number[],
  maxRts: number | string
) => {
  try {
    const { getStoryClient } = useStoryClient();
    const client = await getStoryClient();
    const response = await client.ipAsset.registerDerivativeWithLicenseTokens({
      childIpId: childIpId.startsWith("0x") ? childIpId as `0x${string}` : `0x${childIpId}` as `0x${string}`,
      licenseTokenIds: licenseTokenIds,
      maxRts: maxRts,
      txOptions: { waitForTransaction: true },
    });
    return {
      txHash: response.txHash,
    };
  } catch (error) {
    console.log(error instanceof Error ? error.message:String(error));
  }
};

export default register_derivative_License_tokens;
