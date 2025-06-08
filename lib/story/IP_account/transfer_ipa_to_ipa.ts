
import { parseEther } from "viem";
import { StoryClient, WIP_TOKEN_ADDRESS } from "@story-protocol/core-sdk";
const MERC20_TOKEN_ADDRESS = "0xF2104833d386a2734a4eB3B8ad6FC6812F29E38E";



export const transfer_ipaccount_to_ipaccount = async (amount: string,ipid: string,receiver_address: string,useWipToken: boolean,client: StoryClient) => {
    try{
    const response = await client.ipAccount.transferErc20({
      ipId: ipid.startsWith("0x")? (ipid as `0x${string}`): (`0x${ipid}` as `0x${string}`),
      tokens: [
        {
          address: useWipToken ? WIP_TOKEN_ADDRESS : MERC20_TOKEN_ADDRESS,
          amount: parseEther(amount),
          target: receiver_address.startsWith("0x")? (receiver_address as `0x${string}`): (`0x${receiver_address}` as `0x${string}`),
        },
      ],  
      txOptions: { confirmations: 5 ,retryCount: 3 , pollingInterval: 1000 },
    });
  
    return `Transferred IP Account to IP Account. Transaction hash: ${response.txHash} and transaction receipt: ${response.receipt}`;
    } catch (error) {
        console.error("Transfer failed:", error instanceof Error ? error.message : String(error));
    }
  };