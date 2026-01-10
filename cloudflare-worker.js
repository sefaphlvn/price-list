// Cloudflare Worker for CORS Proxy
// Deploy this to Cloudflare Workers (free tier: 100k requests/day)

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }

  // Whitelist allowed domains
  const allowedDomains = [
    'binekarac2.vw.com.tr',
    'www.skoda.com.tr',
    'best.renault.com.tr',
    // Add more domains as needed
  ]

  const targetDomain = new URL(targetUrl).hostname
  if (!allowedDomains.includes(targetDomain)) {
    return new Response(
      JSON.stringify({
        error: 'Domain not allowed',
        domain: targetDomain,
        allowedDomains: allowedDomains
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
      }
    })

    // Create new response with CORS headers
    const newHeaders = new Headers(response.headers)
    newHeaders.set('Access-Control-Allow-Origin', '*')
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    newHeaders.set('Access-Control-Allow-Headers', '*')
    newHeaders.set('Access-Control-Max-Age', '86400')

    // Remove problematic headers that might cause issues
    newHeaders.delete('Content-Security-Policy')
    newHeaders.delete('X-Frame-Options')

    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    })

    return newResponse
  } catch (error) {
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain'
      }
    })
  }
}
