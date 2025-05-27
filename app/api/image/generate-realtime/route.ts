import { NextRequest, NextResponse } from 'next/server';
import dotenv from "dotenv"
dotenv.config()
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model } = body;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Prepare the request body for ModelsLab Real-Time API
    const realtimePayload = {
      key: process.env.API_KEY, // Using your env variable name
      prompt: prompt,
      negative_prompt: "bad quality, ugly, low contrast, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, disfigured, deformed, body out of frame, bad anatomy, watermark, signature, cut off, low contrast, underexposed, overexposed, bad art, beginner, amateur, distorted face, blurry, draft, grainy",
      width: "512",
      height: "512",
      safety_checker: false,
      seed: null,
      samples: 1,
      base64: false, // Get URL response for easier handling
      webhook: null,
      track_id: null,
      instant_response: false,
      enhance_prompt: true,
      enhance_style: null
    };

    // Call ModelsLab Real-Time API
    const response = await fetch('https://modelslab.com/api/v6/realtime/text2img', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(realtimePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ModelsLab Real-Time API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Check if the response is successful
    if (result.status !== 'success' || !result.output || result.output.length === 0) {
      throw new Error('ModelsLab Real-Time API returned unsuccessful response');
    }

    // Try to fetch from output first, then proxy_links as fallback
    let imageUrl = result.output[0];
    let imageResponse = await fetch(imageUrl);
    
    // If primary URL fails, try proxy links
    if (!imageResponse.ok && result.proxy_links && result.proxy_links.length > 0) {
      console.log('Primary URL failed, trying proxy link...');
      imageUrl = result.proxy_links[0];
      imageResponse = await fetch(imageUrl);
    }

    if (!imageResponse.ok) {
      throw new Error('Failed to fetch generated image from both primary and proxy URLs');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Job-Offer-Id': result.id?.toString() || 'unknown',
        'Generation-Time': result.generationTime?.toString() || 'unknown',
      },
    });

  } catch (error) {
    console.error('❌ ModelsLab Real-Time API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        requestId: `realtime_req_${Date.now().toString(36)}`
      },
      { status: 500 }
    );
  }
}
