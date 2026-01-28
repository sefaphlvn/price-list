// Historical Data Utilities
// Fetches data from pre-collected JSON files (no live API calls)

import { IndexData, StoredData, PriceListRow } from '../types';

const BASE_PATH = './data';

// Cache for index data
let indexCache: IndexData | null = null;

/**
 * Fetch the index file containing available dates for all brands
 */
export const fetchIndex = async (): Promise<IndexData | null> => {
  if (indexCache) return indexCache;

  try {
    const response = await fetch(`${BASE_PATH}/index.json`);
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

    // Parse date to get path components
    const [year, month, day] = targetDate.split('-');
    const url = `${BASE_PATH}/${year}/${month}/${brandId}/${day}.json`;

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
 */
export const fetchAllBrandsLatest = async (): Promise<Map<string, StoredData>> => {
  const result = new Map<string, StoredData>();

  const index = await fetchIndex();
  if (!index) return result;

  const fetchPromises = Object.keys(index.brands).map(async (brandId) => {
    const data = await fetchBrandData(brandId);
    if (data) {
      result.set(brandId, data);
    }
  });

  await Promise.all(fetchPromises);
  return result;
};

/**
 * Get all rows from all brands (latest data)
 */
export const fetchAllRows = async (): Promise<PriceListRow[]> => {
  const allData = await fetchAllBrandsLatest();
  const rows: PriceListRow[] = [];

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
