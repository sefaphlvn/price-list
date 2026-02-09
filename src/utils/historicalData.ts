// Historical Data Utilities
// Fetches data from backend API

import { IndexData, StoredData, PriceListRow } from '../types';
import { DATA_URLS } from './fetchData';

// Cache for index data
let indexCache: IndexData | null = null;

/**
 * Fetch the index file containing available dates for all brands
 */
export const fetchIndex = async (): Promise<IndexData | null> => {
  if (indexCache) return indexCache;

  try {
    const response = await fetch(DATA_URLS.index);
    if (!response.ok) return null;

    // Check if response is actually JSON (not HTML from SPA fallback)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Index response is not JSON, got:', contentType);
      return null;
    }

    indexCache = await response.json();
    return indexCache;
  } catch (error) {
    console.error('Failed to fetch index:', error);
    return null;
  }
};

/**
 * Fetch data for a specific brand and date
 */
export const fetchBrandData = async (
  brandId: string,
  date?: string
): Promise<StoredData | null> => {
  try {
    // If no date provided, get the latest date from index
    let targetDate = date;

    if (!targetDate) {
      const index = await fetchIndex();
      if (!index || !index.brands[brandId]) return null;
      targetDate = index.brands[brandId].latestDate;
    }

    // Build API URL
    const [year, month, day] = targetDate.split('-');
    const url = DATA_URLS.brandData(year, month, brandId, day);

    const response = await fetch(url);
    if (!response.ok) return null;

    const data: StoredData = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch data for ${brandId}:`, error);
    return null;
  }
};

/**
 * Fetch latest data for all brands
 * @param signal - Optional AbortSignal for cancellation
 */
export const fetchAllBrandsLatest = async (signal?: AbortSignal): Promise<Map<string, StoredData>> => {
  const result = new Map<string, StoredData>();

  // Check if already aborted
  if (signal?.aborted) return result;

  const index = await fetchIndex();
  if (!index) return result;

  const fetchPromises = Object.keys(index.brands).map(async (brandId) => {
    // Check abort before each fetch
    if (signal?.aborted) return;
    const data = await fetchBrandData(brandId);
    if (data && !signal?.aborted) {
      result.set(brandId, data);
    }
  });

  await Promise.all(fetchPromises);
  return result;
};

/**
 * Get all rows from all brands (latest data)
 * @param signal - Optional AbortSignal for cancellation
 */
export const fetchAllRows = async (signal?: AbortSignal): Promise<PriceListRow[]> => {
  const allData = await fetchAllBrandsLatest(signal);
  const rows: PriceListRow[] = [];

  // Check if aborted before processing
  if (signal?.aborted) return rows;

  allData.forEach((data) => {
    rows.push(...data.rows);
  });

  return rows;
};

/**
 * Get available dates for a brand
 */
export const getAvailableDates = async (brandId: string): Promise<string[]> => {
  const index = await fetchIndex();
  if (!index || !index.brands[brandId]) return [];
  return index.brands[brandId].availableDates;
};

/**
 * Get the latest date for a brand
 */
export const getLatestDate = async (brandId: string): Promise<string | null> => {
  const index = await fetchIndex();
  if (!index || !index.brands[brandId]) return null;
  return index.brands[brandId].latestDate;
};

/**
 * Clear the index cache (useful for refreshing)
 */
export const clearCache = () => {
  indexCache = null;
};
