import { StoryClient } from "@story-protocol/core-sdk";
import { parseEther } from "viem";
export const transfer_royalty_token = async (amount: string,royaltl_contract_address: string,ipid: string,receiver_address: string,client: StoryClient) => {
    try{
    const response = await client.ipAccount.transferErc20({
      ipId: ipid.startsWith("0x")? (ipid as `0x${string}`): (`0x${ipid}` as `0x${string}`),
      tokens: [
        {
          address: royaltl_contract_address.startsWith("0x")? (royaltl_contract_address as `0x${string}`): (`0x${royaltl_contract_address}` as `0x${string}`),
          amount: parseEther(amount),
          target: receiver_address.startsWith("0x")? (receiver_address as `0x${string}`): (`0x${receiver_address}` as `0x${string}`),
        },
      ],
        txOptions: { confirmations: 5 ,retryCount: 3 , pollingInterval: 1000 },
    });
  
    return `Transferred royalty token. Transaction hash: ${response.txHash} and transaction receipt: ${response.receipt}`;
    } catch (error) {
        console.error("Transfer failed:", error instanceof Error ? error.message : String(error));
    }
  };