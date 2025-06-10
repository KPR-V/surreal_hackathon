import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Pinata (or your preferred IPFS service)
    const pinataFormData = new FormData();
    pinataFormData.append('file', new Blob([buffer]), file.name);

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataFormData,
    });

    if (!pinataResponse.ok) {
      throw new Error('Failed to upload to Pinata');
    }

    const pinataData = await pinataResponse.json();

    return NextResponse.json({ 
      cid: pinataData.IpfsHash,
      url: `https://ipfs.io/ipfs/${pinataData.IpfsHash}`
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file to IPFS' },
      { status: 500 }
    );
  }
}