# Multi-Brand Price List Viewer

A modern, scalable web application for viewing and comparing vehicle price lists from multiple automotive brands.

## Features

- ✅ **Multi-Brand Support**: Easily add new brands with custom parsers
- ✅ **Advanced Filtering**:
  - Global search across models, trims, engines
  - Model dropdown filter
  - Transmission dropdown filter
  - Price sorting (ascending/descending)
- ✅ **Pagination**: Customizable rows per page (10, 20, 50, 100)
- ✅ **Export Options**:
  - CSV download with UTF-8 support for Turkish characters
  - Excel (XLSX) download
  - Copy as Markdown table to clipboard
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Error Handling**: Retry logic and user-friendly error messages

## Currently Supported Brands

- Volkswagen
- Škoda

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Library**: Ant Design
- **Build Tool**: Vite
- **Export**: SheetJS (xlsx)
- **Deployment**: GitHub Pages

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Deployment to GitHub Pages

1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. The GitHub Actions workflow will automatically build and deploy

## Adding a New Brand

1. **Add brand configuration** in `src/config/brands.ts`:

```typescript
{
  id: 'brand-name',
  name: 'Brand Display Name',
  url: `${CORS_PROXY}https://api.example.com/prices.json`,
  parser: 'generic', // or create custom parser
}
```

2. **Create custom parser** (if needed) in `src/utils/parse.ts`:

```typescript
const parseBrandData = (data: any, brand: string): PriceListRow[] => {
  // Your parsing logic here
  return rows;
};
```

3. **Update types** in `src/types.ts` to include new parser type.

## CORS Handling

Since this app runs on GitHub Pages (static hosting), it needs a CORS proxy to fetch data from external APIs.

### Option 1: Cloudflare Workers (Recommended - Free)

1. Create a Cloudflare account (free)
2. Deploy `cloudflare-worker.js` to Cloudflare Workers
3. Get your worker URL (e.g., `https://your-worker.workers.dev`)
4. Set environment variable:

```bash
VITE_CORS_PROXY=https://your-worker.workers.dev/?url=
```

**Benefits:**
- ✅ Free tier: 100,000 requests/day
- ✅ Fast edge network
- ✅ Your own service
- ✅ Domain whitelist for security

### Option 2: AllOrigins (Public Service)

Use the public AllOrigins service (rate limited):

```bash
VITE_CORS_PROXY=https://api.allorigins.win/raw?url=
```

**Note:** May have rate limits and slower performance.

### Option 3: Your Own Backend

Deploy your own CORS proxy server and set the URL.

## Project Structure

```
src/
├── config/
│   └── brands.ts          # Brand configurations
├── utils/
│   ├── fetch.ts           # Fetch with timeout & retry
│   ├── parse.ts           # Brand-specific parsers
│   └── export.ts          # Export utilities (CSV, XLSX, Markdown)
├── types.ts               # TypeScript interfaces
├── App.tsx                # Main application component
└── main.tsx               # Entry point
```

## License

MIT
