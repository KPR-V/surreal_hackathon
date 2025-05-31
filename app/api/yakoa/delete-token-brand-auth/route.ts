import axios from 'axios';
import dotenv from 'dotenv';
import { NextResponse } from 'next/server';
dotenv.config()
const YAKOA_API_KEY :string = process.env.YAKOA_API_KEY as string;
const options = (network: string, tokenId: string, brandId: string)=>{
  return {
  method: 'DELETE',
  url: `https://docs-demo.ip-api-sandbox.yakoa.io/${network}/token/${tokenId.toLowerCase()}/authorization/${brandId}`,
  headers: {
    accept: 'application/json',
    'X-API-KEY': YAKOA_API_KEY
  }
}
}

export async function POST(request: Request) {
  try {
    const { network, tokenId, brandId } = await request.json();
    const response = await axios.request(options(network, tokenId, brandId));
    return NextResponse.json({
      response: response.data,
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete token brand auth" }, { status: 400 });
  }
}