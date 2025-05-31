import { StoryClient, WIP_TOKEN_ADDRESS } from "@story-protocol/core-sdk";
import { useStoryClient } from "../main_functions/story-network";
const MERC20_TOKEN_ADDRESS = "0xF2104833d386a2734a4eB3B8ad6FC6812F29E38E"

export const claim_revenue_myip = async (ipId: string, useWipToken: boolean , client: StoryClient) => {
  const tokenAddress = useWipToken ? WIP_TOKEN_ADDRESS : MERC20_TOKEN_ADDRESS;
  try{
  const claimRevenue = await client.royalty.claimAllRevenue({
    ancestorIpId: ipId.startsWith("0x") ? ipId as `0x${string}` : `0x${ipId}` as `0x${string}`,
    claimer: ipId.startsWith("0x") ? ipId as `0x${string}` : `0x${ipId}` as `0x${string}`,
    currencyTokens: [tokenAddress as `0x${string}`],
    childIpIds: [],
    royaltyPolicies: [],
    claimOptions: {
      autoTransferAllClaimedTokensFromIp: true,
      autoUnwrapIpTokens: true,
    },
  });

  return {
    txHash: claimRevenue.txHashes,
    claimedTokens: claimRevenue.claimedTokens,
    receipt: claimRevenue.receipt,
  }
  }catch(error){
    console.error(error instanceof Error ? error.message : String(error));
  }
}



export const claim_revenue_from_childip = async (ipId: string, childIpId: string, useWipToken: boolean , royaltyPolicy: string , autoUnwrapIpTokens: boolean, client: StoryClient) => {
  const tokenAddress = useWipToken ? WIP_TOKEN_ADDRESS : MERC20_TOKEN_ADDRESS;
  try{
  const claimRevenue = await client.royalty.claimAllRevenue({
    ancestorIpId: ipId.startsWith("0x") ? ipId as `0x${string}` : `0x${ipId}` as `0x${string}`,
    claimer: ipId.startsWith("0x") ? ipId as `0x${string}` : `0x${ipId}` as `0x${string}`,
    currencyTokens: [tokenAddress as `0x${string}`],
    childIpIds: [childIpId.startsWith("0x") ? childIpId as `0x${string}` : `0x${childIpId}` as `0x${string}`],
    royaltyPolicies: [royaltyPolicy.startsWith("0x") ? royaltyPolicy as `0x${string}` : `0x${royaltyPolicy}` as `0x${string}`],
    claimOptions: {
      autoTransferAllClaimedTokensFromIp: true,
      autoUnwrapIpTokens: autoUnwrapIpTokens,
    },
  });

  return {
    txHash: claimRevenue.txHashes,
    claimedTokens: claimRevenue.claimedTokens,
    receipt: claimRevenue.receipt,
  }
  }catch(error){
    console.error(error);
  }
}

// Wrapper for claimableRevenue: retrieves total claimable revenue tokens for a claimer
export const claimable_revenue = async (
  royaltyVaultIpId: string, //same as ipId
  claimer: string,
  useWipToken: boolean,
  client: StoryClient
) => {
  try{
  const formattedVaultId = royaltyVaultIpId.startsWith("0x")
    ? (royaltyVaultIpId as `0x${string}`)
    : (`0x${royaltyVaultIpId}` as `0x${string}`);
  const formattedClaimer = claimer.startsWith("0x")
    ? (claimer as `0x${string}`)
    : (`0x${claimer}` as `0x${string}`);
  const formattedToken =  useWipToken ? WIP_TOKEN_ADDRESS : MERC20_TOKEN_ADDRESS;
  const amount = await client.royalty.claimableRevenue({
    royaltyVaultIpId: formattedVaultId,
    claimer: formattedClaimer,
    token: formattedToken,
  });
return {
    amount: amount,
  }
  }catch(error){
    console.error(error instanceof Error ? error.message : String(error));
  }
};

// Wrapper for batchClaimAllRevenue: batch claim from multiple vaults
export const batch_claim_all_revenue = async (
  requests: {
    ancestorIpId: string;
    claimer: string;
    childIpIds: string[];
    royaltyPolicies: string[];
    useWipToken: boolean;
  }[],
  client: StoryClient
) => {
  
  const formatted = requests.map((req) => ({
    ipId: req.ancestorIpId.startsWith("0x") ? (req.ancestorIpId as `0x${string}`) : (`0x${req.ancestorIpId}` as `0x${string}`),
    claimer: req.claimer.startsWith("0x") ? (req.claimer as `0x${string}`) : (`0x${req.claimer}` as `0x${string}`),
    childIpIds: req.childIpIds.map((id) =>
      id.startsWith("0x") ? (id as `0x${string}`) : (`0x${id}` as `0x${string}`)
    ),
    royaltyPolicies: req.royaltyPolicies.map((id) =>
      id.startsWith("0x") ? (id as `0x${string}`) : (`0x${id}` as `0x${string}`)
    ),
    currencyTokens: [(req.useWipToken ? WIP_TOKEN_ADDRESS : MERC20_TOKEN_ADDRESS) as `0x${string}`],
  }));
  try{
  const response = await client.royalty.batchClaimAllRevenue({
    ancestorIps: formatted,
    claimOptions:{
      autoTransferAllClaimedTokensFromIp: true,
      autoUnwrapIpTokens: true,
    },
    options:{
      useMulticallWhenPossible: true,
    }
  });
  return {
    txHashes: response?.txHashes,
    claimedTokens: response?.claimedTokens,
    receipt: response?.receipts,
  }
  }catch(error){
    console.error(error instanceof Error ? error.message : String(error));
  }
};

// Wrapper for getRoyaltyVaultAddress: retrieves vault address for an IP asset
export const get_royalty_vault_address = async (ipId: string, client: StoryClient) => {
  
  const formattedIpId = ipId.startsWith("0x")
    ? (ipId as `0x${string}`)
    : (`0x${ipId}` as `0x${string}`);
    try{
  const address = await client.royalty.getRoyaltyVaultAddress(formattedIpId);
  return address;
  }catch(error){
    console.error(error instanceof Error ? error.message : String(error));
  }
};

// Wrapper for transferToVault: transfers revenue tokens to an ancestor vault
export const transfer_to_vault = async (
  royaltyPolicy: string,
  ipId: string,
  ancestorIpId: string,
  useWipToken: boolean,
  client: StoryClient
) => {
  const formattedPolicy = royaltyPolicy.startsWith("0x")
    ? (royaltyPolicy as `0x${string}`)
    : (`0x${royaltyPolicy}` as `0x${string}`);
  const formattedIpId = ipId.startsWith("0x")
    ? (ipId as `0x${string}`)
    : (`0x${ipId}` as `0x${string}`);
  const formattedAncestor = ancestorIpId.startsWith("0x")
    ? (ancestorIpId as `0x${string}`)
    : (`0x${ancestorIpId}` as `0x${string}`);
  const formattedToken = useWipToken ? WIP_TOKEN_ADDRESS : MERC20_TOKEN_ADDRESS;
  try{
  const response = await client.royalty.transferToVault({
    royaltyPolicy: formattedPolicy,
    ipId: formattedIpId,
    ancestorIpId: formattedAncestor,
    token: formattedToken,
    txOptions: { waitForTransaction: true },
  });
  return {
    txHash: response?.txHash,
    receipt: response?.receipt,
  };
  }catch(error){
    console.error(error instanceof Error ? error.message : String(error));
  }
};