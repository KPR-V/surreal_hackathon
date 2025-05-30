import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.storyapis.com/api/v3';
const API_KEY = process.env.STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
const CHAIN = 'story-aeneid';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await context.params;

    const response = await fetch(`${API_BASE_URL}/licenses/tokens/${tokenId}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        'X-Chain': CHAIN
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `HTTP error! status: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('License token details API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}