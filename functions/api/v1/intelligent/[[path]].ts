// Cloudflare Pages Function — streaming proxy for /api/v1/intelligent/*
// Passes response.body through directly so SSE events reach the browser unblocked.

export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/v1/intelligent/', '');

  const BACKEND_URL = env.VITE_BACKEND_API_URL || 'https://kurious-backend-api.centralus.cloudapp.azure.com';
  const backendUrl = `${BACKEND_URL}/api/v1/intelligent/${path}`;

  const body = request.method !== 'GET' ? await request.text() : undefined;

  try {
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': env.VITE_BACKEND_API_KEY,
        'X-Company-ID': env.VITE_BACKEND_COMPANY_ID,
      },
      body,
    });

    // Stream the body through without buffering — critical for SSE
    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Company-ID',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Backend request failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Company-ID',
    },
  });
}
