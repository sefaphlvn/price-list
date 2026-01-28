// OG Image SVG Template
// Generates dynamic SVG for Open Graph images

interface OGParams {
  brand: string;
  model: string;
  trim: string;
  price: string;
  change?: string;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSVG(params: OGParams): string {
  const { brand, model, trim, price, change } = params;

  // Determine change color and direction
  let changeColor = '#6b7280'; // gray
  let changePrefix = '';
  if (change) {
    if (change.startsWith('+')) {
      changeColor = '#ef4444'; // red for increase
      changePrefix = '↑ ';
    } else if (change.startsWith('-')) {
      changeColor = '#22c55e'; // green for decrease
      changePrefix = '↓ ';
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="630" fill="#000000"/>

  <!-- Gradient overlay -->
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#gradient)"/>

  <!-- Top accent line -->
  <rect x="0" y="0" width="1200" height="6" fill="#3b82f6"/>

  <!-- Logo area -->
  <rect x="60" y="50" width="60" height="60" rx="12" fill="#3b82f6"/>
  <text x="90" y="92" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#ffffff" text-anchor="middle">OFL</text>

  <!-- Site name -->
  <text x="140" y="92" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#6b7280">OtoFiyatList</text>

  <!-- Brand & Model (main title) -->
  <text x="60" y="220" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="700" fill="#ffffff">
    ${escapeXml(brand)} ${escapeXml(model)}
  </text>

  <!-- Trim -->
  ${trim ? `<text x="60" y="290" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="400" fill="#9ca3af">${escapeXml(trim)}</text>` : ''}

  <!-- Price -->
  <text x="60" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="96" font-weight="700" fill="#3b82f6">
    ${escapeXml(price)}
  </text>

  <!-- Price change -->
  ${change ? `
  <rect x="60" y="450" width="180" height="50" rx="8" fill="${changeColor}" opacity="0.2"/>
  <text x="150" y="488" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="${changeColor}" text-anchor="middle">
    ${changePrefix}${escapeXml(change.replace(/[+-]/, ''))}
  </text>
  ` : ''}

  <!-- Footer -->
  <text x="60" y="590" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#6b7280">
    otofiyatlist.com
  </text>

  <!-- Decorative elements -->
  <circle cx="1100" cy="500" r="200" fill="#3b82f6" opacity="0.05"/>
  <circle cx="1050" cy="550" r="150" fill="#3b82f6" opacity="0.03"/>
</svg>`;
}
