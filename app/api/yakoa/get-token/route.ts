import axios from 'axios';
import dotenv from 'dotenv';
import { NextResponse } from 'next/server';

dotenv.config();

const YAKOA_API_KEY :string = process.env.YAKOA_API_KEY as string;

const options = (network: string, tokenId: string)=>{
  return {
  method: 'GET',
  url: `https://docs-demo.ip-api-sandbox.yakoa.io/${network}/token/${tokenId.toLowerCase()}`,
  headers: {
    accept: 'application/json',
    'X-API-KEY': YAKOA_API_KEY
    }
  }
} 

export async function GET(request: Request) {
  try {
    const { network, tokenId } = await request.json();
    const response = await axios.request(options(network, tokenId));
    return NextResponse.json({
      response: response.data,
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get token" }, { status: 400 });
  }
}