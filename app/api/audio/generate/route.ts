import { NextRequest, NextResponse } from 'next/server';
import dotenv from "dotenv"
dotenv.config()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, init_audio, sampling_rate, max_new_token } = body;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Prepare the request body for ModelsLab Music Gen API
    const musicPayload = {
      key: process.env.API_KEY,
      prompt: prompt,
      init_audio: init_audio || null,
      sampling_rate: sampling_rate || 32000,
      max_new_token: max_new_token || 256,
      base64: false,
      temp: false,
      webhook: null,
      track_id: null
    };

    // Call ModelsLab Music Gen API
    const response = await fetch('https://modelslab.com/api/v6/voice/music_gen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(musicPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MusicGen API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Check if the response is successful
    if (result.status !== 'success' || !result.output || result.output.length === 0) {
      throw new Error('MusicGen API returned unsuccessful response');
    }

    // Try to fetch from output first, then proxy_links as fallback
    let audioUrl = result.output[0];
    let audioResponse = await fetch(audioUrl);
    
    // If primary URL fails, try proxy links
    if (!audioResponse.ok && result.proxy_links && result.proxy_links.length > 0) {
      console.log('Primary audio URL failed, trying proxy link...');
      audioUrl = result.proxy_links[0];
      audioResponse = await fetch(audioUrl);
    }

    if (!audioResponse.ok) {
      throw new Error('Failed to fetch generated audio from both primary and proxy URLs');
    }
    
    const audioBuffer = await audioResponse.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Job-Offer-Id': result.id?.toString() || 'unknown',
        'Generation-Time': result.generationTime?.toString() || 'unknown',
        'Sampling-Rate': result.meta?.sampling_rate?.toString() || 'unknown',
        'Max-Tokens': result.meta?.max_new_token?.toString() || 'unknown',
      },
    });

  } catch (error) {
    console.error('❌ MusicGen API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        requestId: `musicgen_req_${Date.now().toString(36)}`
      },
      { status: 500 }
    );
  }
}
