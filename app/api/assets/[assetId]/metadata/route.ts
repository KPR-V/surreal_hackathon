import { NextRequest } from 'next/server';

const API_BASE_URL = 'https://api.storyapis.com/api/v3';
const API_KEY = process.env.STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
const CHAIN = 'story-aeneid';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await context.params;
    console.log(`Making metadata API call to: ${API_BASE_URL}/assets/${assetId}/metadata`);
    
    const options = {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        'X-Chain': CHAIN
      }
    };

    const response = await fetch(`${API_BASE_URL}/assets/${assetId}/metadata`, options);
    
    console.log(`Metadata response status: ${response.status}`);
    
    if (!response.ok) {
      // Don't throw error for metadata - it might not exist for all assets
      console.warn(`Metadata not found for asset ${assetId}: ${response.status}`);
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await response.json();
    console.log('Metadata response:', data);
    
    return new Response(JSON.stringify(data || {}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.warn('Error fetching IP asset metadata (non-critical):', error);
    return new Response(JSON.stringify(null), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
