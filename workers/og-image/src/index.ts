// OG Image Worker
// Generates dynamic Open Graph images for vehicle sharing

import { generateSVG } from './template';

interface OGParams {
  brand: string;
  model: string;
  trim: string;
  price: string;
  change?: string;
}

function parseParams(url: URL): OGParams | null {
  const brand = url.searchParams.get('brand');
  const model = url.searchParams.get('model');
  const trim = url.searchParams.get('trim');
  const price = url.searchParams.get('price');
  const change = url.searchParams.get('change') || undefined;

  if (!brand || !model || !price) {
    return null;
  }

  return { brand, model, trim: trim || '', price, change };
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }

    // Root path shows usage info
    if (url.pathname === '/') {
      return new Response(
        JSON.stringify({
          usage: '/?brand=Volkswagen&model=Golf&trim=1.5TSI&price=1.250.000₺&change=+5.2%',
          params: {
            brand: 'Vehicle brand (required)',
            model: 'Vehicle model (required)',
            trim: 'Vehicle trim/variant (optional)',
            price: 'Formatted price (required)',
            change: 'Price change percentage (optional)',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse parameters
    const params = parseParams(url);

    if (!params) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: brand, model, price' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Generate SVG
      const svg = generateSVG(params);

      // Return as SVG (can be converted to PNG with resvg-wasm if needed)
      return new Response(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400', // 24 hours
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate image' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
