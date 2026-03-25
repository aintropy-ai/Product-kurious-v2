// Cloudflare Pages Function — proxy for /api/v1/search-log/*

export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/v1/search-log', '');

  const BACKEND_URL = env.VITE_BACKEND_API_URL || env.BACKEND_API_URL || 'https://kurious-backend-api.centralus.cloudapp.azure.com';
  const BACKEND_API_KEY = env.VITE_BACKEND_API_KEY || env.BACKEND_API_KEY;
  const BACKEND_COMPANY_ID = env.VITE_BACKEND_COMPANY_ID || env.BACKEND_COMPANY_ID;
  const backendUrl = `${BACKEND_URL}/api/v1/search-log${path}`;

  const body = request.method !== 'GET' ? await request.text() : undefined;

  try {
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': BACKEND_API_KEY,
        'X-Company-ID': BACKEND_COMPANY_ID,
      },
      body,
    });

    const responseText = await backendResponse.text();
    return new Response(responseText, {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json',
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
