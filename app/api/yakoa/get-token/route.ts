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

// Change this from GET to POST to match your client request
export async function POST(request: Request) {
  try {
    const { network, tokenId } = await request.json();
    console.log(`Yakoa API request: network=${network}, tokenId=${tokenId}`);
    
    const response = await axios.request(options(network, tokenId));
    console.log(`Yakoa API success: status=${response.status}`);
    
    return NextResponse.json({
      response: response.data,
      status: response.status,
    });
  } catch (error) {
    console.error('Yakoa API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to get token" 
    }, { status: 400 });
  }
}