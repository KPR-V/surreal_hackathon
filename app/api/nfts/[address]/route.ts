import { NextRequest, NextResponse } from 'next/server';

interface NFTItem {
  animation_url: string | null;
  external_app_url: string | null;
  id: string;
  image_url: string | null;
  is_unique: boolean | null;
  media_type: string | null;
  media_url: string | null;
  metadata: any;
  owner: string | null;
  thumbnails: any;
  token: {
    address: string;
    address_hash: string;
    circulating_market_cap: string | null;
    decimals: string | null;
    exchange_rate: string | null;
    holders: string;
    holders_count: string;
    icon_url: string | null;
    name: string;
    symbol: string;
    total_supply: string;
    type: string;
    volume_24h: string | null;
  };
  token_type: string;
  value: string;
}

interface NFTResponse {
  items: NFTItem[];
  next_page_params: any;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await context.params;
    
    // Validate address format
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const url = `https://aeneid.storyscan.io/api/v2/addresses/${address}/nft?type=ERC-721%2CERC-404%2CERC-1155`;
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 400) {
        return NextResponse.json(
          { error: 'Bad request parameters' },
          { status: 400 }
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: NFTResponse = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}