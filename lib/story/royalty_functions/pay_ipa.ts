import { useStoryClient } from "../main_functions/story-network";
import { zeroAddress, parseEther } from "viem";
import { StoryClient, WIP_TOKEN_ADDRESS } from "@story-protocol/core-sdk";
const MERC20_TOKEN_ADDRESS = "0xF2104833d386a2734a4eB3B8ad6FC6812F29E38E";

export const tipIpAsset = async (
  receiverIpId: string,
  amount: string,
  useWipToken: boolean,
  client: StoryClient
) => {
  try{
  const tokenAddress = useWipToken ? WIP_TOKEN_ADDRESS : MERC20_TOKEN_ADDRESS;
  const response = await client.royalty.payRoyaltyOnBehalf({
    receiverIpId: receiverIpId.startsWith("0x") ? receiverIpId as `0x${string}` : `0x${receiverIpId}` as `0x${string}`,
    payerIpId: zeroAddress,
    token: tokenAddress,
    amount: parseEther(amount),
    txOptions: { waitForTransaction: true },
  });

  return `Tipped IP Asset with ${
    useWipToken ? "WIP" : "MERC20"
  } token. Transaction hash: ${response.txHash} and transaction receipt: ${
    response.receipt
  }`;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }
};

export const fulfillLicenseTerms = async (
  receiverIpId: string,
  payerIpId: string,
  amount: string,
  useWipToken: boolean,
  client: StoryClient
) => {
  try{
  const tokenAddress = useWipToken ? WIP_TOKEN_ADDRESS : MERC20_TOKEN_ADDRESS;
  const response = await client.royalty.payRoyaltyOnBehalf({
    receiverIpId: receiverIpId.startsWith("0x") ? receiverIpId as `0x${string}` : `0x${receiverIpId}` as `0x${string}`,
    payerIpId: payerIpId.startsWith("0x") ? payerIpId as `0x${string}` : `0x${payerIpId}` as `0x${string}`,
    token: tokenAddress,
    amount: parseEther(amount),
    txOptions: { waitForTransaction: true },
  });

  return `Royalty payment made with ${
    useWipToken ? "WIP" : "MERC20"
  } token. Transaction hash: ${response.txHash} and transaction receipt: ${
    response.receipt
  }`;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }
};