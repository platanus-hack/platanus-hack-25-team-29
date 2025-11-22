import { NextRequest } from "next/server";

export const runtime = 'edge'; // Use edge runtime for better streaming
export const maxDuration = 60;

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: NextRequest) {
  const { prompt, systemPrompt, maxTurns } = await req.json();

  // Forward request to Python backend
  const response = await fetch(`${PYTHON_BACKEND_URL}/api/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      system_prompt: systemPrompt || 'You are a helpful AI assistant.',
      max_turns: maxTurns || 10,
    }),
  });

  if (!response.ok) {
    return new Response('Error from backend', { status: response.status });
  }

  // Stream the response from Python to the client
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
