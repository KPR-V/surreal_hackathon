import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://api.storyapis.com/api/v3'
const API_KEY      = process.env.STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U'
const CHAIN        = 'story-aeneid'

export async function POST(request: NextRequest) {
  const { ipIds } = await request.json()

  const res = await fetch(
    `${API_BASE_URL}/detailed-ip-license-terms`,
    {
      method: 'POST',
      headers: {
        'X-Api-Key':       API_KEY,
        'X-Chain':         CHAIN,
        'Content-Type':    'application/json'
      },
      body: JSON.stringify({
        options: { where: { ipIds } }
      })
    }
  )

  if (res.status === 404) {
    return NextResponse.json({ data: [] })
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: await res.text() },
      { status: res.status }
    )
  }

  const data = await res.json()
  return NextResponse.json({ data: data.data || [] })
}
