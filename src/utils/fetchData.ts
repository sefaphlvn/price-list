/**
 * Data Fetch Utilities
 * Handles fetching JSON data with cache-busting for fresh data
 */

/**
 * Fetch JSON data with cache-busting timestamp
 * Used for frequently updated data files (index.json, latest.json, etc.)
 */
export async function fetchFreshJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Add cache-busting query parameter
  const separator = url.includes('?') ? '&' : '?';
  const cacheBustUrl = `${url}${separator}_t=${Date.now()}`;

  const response = await fetch(cacheBustUrl, {
    ...options,
    cache: 'no-store', // Bypass HTTP cache
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // Safe JSON parsing - handles non-JSON responses
  try {
    const text = await response.text();
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response from ${url}`);
  }
}

/**
 * Fetch JSON data allowing cache (for historical/static data)
 */
export async function fetchCachedJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // Safe JSON parsing - handles non-JSON responses
  try {
    const text = await response.text();
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response from ${url}`);
  }
}

/**
 * API Base URL
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.otofiyatlist.com';

/**
 * Data URLs
 */
export const DATA_URLS = {
  index: `${API_BASE}/api/v1/index`,
  latest: `${API_BASE}/api/v1/latest`,
  stats: `${API_BASE}/api/v1/stats`,
  errors: `${API_BASE}/api/v1/errors`,
  insights: `${API_BASE}/api/v1/insights`,
  intel: (type: string) => `${API_BASE}/api/v1/intel/${type}`,
  brandData: (_year: string, _month: string, brandId: string, day: string) =>
    `${API_BASE}/api/v1/vehicles?brand=${brandId}&date=${_year}-${_month}-${day}`,
} as const;
