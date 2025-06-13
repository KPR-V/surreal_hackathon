import { NextRequest, NextResponse } from 'next/server';

interface IPAssetRequest {
  tokenContractIds: string[];
  tokenIds: string[];
}

interface IPAssetResponse {
  data: Array<{
    ancestorCount: number;
    blockNumber: string;
    blockTimestamp: string;
    childrenCount: number;
    descendantCount: number;
    id: string;
    ipId: string;
    isGroup: boolean;
    latestArbitrationPolicy: string;
    nftMetadata: {
      chainId: string;
      imageUrl: string;
      name: string;
      tokenContract: string;
      tokenId: string;
      tokenUri: string;
    };
    parentCount: number;
    rootCount: number;
    rootIpIds: string[];
    transactionHash: string;
  }>;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  next: string;
  prev: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: IPAssetRequest = await request.json();
    
    if (!body.tokenContractIds || !body.tokenIds) {
      return NextResponse.json(
        { error: 'Token contract IDs and token IDs are required' },
        { status: 400 }
      );
    }

    const options = {
      method: 'POST',
      headers: {
        'X-Api-Key': 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U',
        'X-Chain': 'story-aeneid',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options: {
          tokenContractIds: body.tokenContractIds,
          tokenIds: body.tokenIds
        }
      })
    };

    const response = await fetch('https://api.storyapis.com/api/v3/assets', options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: IPAssetResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching IP assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch IP assets' },
      { status: 500 }
    );
  }
}