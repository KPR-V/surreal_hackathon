import axios from "axios";
import dotenv from "dotenv";
import { NextResponse } from "next/server";

dotenv.config();

const YAKOA_API_KEY: string = process.env.YAKOA_API_KEY as string;

const options = (
  network: string,
  tokenId: string,
  creatorId: string,
  metadata: { name: string },
  media: {
    media_id: string;
    url: string;
    hash?: string;
    trust_reason?: { type: string; platform_name: string };
  }[],
  registrationTx: {
    hash: string;
    block_number: number;
    timestamp?: string;
  },
  licenseParents?: {
    license_id: string;
    token_id: string;
  }[],
  authorizations?: {
    authorization_id: string;
    token_id: string;
  }[]
) => {
  const registrationTxData = {
    hash: registrationTx.hash.toLowerCase(),// coverted to lower case transaction hash
    block_number: Number(registrationTx.block_number) ,// block number converted to number
    timestamp: registrationTx.timestamp
    ? new Date(Number(registrationTx.timestamp) * 1000).toISOString()
    : new Date().toISOString(),
  };
  const mediaData = media.map(
    (item: {
      media_id: string;
      url: string;
      hash?: string;
      trust_reason?: { type: string; platform_name: string };
    }) => ({
      media_id: item.media_id,
      url: item.url,
      hash: item.hash?.toLowerCase() || "",
      trust_reason: item.trust_reason || { type: "", platform_name: "" },
    })
  );
  return {
    method: "POST",
    url: `https://docs-demo.ip-api-sandbox.yakoa.io/${network}/token`,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-API-KEY": YAKOA_API_KEY,
    },
    data: {
      id: tokenId.toLowerCase(), //tokenid is ipid converted to lowercase
      registration_tx: registrationTxData,
      creator_id: creatorId,
      metadata: metadata,
      media: mediaData,
      license_parents: licenseParents || null,
      authorizations: authorizations || null,
    },
  };
};

export async function POST(request: Request) {
  try {
    const {
      network,
      tokenId,
      creatorId,
      metadata,
      media,
      registrationTx,
      licenseParents,
      authorizations,
    } = await request.json();
    const response = await axios.request(
      options(
        network,
        tokenId,
        creatorId,
        metadata,
        media,
        registrationTx,
        licenseParents,
        authorizations
      )
    );
    return NextResponse.json({
      response: response.data,
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to register token" },
      { status: 400 }
    );
  }
}
