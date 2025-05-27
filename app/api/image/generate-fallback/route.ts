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

    // Prepare the request body for ModelsLab API
    const modelsLabPayload = {
      key: process.env.API_KEY,
      model_id: model || "flux", // Use the selected model or default to flux
      prompt: prompt,
      width: "512",
      height: "512", 
      samples: "1",
      num_inference_steps: "20",
      safety_checker: "no",
      enhance_prompt: "yes",
      seed: null,
      guidance_scale: 7.5,
      base64: "no", // Get URL response for easier handling
      webhook: null,
      track_id: null
    };

    // Call ModelsLab API
    const response = await fetch('https://modelslab.com/api/v6/images/text2img', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelsLabPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ModelsLab API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Check if the response is successful
    if (result.status !== 'success' || !result.output || result.output.length === 0) {
      throw new Error('ModelsLab API returned unsuccessful response');
    }

    // Fetch the generated image from the URL
    const imageResponse = await fetch(result.output[0]);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch generated image');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Job-Offer-Id': result.id?.toString() || 'unknown',
      },
    });

  } catch (error) {
    console.error('❌ ModelsLab Fallback API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        requestId: `req_${Date.now().toString(36)}`
      },
      { status: 500 }
    );
  }
}
