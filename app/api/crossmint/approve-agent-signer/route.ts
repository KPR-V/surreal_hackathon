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

  try {
    const { smartWalletAddress, signatureId, adminSignerLocator, signature } =
      await request.json();
    if (
      !smartWalletAddress ||
      !/^0x[a-fA-F0-9]{40}$/.test(smartWalletAddress)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid smartWalletAddress" },
        { status: 400 }
      );
    }
    if (!signatureId) {
      return NextResponse.json(
        { error: "Missing signatureId (from initiate step)" },
        { status: 400 }
      );
    }
    if (!adminSignerLocator || !adminSignerLocator.startsWith("evm-keypair:")) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid adminSignerLocator (e.g., evm-keypair:0x...)",
        },
        { status: 400 }
      );
    }
    if (!signature || !/^0x[0-9a-fA-F]+$/.test(signature)) {
      return NextResponse.json(
        { error: "Missing or invalid signature" },
        { status: 400 }
      );
    }
    const approvalUrl = `${CROSSMINT_API_URL}/wallets/${smartWalletAddress}/signatures/${signatureId}/approvals`;
    console.log(`Submitting approval signature to: ${approvalUrl}`);
    console.log(
      `Admin Signer: ${adminSignerLocator}, Signature: ${signature.substring(
        0,
        10
      )}...`
    );

    const response = await fetch(approvalUrl, {
      method: "POST",
      headers: {
        "X-API-KEY": CROSSMINT_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        approvals: [
          {
            signer: adminSignerLocator,
            signature: signature,
          },
        ],
      }),
    });

    const responseBody = await response.text();

    if (!response.ok) {
      console.error(
        `Crossmint API error (${response.status}) approving signer:`,
        responseBody
      );
      let errorMessage = "Failed to approve agent signer.";
      try {
        const errorJson = JSON.parse(responseBody);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {}
      console.log("🚀 --------------------------------------------🚀");
      console.log("🚀 ~ :91 ~ POST ~ errorMessage:", errorMessage);
      console.log("🚀 --------------------------------------------🚀");
    }

    const approvalData = JSON.parse(responseBody);
    console.log("Agent signer approval successful:", approvalData);
    return NextResponse.json({
      success: true,
      message: "Agent signer approved successfully.",
    });
  } catch (error: any) {
    console.error("Error in /api/crossmint/approve-agent-signer:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error approving signer." },
      { status: 500 }
    );
  }
}
