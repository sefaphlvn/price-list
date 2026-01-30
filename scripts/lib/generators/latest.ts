/**
 * Latest Data Generator
 * Creates a single latest.json file with all brands' most recent data
 */

import * as fs from 'fs';
import * as path from 'path';
import { safeParseJSON } from '../errorLogger';
import { PriceListRow, StoredData, IndexData } from '../types';

interface LatestData {
  generatedAt: string;
  totalVehicles: number;
  brands: {
    [brandId: string]: {
      name: string;
      date: string;
      vehicles: PriceListRow[];
    };
  };
}

export async function generateLatest(): Promise<LatestData> {
  console.log('[generateLatest] Starting...');

  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    throw new Error('index.json not found');
  }

  const index = safeParseJSON<IndexData>(indexPath, { lastUpdated: '', brands: {} });
  const latest: LatestData = {
    generatedAt: new Date().toISOString(),
    totalVehicles: 0,
    brands: {},
  };

  for (const [brandId, brandInfo] of Object.entries(index.brands)) {
    const latestDate = brandInfo.latestDate;
    const [year, month, day] = latestDate.split('-');
    const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`  Warning: ${filePath} not found`);
      continue;
    }

    const storedData = safeParseJSON<StoredData>(filePath, { collectedAt: '', brand: '', brandId: '', rowCount: 0, rows: [] });

    latest.brands[brandId] = {
      name: brandInfo.name,
      date: latestDate,
      vehicles: storedData.rows,
    };

    latest.totalVehicles += storedData.rows.length;
    console.log(`  ${brandInfo.name}: ${storedData.rows.length} vehicles`);
  }

  // Save latest.json
  const outputPath = path.join(dataDir, 'latest.json');
  fs.writeFileSync(outputPath, JSON.stringify(latest, null, 2), 'utf-8');
  console.log(`[generateLatest] Saved to ${outputPath}`);
  console.log(`[generateLatest] Total vehicles: ${latest.totalVehicles}`);

  return latest;
}
