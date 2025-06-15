import axios from "axios";
import dotenv from "dotenv";
import { NextResponse } from "next/server";

dotenv.config();

const YAKOA_API_KEY: string = process.env.YAKOA_API_KEY as string;

const options = (
  network: string,
  id: string,                    
  creator_id: string,            
  metadata: { name: string },
  media: {
    media_id: string;
    url: string;
    hash?: string; 
    trust_reason?: { type: string; platform_name: string };
  }[],
  registration_tx: {             
    hash: string;
    block_number: number;
    timestamp?: string;
  },
  license_parents?: { license_id: string; token_id: string }[], 
  authorizations?: { authorization_id: string; token_id: string }[]
) => {
  const registrationTxData = {
    hash: registration_tx.hash.toLowerCase(),
    block_number: Number(registration_tx.block_number),
    timestamp: registration_tx.timestamp
    ? (() => {
        if (typeof registration_tx.timestamp === 'string' && registration_tx.timestamp.includes('T')) {
          return registration_tx.timestamp; 
        }
        return new Date(Number(registration_tx.timestamp) * 1000).toISOString();
      })()
    : new Date().toISOString(),
  };

  const mediaData = media.map((item) => {
    if (!item.hash || item.hash.trim() === "") {
      throw new Error(
        `Invalid payload: Media item with id '${item.media_id}' is missing a required hash.`
      );
    }
    return {
      media_id: item.media_id,
      url: item.url,
      hash: item.hash.toLowerCase(), 
      trust_reason: item.trust_reason || { type: "", platform_name: "" },
    };
  });

  return {
    method: "POST",
    url: `https://docs-demo.ip-api-sandbox.yakoa.io/${network}/token`,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-API-KEY": YAKOA_API_KEY,
    },
    data: {
      id: id.toLowerCase(),                        
      registration_tx: registrationTxData,         
      creator_id: creator_id.toLowerCase(),                      
      metadata: metadata,
      media: mediaData,
      license_parents: license_parents || null,    
      authorizations: authorizations || null,
    },
  };
};

export async function POST(request: Request) {
  try {
    const {
      network,
      id,              
      creator_id,      
      metadata,
      media,
      registration_tx, 
      license_parents, 
      authorizations,
    } = await request.json();

    const requestOptions = options(
      network,
      id,              
      creator_id,      
      metadata,
      media,
      registration_tx, 
      license_parents, 
      authorizations
    );

    const response = await axios.request(requestOptions);
    
    return NextResponse.json({
      response: response.data,
      status: response.status,
    });
  } catch (error: any) {
    if (error.message.includes("missing a required hash")) {
      return NextResponse.json(
        {
          error: "Invalid Request Payload",
          details: error.message,
        },
        { status: 400 }
      );
    }

    console.error("Yakoa API error:", error.response?.data || error.message);
    return NextResponse.json(
      {
        error: "Failed to register token",
        details: error.response?.data?.details || error.response?.data || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
