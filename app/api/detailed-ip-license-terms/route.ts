import { NextRequest, NextResponse } from 'next/server';

const STORY_API_KEY = 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
const STORY_CHAIN = 'story-aeneid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ipIds } = body;

    if (!ipIds || !Array.isArray(ipIds) || ipIds.length === 0) {
      return NextResponse.json({ 
        error: 'ipIds array is required and must not be empty' 
      }, { status: 400 });
    }

    console.log('Fetching detailed IP license terms for:', ipIds);

    const response = await fetch('https://api.storyapis.com/api/v3/detailed-ip-license-terms', {
      method: 'POST',
      headers: {
        'X-Api-Key': STORY_API_KEY,
        'X-Chain': STORY_CHAIN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options: {
          where: {
            ipIds: ipIds
          }
        }
      })
    });

    if (!response.ok) {
      console.error('Story API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Story API error details:', errorText);
      
      return NextResponse.json({ 
        error: 'Failed to fetch IP license terms',
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Successfully fetched IP license terms:', data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
