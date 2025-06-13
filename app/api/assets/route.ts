import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.storyapis.com/api/v3';
const API_KEY = process.env.STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
const CHAIN = 'story-aeneid';

export async function POST(request: NextRequest) {
  try {
    const { options } = await request.json();

    // Set default pagination to 12 items (3 rows × 4 cards)
    const pagination = {
      limit: 12,
      ...options.pagination
    };

    const requestBody = {
      options: {
        pagination,
        orderBy: "blockNumber",
        orderDirection: "desc",
        ...options
      }
    };

    // console.log('Assets API request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: {
        'X-Api-Key': API_KEY,
        'X-Chain': CHAIN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Assets API error:', response.status, errorText);
      return NextResponse.json(
        { error: `HTTP error! status: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    // console.log('Assets API response structure:', {
    //   hasData: !!data.data,
    //   dataLength: data.data?.length || 0,
    //   hasNext: !!data.next,
    //   hasPrevious: !!data.previous,
    //   next: data.next,
    //   previous: data.previous
    // });

    // Return structured response with pagination info
    return NextResponse.json({
      data: data.data || [],
      hasNext: !!data.next,
      hasPrevious: !!data.previous,
      next: data.next,
      previous: data.previous,
      total: data.total,
      currentCursor: options.pagination?.after || options.pagination?.before || null
    });
  } catch (error) {
    console.error('Assets API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}