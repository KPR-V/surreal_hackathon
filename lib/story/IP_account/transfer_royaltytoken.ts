import { StoryClient } from "@story-protocol/core-sdk";
import { parseEther } from "viem";

export const transfer_royalty_token = async (
  amount: string,
  royalty_contract_address: string,
  ipid: string,
  receiver_address: string,
  client: StoryClient
) => {
  try {
    console.log('Transfer royalty token parameters:', {
      amount: `${amount} tokens`,
      royalty_contract_address,
      ipid,
      receiver_address,
      network: 'aeneid'
    });

    const response = await client.ipAccount.transferErc20({
      ipId: ipid.startsWith("0x") ? (ipid as `0x${string}`) : (`0x${ipid}` as `0x${string}`),
      tokens: [
        {
          address: royalty_contract_address.startsWith("0x") 
            ? (royalty_contract_address as `0x${string}`) 
            : (`0x${royalty_contract_address}` as `0x${string}`),
          amount: parseEther(amount),
          target: receiver_address.startsWith("0x") 
            ? (receiver_address as `0x${string}`) 
            : (`0x${receiver_address}` as `0x${string}`),
        },
      ],
      txOptions: { confirmations: 3, retryCount: 3, pollingInterval: 2000 },
    });

    console.log('Royalty token transfer successful:', {
      txHash: response.txHash,
      receipt: response.receipt,
      amount: amount,
      from_vault: royalty_contract_address,
      to_receiver: receiver_address,
      ip_account: ipid
    });

    return {
      txhash:response.txHash,
      receipt:response?.receipt
    };
    
  } catch (error) {
    console.error("Royalty token transfer failed:", {
      error: error instanceof Error ? error.message : String(error),
      parameters: {
        amount,
        royalty_contract_address,
        ipid,
        receiver_address
      }
    });
    
    // Re-throw the error with more context
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to transfer ${amount} royalty tokens from vault ${royalty_contract_address} to ${receiver_address}: ${errorMessage}`);
  }
};