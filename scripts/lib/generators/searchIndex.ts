/**
 * Search Index Generator
 * Creates a Fuse.js compatible search index
 */

import * as fs from 'fs';
import * as path from 'path';

interface PriceListRow {
  model: string;
  trim: string;
  engine: string;
  transmission: string;
  fuel: string;
  priceRaw: string;
  priceNumeric: number;
  brand: string;
}

interface StoredData {
  collectedAt: string;
  brand: string;
  brandId: string;
  rowCount: number;
  rows: PriceListRow[];
}

interface IndexData {
  lastUpdated: string;
  brands: {
    [brandId: string]: {
      name: string;
      availableDates: string[];
      latestDate: string;
      totalRecords: number;
    };
  };
}

export interface SearchIndexEntry {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  trim: string;
  engine: string;
  fuel: string;
  transmission: string;
  price: number;
  priceFormatted: string;
  searchText: string;
}

interface SearchIndexData {
  generatedAt: string;
  totalEntries: number;
  entries: SearchIndexEntry[];
}

function createVehicleId(brand: string, model: string, trim: string, engine: string): string {
  return `${brand}-${model}-${trim}-${engine}`.toLowerCase().replace(/\s+/g, '-');
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function generateSearchIndex(): Promise<SearchIndexData> {
  console.log('[generateSearchIndex] Starting...');

  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    throw new Error('index.json not found');
  }

  const index: IndexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const entries: SearchIndexEntry[] = [];

  for (const [brandId, brandInfo] of Object.entries(index.brands)) {
    const latestDate = brandInfo.latestDate;
    const [year, month, day] = latestDate.split('-');
    const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const storedData: StoredData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const row of storedData.rows) {
      const id = createVehicleId(row.brand, row.model, row.trim, row.engine);

      // Create searchable text combining all relevant fields
      const searchText = normalizeText(
        `${row.brand} ${row.model} ${row.trim} ${row.engine} ${row.fuel} ${row.transmission}`
      );

      entries.push({
        id,
        brand: row.brand,
        brandId,
        model: row.model,
        trim: row.trim,
        engine: row.engine,
        fuel: row.fuel,
        transmission: row.transmission,
        price: row.priceNumeric,
        priceFormatted: row.priceRaw,
        searchText,
      });
    }

    console.log(`  ${brandInfo.name}: ${storedData.rows.length} entries indexed`);
  }

  const searchIndexData: SearchIndexData = {
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    entries,
  };

  // Save search-index.json
  const outputPath = path.join(dataDir, 'search-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(searchIndexData, null, 2), 'utf-8');
  console.log(`[generateSearchIndex] Saved to ${outputPath}`);
  console.log(`[generateSearchIndex] Total entries: ${entries.length}`);

  return searchIndexData;
}
