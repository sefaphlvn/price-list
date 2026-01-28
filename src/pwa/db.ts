// IndexedDB Schema with Dexie
// Provides offline data storage for price list data

import Dexie, { Table } from 'dexie';
import { StoredData, IndexData } from '../types';

// Extended types for IndexedDB storage
export interface CachedVehicleData extends StoredData {
  key: string; // brandId-date
  cachedAt: string;
}

export interface CachedIndex extends IndexData {
  id: string; // 'main'
  cachedAt: string;
}

export interface SearchIndexEntry {
  id: string;
  brand: string;
  model: string;
  trim: string;
  engine: string;
  fuel: string;
  transmission: string;
  price: number;
  priceFormatted: string;
  searchText: string; // Combined searchable text
}

export interface CachedSearchIndex {
  id: string; // 'main'
  entries: SearchIndexEntry[];
  cachedAt: string;
}

class PriceListDB extends Dexie {
  vehicles!: Table<CachedVehicleData>;
  index!: Table<CachedIndex>;
  searchIndex!: Table<CachedSearchIndex>;

  constructor() {
    super('otofiyatlist-db');
    this.version(1).stores({
      vehicles: 'key, brandId, cachedAt',
      index: 'id',
      searchIndex: 'id',
    });
  }
}

export const db = new PriceListDB();

// Helper functions for database operations

export async function cacheVehicleData(
  brandId: string,
  date: string,
  data: StoredData
): Promise<void> {
  const key = `${brandId}-${date}`;
  await db.vehicles.put({
    ...data,
    key,
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedVehicleData(
  brandId: string,
  date: string
): Promise<StoredData | undefined> {
  const key = `${brandId}-${date}`;
  const cached = await db.vehicles.get(key);
  if (cached) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { key: _key, cachedAt: _cachedAt, ...data } = cached;
    return data as StoredData;
  }
  return undefined;
}

export async function cacheIndex(indexData: IndexData): Promise<void> {
  await db.index.put({
    ...indexData,
    id: 'main',
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedIndex(): Promise<IndexData | undefined> {
  const cached = await db.index.get('main');
  if (cached) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, cachedAt: _cachedAt, ...data } = cached;
    return data as IndexData;
  }
  return undefined;
}

export async function cacheSearchIndex(entries: SearchIndexEntry[]): Promise<void> {
  await db.searchIndex.put({
    id: 'main',
    entries,
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedSearchIndex(): Promise<SearchIndexEntry[] | undefined> {
  const cached = await db.searchIndex.get('main');
  return cached?.entries;
}

export async function clearAllCache(): Promise<void> {
  await db.vehicles.clear();
  await db.index.clear();
  await db.searchIndex.clear();
}

export async function getCacheStats(): Promise<{
  vehicleCount: number;
  hasIndex: boolean;
  hasSearchIndex: boolean;
  oldestCache: string | null;
}> {
  const vehicleCount = await db.vehicles.count();
  const index = await db.index.get('main');
  const searchIndex = await db.searchIndex.get('main');

  const vehicles = await db.vehicles.orderBy('cachedAt').first();

  return {
    vehicleCount,
    hasIndex: !!index,
    hasSearchIndex: !!searchIndex,
    oldestCache: vehicles?.cachedAt || null,
  };
}
