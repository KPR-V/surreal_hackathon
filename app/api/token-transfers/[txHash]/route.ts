import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { txHash: string } }
) {
  try {
    const { txHash } = params;
    
    if (!txHash) {
      return NextResponse.json({ 
        error: 'Transaction hash is required' 
      }, { status: 400 });
    }

    console.log('Fetching token transfers for transaction:', txHash);

    const response = await fetch(
      `https://aeneid.storyscan.io/api/v2/transactions/${txHash}/token-transfers?type=ERC-20%2CERC-721%2CERC-1155`,
      {
        headers: {
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('StoryScan API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('StoryScan API error details:', errorText);
      
      return NextResponse.json({ 
        error: 'Failed to fetch token transfers',
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Successfully fetched token transfers:', data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}