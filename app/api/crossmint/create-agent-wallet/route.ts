import { NextRequest, NextResponse } from "next/server";
import * as dotenv from "dotenv";
dotenv.config();

const CROSSMINT_API_URL =
  process.env.CROSSMINT_API_URL ||
  "https://staging.crossmint.com/api/2022-06-09";
const CROSSMINT_API_KEY = process.env.CROSSMINT_SERVER_API_KEY;

export async function POST(request: NextRequest) {
  if (!CROSSMINT_API_KEY) {
    console.error("Crossmint API Key not configured");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  let smartWalletAddress: string | null = null;

  try {
    const { adminAddress, agentAddress, permissions } = await request.json();
    if (!adminAddress || !/^0x[a-fA-F0-9]{40}$/.test(adminAddress)) {
      return NextResponse.json(
        { error: "Missing or invalid adminAddress" },
        { status: 400 }
      );
    }
    if (!agentAddress || !/^0x[a-fA-F0-9]{40}$/.test(agentAddress)) {
      return NextResponse.json(
        { error: "Missing or invalid agentAddress" },
        { status: 400 }
      );
    }

    const headers = {
      "X-API-KEY": CROSSMINT_API_KEY,
      "Content-Type": "application/json",
    };
    const walletIdempotencyKey = `smart_wallet_${adminAddress.toLowerCase()}`;
    const createWalletResp = await fetch(
      `${CROSSMINT_API_URL}/wallets`,
      {
        method: "POST",
        headers: {
          ...headers,
          "x-idempotency-key": walletIdempotencyKey,
        },
        body: JSON.stringify({
          type: "evm-smart-wallet",
          config: {
            adminSigner: {
              type: "evm-keypair",
              address: adminAddress,
            },
          },
        }),
      }
    );

    const createWalletText = await createWalletResp.text();
    if (!createWalletResp.ok) {
      console.error(
        `[Combined Route] create-wallet error (${createWalletResp.status}):`,
        createWalletText
      );
      const msg =
        JSON.parse(createWalletText).message ||
        "Failed to create/fetch smart wallet.";
      throw new Error(msg);
    }

    const walletData = JSON.parse(createWalletText);
    smartWalletAddress = walletData.address;
    console.log("Smart wallet:", smartWalletAddress);


    const walletInfoResp = await fetch(
      `${CROSSMINT_API_URL}/wallets/${smartWalletAddress}`,
      {
        method: "GET",
        headers,
      }
    );
    if (!walletInfoResp.ok) {
      console.warn(
        `[Combined Route] Could not fetch wallet info (${walletInfoResp.status}) – proceeding to add signer.`
      );
    } else {
      const walletInfo = await walletInfoResp.json();
      console.log("🚀 ----------------------------------------🚀");
      console.log("🚀 ~ walletInfo:", walletInfo);
      console.log("🚀 ----------------------------------------🚀");

      // Check if agent already exists in delegatedSigners
      const alreadyHasAgent = Array.isArray(walletInfo.config?.delegatedSigners) &&
        walletInfo.config.delegatedSigners.some(
          (signer: any) =>
            signer.type === "evm-keypair" &&
            signer.address.toLowerCase() === agentAddress.toLowerCase()
        );

      if (alreadyHasAgent) {
        return NextResponse.json({
          success: true,
          message: "Agent is already a signer on this wallet.",
          smartWalletAddress,
          agentAddress,
          walletInfo,
          isExistingSigner: true,
        });
      }
    }


    const chain = "story-testnet";
    const addSignerResp = await fetch(
      `${CROSSMINT_API_URL}/wallets/${smartWalletAddress}/signers`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          signer: `evm-keypair:${agentAddress}`,
          chain,
          permissions,
        }),
      }
    );

    const addSignerText = await addSignerResp.text();
    if (!addSignerResp.ok) {
      console.error(
        `[Combined Route] add-signer error (${addSignerResp.status}):`,
        addSignerText
      );
      let errMsg = "Failed to initiate add agent signer.";
      try {
        errMsg = JSON.parse(addSignerText).message || errMsg;
      } catch {}
      if (addSignerResp.status === 409) {
        errMsg = `Signer ${agentAddress} might already exist or be pending.`;
      }
      throw new Error(errMsg);
    }

    const signerData = JSON.parse(addSignerText);
    const chainApprovalData = signerData?.chains?.[chain];
    const pendingApproval = chainApprovalData?.approvals?.pending?.[0];
    const signatureId = chainApprovalData?.id;
    const challengeMessage = pendingApproval?.message;

    if (!challengeMessage || !signatureId) {
      console.error(
        "[Combined Route] Could not extract challenge message or signature ID from Crossmint response:",
        signerData
      );
      throw new Error(
        "Failed to get challenge details from Crossmint after adding signer."
      );
    }
    return NextResponse.json({
      success: true,
      smartWalletAddress: smartWalletAddress,
      agentAddress: agentAddress,
      signatureRequired: {
        signatureId: signatureId,
        message: challengeMessage,
        adminSignerLocator: `evm-keypair:${adminAddress}`,
      },
    });
  } catch (error: any) {
    console.error("[Combined Route] Error:", error);
    const errorPayload: { error: string; smartWalletAddress?: string | null } =
      {
        error: error.message || "Internal server error.",
      };
    if (smartWalletAddress) {
      errorPayload.smartWalletAddress = smartWalletAddress;
    }
    return NextResponse.json(errorPayload, { status: 500 });
  }
}
