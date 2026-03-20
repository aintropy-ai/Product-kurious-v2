// Cloudflare Pages Function to proxy backend API requests
// This allows HTTPS frontend to communicate with HTTP backend

export async function onRequest(context: any) {
  const { request, env } = context;

  // Get the path after /api/v1/blended/
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/v1/blended/', '');

  // Backend configuration
  const BACKEND_URL = env.VITE_BACKEND_API_URL || 'https://kurious-backend-api.centralus.cloudapp.azure.com';
  const BACKEND_API_KEY = env.VITE_BACKEND_API_KEY;
  const BACKEND_COMPANY_ID = env.VITE_BACKEND_COMPANY_ID;

  // Construct backend URL (backend expects /api prefix)
  const backendUrl = `${BACKEND_URL}/api/v1/blended/${path}`;

  console.log('Pages Function Debug:', {
    requestUrl: request.url,
    backendUrl: backendUrl,
    hasApiKey: !!BACKEND_API_KEY,
    hasCompanyId: !!BACKEND_COMPANY_ID,
    method: request.method
  });

  try {
    // Get request body
    const body = request.method !== 'GET' ? await request.text() : undefined;

    console.log('Request body:', body);

    // Forward the request to backend
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': BACKEND_API_KEY,
        'X-Company-ID': BACKEND_COMPANY_ID,
      },
      body: body,
    });

    console.log('Backend response status:', backendResponse.status);

    const responseText = await backendResponse.text();
    console.log('Backend response:', responseText);

    // Return response with CORS headers
    return new Response(responseText, {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Company-ID',
      },
    });
  } catch (error: any) {
    console.error('Pages Function error:', error);

    return new Response(JSON.stringify({
      error: error.message || 'Backend request failed',
      stack: error.stack,
      backendUrl: backendUrl
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Handle OPTIONS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
