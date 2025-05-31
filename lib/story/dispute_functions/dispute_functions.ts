import { StoryClient } from "@story-protocol/core-sdk";
import { parseEther } from "viem";

export const raiseDispute = async (
  targetIpId: string,
  evidence_cid: string,
  targetTag: string,
  bond: string,
  liveness_seconds: number,
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

  if (!validTags.includes(targetTag)) {
    throw new Error(
      `Invalid dispute tag: ${targetTag}. Must be one of: ${validTags.join(
        ", "
      )}`
    );
  }

  const disputeResponse = await client.dispute.raiseDispute({
    targetIpId: targetIpId.startsWith("0x") ? targetIpId as `0x${string}` : `0x${targetIpId}` as `0x${string}`,
    cid: evidence_cid,
    targetTag: targetTag,
    bond: parseEther(bond),
    liveness: liveness_seconds,
    txOptions: { waitForTransaction: true },
  });
  return {
    txHash: disputeResponse.txHash,
    disputeId: disputeResponse.disputeId,
  };
  } catch (error) {
    console.error("Dispute failed:", error instanceof Error ? error.message : String(error));
  }
};

export const cancelDispute = async (disputeId: number,client: StoryClient) => {
  try{
  const response = await client.dispute.cancelDispute({
    disputeId: disputeId,
    txOptions: { waitForTransaction: true },
  });
  return {
    txHash: response.txHash,
  };
  } catch (error) {
    console.error("Dispute failed:", error instanceof Error ? error.message : String(error));
  }
};

export const resolveDispute = async (disputeId: number,client: StoryClient) => {
  try{
  const response = await client.dispute.resolveDispute({
    disputeId: disputeId,
    txOptions: { waitForTransaction: true },
  });
  return {
    txHash: response.txHash,
  };
  } catch (error) {
    console.error("Dispute failed:", error instanceof Error ? error.message : String(error));
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
    txOptions: { waitForTransaction: true },
  });
  return {
    txHash: result.txHash,
  };
  } catch (error) {
    console.error("Dispute failed:", error instanceof Error ? error.message : String(error));
  }
};