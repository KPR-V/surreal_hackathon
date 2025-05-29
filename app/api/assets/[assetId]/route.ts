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
    console.log(`Making API call to: ${API_BASE_URL}/assets/${assetId}`);
    
    const options = {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        'X-Chain': CHAIN
      }
    };

    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, options);
    
    console.log(`Asset details response status: ${response.status}`);
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `HTTP error! status: ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await response.json();
    console.log('Asset details response:', data);
    
    return new Response(JSON.stringify(data.data || {}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching IP asset details:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch asset details' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
