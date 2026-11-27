import { NextRequest, NextResponse } from 'next/server';

/**
 * Optional server-side speech-to-text proxy.
 * Checks for WISPR_API_KEY or GROQ_API_KEY.
 * If not set, returns a helpful message explaining that client-side
 * Web Speech API is being used automatically.
 */
export async function POST(req: NextRequest) {
  try {
    const wisprKey = process.env.WISPR_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!wisprKey && !groqKey) {
      return NextResponse.json({
        available: false,
        message: 'No external STT key configured. RozHisaab seamlessly uses built-in browser Web Speech API (hi-IN / en-IN) with zero latency.'
      });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    if (!audioFile) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    // If Groq key is available
    if (groqKey) {
      const groqFormData = new FormData();
      groqFormData.append('file', audioFile);
      groqFormData.append('model', 'whisper-large-v3-turbo');
      groqFormData.append('language', 'hi');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`
        },
        body: groqFormData
      });

      if (!response.ok) {
        throw new Error(`Groq Whisper error: ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json({
        success: true,
        transcript: data.text,
        provider: 'groq'
      });
    }

    return NextResponse.json({
      available: false,
      message: 'Using browser Web Speech API.'
    });
  } catch (error: any) {
    console.error('Error in /api/transcribe:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
