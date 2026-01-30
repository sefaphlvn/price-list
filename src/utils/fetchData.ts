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
 * Data URLs
 */
export const DATA_URLS = {
  index: './data/index.json',
  latest: './data/latest.json',
  stats: './data/stats/precomputed.json',
  errors: './data/errors.json',
  insights: './data/insights/latest.json',
  intel: (type: string) => `./data/intel/${type}.json`,
  brandData: (year: string, month: string, brandId: string, day: string) =>
    `./data/${year}/${month}/${brandId}/${day}.json`,
} as const;
