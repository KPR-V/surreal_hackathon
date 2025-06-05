import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.storyapis.com/api/v3';
const API_KEY = process.env.STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
const CHAIN = 'story-aeneid';

export async function GET(request: NextRequest) {
  try {
    console.log('=== LICENSE TOKENS API ROUTE ===');
    const { searchParams } = new URL(request.url);
    
    // Extract filters
    const owner = searchParams.get('owner');
    const licensorIpId = searchParams.get('licensorIpId');
    const licenseTermsId = searchParams.get('licenseTermsId');
    
    // Extract pagination
    const limit = searchParams.get('limit') || '20';
    const after = searchParams.get('after');
    const before = searchParams.get('before');

    console.log('API Route: Received parameters:', {
      owner,
      licensorIpId,
      licenseTermsId,
      limit,
      after,
      before
    });

    // Build Story Protocol API URL
    const storyParams = new URLSearchParams();
    
    // Always add chain
    storyParams.append('chainId', CHAIN);
    
    // Add filters to Story API call
    if (owner) {
      storyParams.append('owner', owner);
    }
    if (licensorIpId) {
      storyParams.append('licensorIpId', licensorIpId);
    }
    if (licenseTermsId) {
      storyParams.append('licenseTermsId', licenseTermsId);
    }

    // Add pagination
    storyParams.append('limit', limit);
    if (after) {
      storyParams.append('after', after);
    }
    if (before) {
      storyParams.append('before', before);
    }

    const storyUrl = `${API_BASE_URL}/licenses/tokens?${storyParams.toString()}`;
    console.log('API Route: Calling Story API:', storyUrl);

    const response = await fetch(storyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    });

    console.log('API Route: Story API response status:', response.status);

    if (!response.ok) {
      console.error('API Route: Story API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('API Route: Story API error body:', errorText);
      
      // Return empty data structure instead of error for 404s
      if (response.status === 404) {
        console.log('API Route: No license tokens found, returning empty data');
        return NextResponse.json({
          data: [],
          hasNext: false,
          hasPrevious: false,
          next: null,
          previous: null,
          total: 0,
          metadata: {
            requestedOwner: owner,
            originalCount: 0,
            filteredCount: 0,
            note: 'No license tokens found for this user'
          }
        });
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch license tokens from Story Protocol',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('API Route: Story API response:', {
      dataLength: data.data?.length || 0,
      hasNext: data.hasNext,
      hasPrevious: data.hasPrevious,
      pagination: {
        next: data.next,
        previous: data.previous
      }
    });

    // Handle case where data is null or undefined
    let responseData = data.data || [];
    
    // Filter by owner on the client side if Story API doesn't support it properly
    let filteredData = responseData;
    if (owner && Array.isArray(filteredData) && filteredData.length > 0) {
      console.log('API Route: Client-side filtering by owner:', owner);
      console.log('API Route: Before filtering:', filteredData.length, 'tokens');
      
      filteredData = filteredData.filter((token: any) => {
        const tokenOwner = token.owner?.toLowerCase();
        const targetOwner = owner.toLowerCase();
        const matches = tokenOwner === targetOwner;
        
        if (!matches) {
          console.log('API Route: Token filtered out:', {
            tokenId: token.id,
            tokenOwner,
            targetOwner
          });
        }
        
        return matches;
      });
      
      console.log('API Route: After filtering:', filteredData.length, 'tokens');
    }

    const result = {
      data: filteredData,
      hasNext: data.hasNext || false,
      hasPrevious: data.hasPrevious || false,
      next: data.next,
      previous: data.previous,
      total: filteredData.length,
      metadata: {
        requestedOwner: owner,
        originalCount: responseData.length,
        filteredCount: filteredData.length,
        storyApiStatus: response.status
      }
    };

    console.log('API Route: Returning result:', {
      dataLength: result.data.length,
      hasNext: result.hasNext,
      metadata: result.metadata
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Route: Error in license tokens API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== LICENSE TOKENS POST API ROUTE ===');
    const body = await request.json();
    console.log('POST body:', body);

    // Handle POST requests for license token operations
    return NextResponse.json({ 
      message: 'License tokens POST endpoint',
      received: body 
    });

  } catch (error) {
    console.error('API Route: Error in POST license tokens API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}