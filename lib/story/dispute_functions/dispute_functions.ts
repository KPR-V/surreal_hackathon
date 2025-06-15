import { DisputeTargetTag, StoryClient } from "@story-protocol/core-sdk";
import { parseEther } from "viem";

export const raiseDispute = async (
  targetIpId: string,
  evidence_cid: string,
  targetTag: string,
  bond: string,
  client: StoryClient
) => {
  try{
  const validTags: string[] = [
    "IMPROPER_REGISTRATION",
    "IMPROPER_USAGE",
    "IMPROPER_PAYMENT",
    "CONTENT_STANDARDS_VIOLATION",
    "IN_DISPUTE",
  ];

  // Fixed 30 days in seconds (30 * 24 * 60 * 60 = 2,592,000 seconds)
  const THIRTY_DAYS_SECONDS = 2592000;

  if (!validTags.includes(targetTag)) {
    throw new Error(
      `Invalid dispute tag: ${targetTag}. Must be one of: ${validTags.join(
        ", "
      )}`
    );
  }

     console.log('Raising dispute with parameters:', {
      targetIpId,
      evidence_cid,
      targetTag,
      bond,
      liveness_seconds: THIRTY_DAYS_SECONDS,
      bondInWei: parseEther(bond).toString()
    });


  const disputeResponse = await client.dispute.raiseDispute({
    targetIpId: targetIpId.startsWith("0x") ? targetIpId as `0x${string}` : `0x${targetIpId}` as `0x${string}`,
    cid: evidence_cid,
    targetTag: targetTag as DisputeTargetTag,
    bond: parseEther(bond),
    liveness: BigInt(THIRTY_DAYS_SECONDS),
    txOptions: { confirmations: 5 ,retryCount: 3 , pollingInterval: 1000 },
  });
  return {
    txHash: disputeResponse.txHash,
    disputeId: disputeResponse.disputeId,
  };
  } catch (error) {
    console.error("Dispute failed:", error instanceof Error ? error.message : String(error));
    throw error; // Re-throw the error so it can be handled by the calling function
  }
};

export const cancelDispute = async (disputeId: number, client: StoryClient) => {
  try {
    console.log('Cancelling dispute with ID:', disputeId);
    
    const response = await client.dispute.cancelDispute({
      disputeId: disputeId,
      data: "0x", // Add explicit empty data parameter
      txOptions: { 
        confirmations: 5,
        retryCount: 3,
        pollingInterval: 1000 
      },
    });
    
    console.log('Cancel dispute response:', response);
    
    return {
      txHash: response.txHash,
    };
  } catch (error) {
    console.error("Cancel dispute failed:", error);
    throw error; // Re-throw the error so it can be handled by the calling function
  }
};

export const resolveDispute = async (disputeId: number, client: StoryClient) => {
  try {
    console.log('Resolving dispute with ID:', disputeId);
    
    const response = await client.dispute.resolveDispute({
      disputeId: disputeId,
      data: "0x", // Add explicit empty data parameter  
      txOptions: { 
        confirmations: 5,
        retryCount: 3,
        pollingInterval: 1000 
      },
    });
    
    console.log('Resolve dispute response:', response);
    
    return {
      txHash: response.txHash,
    };
  } catch (error) {
    console.error("Resolve dispute failed:", error);
    throw error; // Re-throw the error so it can be handled by the calling function
  }
};

export const disputeAssertion = async (
  ipId: string,
  disputeId: number,
  counterEvidenceCID: string,
  client: StoryClient
) => {
  try{
  const assertionId = await client.dispute.disputeIdToAssertionId(disputeId);

  const result = await client.dispute.disputeAssertion({
    ipId: ipId.startsWith("0x") ? ipId as `0x${string}` : `0x${ipId}` as `0x${string}`,
    assertionId: assertionId,
    counterEvidenceCID: counterEvidenceCID,
    txOptions: { confirmations: 5 ,retryCount: 3 , pollingInterval: 1000 },
  });
  return {
    txHash: result.txHash,
  };
  } catch (error) {
    console.error("Dispute failed:", error instanceof Error ? error.message : String(error));
    throw error; // Re-throw the error so it can be handled by the calling function
  }
};