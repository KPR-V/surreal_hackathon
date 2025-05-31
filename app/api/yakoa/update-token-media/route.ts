import axios from 'axios';
import dotenv from 'dotenv';
import { NextResponse } from 'next/server';
dotenv.config()
const YAKOA_API_KEY :string = process.env.YAKOA_API_KEY as string;
const options = (network: string, tokenId: string, mediaId: string, trustReason: {type: string, platform_name: string})=>{
  return {
  method: 'PATCH',
  url: `https://docs-demo.ip-api-sandbox.yakoa.io/${network}/token/${tokenId.toLowerCase()}/media/${mediaId.toLowerCase()}`,
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'X-API-KEY': YAKOA_API_KEY
  },
  data: {trust_reason: trustReason}
}
}

export async function POST(request: Request) {
  try {
    const { network, tokenId, mediaId, trustReason } = await request.json();
    const response = await axios.request(options(network, tokenId, mediaId, trustReason));
    return NextResponse.json({
      response: response.data,
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update token media" }, { status: 400 });
  }
}