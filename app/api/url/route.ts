import { type NextRequest, NextResponse } from "next/server";
import { pinata } from "../../../lib/story/main_functions/uploadtoipfs"; 

export const dynamic = "force-dynamic";

export async function GET() {
  
  try {
    const url = await pinata.upload.public.createSignedURL({
      expires: 30, 
    })
    return NextResponse.json({ url: url }, { status: 200 }); 
  } catch (error) {
    console.log(error);
    return NextResponse.json({ text: "Error creating signed URL:" }, { status: 500 });
  }
}