import axios from 'axios';
import dotenv from 'dotenv';
import { NextResponse } from 'next/server';
dotenv.config()
const YAKOA_API_KEY :string = process.env.YAKOA_API_KEY as string;
const options = (network: string, tokenId: string, brandId: string, brandName: string, data: {type: string, email_address: string})=>{
  return {
  method: 'POST',
  url: `https://docs-demo.ip-api-sandbox.yakoa.io/${network}/token/${tokenId.toLowerCase()}/authorization`,
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'X-API-KEY': YAKOA_API_KEY
  },
  data: {
    data: data,
    brand_name: brandName,
    brand_id: brandId
  }
    }
}

export async function POST(request: Request) {
  try {
    const { network, tokenId, brandId, brandName, data } = await request.json();
    const response = await axios.request(options(network, tokenId, brandId, brandName, data));
    return NextResponse.json({
      response: response.data,
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create update token brand auth" }, { status: 400 });
  }
}