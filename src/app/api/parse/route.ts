import { NextRequest, NextResponse } from 'next/server';
import { parseTranscript } from '@/lib/ai-parser';

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid transcript' }, { status: 400 });
    }

    const result = await parseTranscript(transcript);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/parse:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse' }, { status: 500 });
  }
}
