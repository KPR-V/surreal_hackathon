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

    // Prepare the request body for ModelsLab Video API
    const videoPayload = {
      key: process.env.API_KEY,
      model_id: model || "cogvideox", // Default to cogvideox if no model specified
      prompt: prompt,
      negative_prompt: "low quality, bad anatomy, blurry, pixelated, distorted, deformed, watermark, signature, text, logo, worst quality",
      height: 512,
      width: 512,
      num_frames: 16, // Default frames for faster generation
      num_inference_steps: 20,
      guidance_scale: 7,
      seed: null,
      clip_skip: null,
      upscale_height: 640,
      upscale_width: 640,
      upscale_strength: 0.6,
      upscale_guidance_scale: 8,
      upscale_num_inference_steps: 20,
      use_improved_sampling: false,
      improved_sampling_seed: null,
      fps: 8,
      output_type: "mp4", // MP4 for better compatibility
      instant_response: false,
      temp: false,
      webhook: null,
      track_id: null
    };

    // Call ModelsLab Video API
    const response = await fetch('https://modelslab.com/api/v6/video/text2video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ModelsLab Video API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Check if the response is successful
    if (result.status !== 'success' || !result.output || result.output.length === 0) {
      throw new Error('ModelsLab Video API returned unsuccessful response');
    }

    // Try to fetch from output first, then proxy_links as fallback
    let videoUrl = result.output[0];
    let videoResponse = await fetch(videoUrl);
    
    // If primary URL fails, try proxy links
    if (!videoResponse.ok && result.proxy_links && result.proxy_links.length > 0) {
      console.log('Primary video URL failed, trying proxy link...');
      videoUrl = result.proxy_links[0];
      videoResponse = await fetch(videoUrl);
    }

    if (!videoResponse.ok) {
      throw new Error('Failed to fetch generated video from both primary and proxy URLs');
    }
    
    const videoBuffer = await videoResponse.arrayBuffer();
    
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Job-Offer-Id': result.id?.toString() || 'unknown',
        'Generation-Time': result.generationTime?.toString() || 'unknown',
        'Video-Frames': result.meta?.num_frames?.toString() || 'unknown',
        'Video-FPS': result.meta?.fps?.toString() || 'unknown',
      },
    });

  } catch (error) {
    console.error('❌ ModelsLab Video API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        requestId: `video_req_${Date.now().toString(36)}`
      },
      { status: 500 }
    );
  }
}
