// Cloudflare Pages Function to proxy conversations API requests

export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/v1/conversations/', '').replace('/api/v1/conversations', '');

  const BACKEND_URL = env.VITE_BACKEND_API_URL || env.BACKEND_API_URL || 'https://kurious-backend-api.centralus.cloudapp.azure.com';
  const BACKEND_API_KEY = env.VITE_BACKEND_API_KEY || env.BACKEND_API_KEY;
  const BACKEND_COMPANY_ID = env.VITE_BACKEND_COMPANY_ID || env.BACKEND_COMPANY_ID;
  const BACKEND_USER_ID = env.VITE_BACKEND_USER_ID || env.BACKEND_USER_ID;

  const backendUrl = path
    ? `${BACKEND_URL}/api/v1/conversations/${path}${url.search}`
    : `${BACKEND_URL}/api/v1/conversations${url.search}`;

  try {
    const body = request.method !== 'GET' && request.method !== 'DELETE' ? await request.text() : undefined;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(BACKEND_API_KEY && { 'X-API-Key': BACKEND_API_KEY }),
      ...(BACKEND_COMPANY_ID && { 'X-Company-ID': BACKEND_COMPANY_ID }),
      ...(BACKEND_USER_ID && { 'X-User-ID': BACKEND_USER_ID }),
    };

    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
    });

    const contentType = backendResponse.headers.get('Content-Type') || 'application/json';
    const responseBody = await backendResponse.text();

    return new Response(responseBody, {
      status: backendResponse.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Company-ID, X-User-ID',
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Company-ID, X-User-ID',
    },
  });
}
