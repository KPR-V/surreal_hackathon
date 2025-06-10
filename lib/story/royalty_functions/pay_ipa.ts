import { zeroAddress, parseEther } from "viem";
import { StoryClient, WIP_TOKEN_ADDRESS } from "@story-protocol/core-sdk";

const MERC20_TOKEN_ADDRESS = "0xF2104833d386a2734a4eB3B8ad6FC6812F29E38E";

export const tipIpAsset = async (
  receiverIpId: string,
  amount: string,
  useWipToken: boolean,
  client: StoryClient
) => {
  try {
    console.log(`Attempting to tip IP asset: ${receiverIpId} with ${amount} ${useWipToken ? 'WIP' : 'MERC20'} tokens`);
    
    // Format receiverIpId to ensure it has 0x prefix
    const formattedReceiverId = receiverIpId.startsWith("0x") ? receiverIpId as `0x${string}` : `0x${receiverIpId}` as `0x${string}`;
    
    // Determine which token to use
    const tokenAddress = useWipToken ? WIP_TOKEN_ADDRESS : MERC20_TOKEN_ADDRESS;
    
    console.log(`Using token address: ${tokenAddress}`);
    console.log(`Formatted receiver ID: ${formattedReceiverId}`);
    console.log(`Amount in Wei: ${parseEther(amount)}`);
    
    // Execute the royalty payment with proper structure
    const response = await client.royalty.payRoyaltyOnBehalf({
      receiverIpId: formattedReceiverId,
      payerIpId: zeroAddress,
      token: tokenAddress as `0x${string}`,
      amount: parseEther(amount),
      txOptions: { waitForTransaction: true },
      wipOptions: {
        useMulticallWhenPossible: false, // Disable multicall to avoid the error
        enableAutoWrapIp: true,
        enableAutoApprove: true
      },
      erc20Options: {
        enableAutoApprove: true
      }
    });

    console.log("Tip transaction successful:", response);
    
    return {
      success: true,
      message: `Successfully tipped ${amount} ${useWipToken ? "WIP" : "MERC20"} tokens to the IP asset creator`,
      txHash: response.txHash || '',
      receipt: response.receipt
    };
  } catch (error) {
    console.error("Tip transaction failed:", error);
    
    // Extract useful error message
    let errorMessage = "Unknown error occurred during tip transaction";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific error cases
      if (errorMessage.includes("RoyaltyModule__ZeroReceiverVault")) {
        errorMessage = "This IP asset cannot receive tips because it doesn't have a royalty vault configured. The creator needs to set up royalty collection first.";
      } else if (errorMessage.includes("Multicall3: call failed")) {
        errorMessage = "Transaction failed. Please ensure you have sufficient token balance and the correct token is approved for spending.";
      } else if (errorMessage.includes("User rejected the request")) {
        errorMessage = "Transaction was rejected in your wallet.";
      } else if (errorMessage.includes("insufficient funds")) {
        errorMessage = `Insufficient ${useWipToken ? 'WIP' : 'MERC20'} token balance. Please check your wallet balance.`;
      } else if (errorMessage.includes("allowance")) {
        errorMessage = "Token approval failed. Please try again or approve the token manually in your wallet.";
      }
    }
    
    return {
      success: false,
      message: "Failed to tip IP asset",
      error: errorMessage
    };
  }
};

export const fulfillLicenseTerms = async (
  receiverIpId: string,
  payerIpId: string,
  amount: string,
  useWipToken: boolean,
  client: StoryClient
) => {
  try {
    console.log(`Attempting to fulfill license terms from ${payerIpId} to ${receiverIpId} with ${amount} ${useWipToken ? 'WIP' : 'MERC20'} tokens`);
    
    // Format IDs to ensure they have 0x prefix
    const formattedReceiverId = receiverIpId.startsWith("0x") ? receiverIpId as `0x${string}` : `0x${receiverIpId}` as `0x${string}`;
    const formattedPayerId = payerIpId.startsWith("0x") ? payerIpId as `0x${string}` : `0x${payerIpId}` as `0x${string}`;
    
    // Determine which token to use
    const tokenAddress = useWipToken ? WIP_TOKEN_ADDRESS : MERC20_TOKEN_ADDRESS;
    
    // Execute the royalty payment with proper structure
    const response = await client.royalty.payRoyaltyOnBehalf({
      receiverIpId: formattedReceiverId,
      payerIpId: formattedPayerId,
      token: tokenAddress as `0x${string}`,
      amount: parseEther(amount),
      txOptions: { waitForTransaction: true },
      wipOptions: {
        useMulticallWhenPossible: false, // Disable multicall to avoid the error
        enableAutoWrapIp: true,
        enableAutoApprove: true
      },
      erc20Options: {
        enableAutoApprove: true
      }
    });

    console.log("License fulfillment transaction successful:", response);
    
    return {
      success: true,
      message: `Royalty payment of ${amount} ${useWipToken ? "WIP" : "MERC20"} tokens completed`,
      txHash: response.txHash || '',
      receipt: response.receipt
    };
  } catch (error) {
    console.error("License fulfillment transaction failed:", error);
    
    // Extract useful error message
    let errorMessage = "Unknown error occurred during royalty payment";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific error cases
      if (errorMessage.includes("RoyaltyModule__ZeroReceiverVault")) {
        errorMessage = "This IP asset cannot receive royalty payments because it doesn't have a royalty vault configured.";
      } else if (errorMessage.includes("Multicall3: call failed")) {
        errorMessage = "Transaction failed. Please ensure you have sufficient token balance and the correct token is approved for spending.";
      } else if (errorMessage.includes("User rejected the request")) {
        errorMessage = "Transaction was rejected in your wallet.";
      } else if (errorMessage.includes("insufficient funds")) {
        errorMessage = `Insufficient ${useWipToken ? 'WIP' : 'MERC20'} token balance. Please check your wallet balance.`;
      } else if (errorMessage.includes("allowance")) {
        errorMessage = "Token approval failed. Please try again or approve the token manually in your wallet.";
      }
    }
    
    return {
      success: false,
      message: "Failed to fulfill license terms",
      error: errorMessage
    };
  }
};