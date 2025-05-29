import { useStoryClient } from "../main_functions/story-network";


export const mint_licensetoken = async (licenseTermsId: string | number | bigint ,licensoripid:string,receiver:string,amount?: string | number | bigint ,maxMintingFee?: string | number | bigint ,maxRevenueShare?: string | number  )=> {
  try {
    const { getStoryClient } = useStoryClient();
    const client = await getStoryClient();
    const response = await client.license.mintLicenseTokens({
    licenseTermsId: licenseTermsId ,
    licensorIpId: (licensoripid.startsWith("0x") ? licensoripid : `0x${licensoripid}`) as `0x${string}`,
    receiver: (receiver? receiver.startsWith("0x")? receiver: `0x${receiver}`: undefined) as `0x${string}`,
    amount: amount,
    maxMintingFee: maxMintingFee? BigInt(maxMintingFee): BigInt(0), 
    maxRevenueShare: maxRevenueShare? maxRevenueShare: 10000000, 
    txOptions: { waitForTransaction: true },
  });

    return {
      txHash: response.txHash,
      licenseTokenIds: response.licenseTokenIds,
    };
  } catch (error) {
    console.error("License token minting failed:", error instanceof Error ? error.message : String(error));
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

