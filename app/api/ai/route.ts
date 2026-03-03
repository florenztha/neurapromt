import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];

async function tryGroq(messages: any[], model: string, keyIndex: number, jsonMode: boolean = false): Promise<any> {
  if (keyIndex >= GROQ_KEYS.length) {
    throw new Error('All Groq API keys failed or rate limited.');
  }

  const groq = new Groq({ apiKey: GROQ_KEYS[keyIndex] });

  try {
    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.5,
      max_tokens: 1024,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
    });

    return completion;
  } catch (error: any) {
    console.error(`Error with Groq key ${keyIndex + 1}:`, error);
    
    // Check for rate limit or other retryable errors
    const isRetryable = error.status === 429 || error.status === 401 || error.status === 500 || error.status === 503;
    
    if (isRetryable && keyIndex + 1 < GROQ_KEYS.length) {
      console.warn(`Switching to Groq key ${keyIndex + 2}...`);
      return tryGroq(messages, model, keyIndex + 1, jsonMode);
    }
    
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model = 'llama-3.3-70b-versatile', jsonMode = false } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    if (GROQ_KEYS.length === 0) {
      return NextResponse.json({ error: 'Groq API keys are not configured on the server' }, { status: 500 });
    }

    const completion = await tryGroq(messages, model, 0, jsonMode);
    
    return NextResponse.json({
      text: completion.choices[0]?.message?.content || '',
      model: completion.model,
    });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      status: error.status || 500 
    }, { status: error.status || 500 });
  }
}
