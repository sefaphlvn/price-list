/**
 * Precomputed Statistics Generator
 * Creates pre-calculated statistics for the statistics page
 */

import * as fs from 'fs';
import * as path from 'path';
import { safeParseJSON } from '../errorLogger';

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

interface BrandStats {
  name: string;
  vehicleCount: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
}

interface FuelStats {
  fuel: string;
  count: number;
  percentage: number;
  avgPrice: number;
}

interface TransmissionStats {
  transmission: string;
  count: number;
  percentage: number;
  avgPrice: number;
}

interface PriceSegmentStats {
  segment: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

interface PrecomputedStats {
  generatedAt: string;
  totalVehicles: number;
  overallStats: {
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    medianPrice: number;
  };
  brandStats: BrandStats[];
  fuelStats: FuelStats[];
  transmissionStats: TransmissionStats[];
  priceSegments: PriceSegmentStats[];
}

const PRICE_SEGMENTS = [
  { segment: 'budget', min: 0, max: 1500000 },
  { segment: 'mid', min: 1500000, max: 3000000 },
  { segment: 'premium', min: 3000000, max: 5000000 },
  { segment: 'luxury', min: 5000000, max: Infinity },
];

function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function generateStats(): Promise<PrecomputedStats> {
  console.log('[generateStats] Starting...');

  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    throw new Error('index.json not found');
  }

  const index = safeParseJSON<IndexData>(indexPath, { lastUpdated: '', brands: {} });
  const allPrices: number[] = [];
  const brandData: Map<string, { name: string; prices: number[] }> = new Map();
  const fuelData: Map<string, number[]> = new Map();
  const transmissionData: Map<string, number[]> = new Map();

  // Collect all data
  for (const [brandId, brandInfo] of Object.entries(index.brands)) {
    const latestDate = brandInfo.latestDate;
    const [year, month, day] = latestDate.split('-');
    const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const storedData = safeParseJSON<StoredData>(filePath, { collectedAt: '', brand: '', brandId: '', rowCount: 0, rows: [] });

    if (!brandData.has(brandId)) {
      brandData.set(brandId, { name: brandInfo.name, prices: [] });
    }

    for (const row of storedData.rows) {
      if (row.priceNumeric > 0) {
        allPrices.push(row.priceNumeric);
        brandData.get(brandId)!.prices.push(row.priceNumeric);

        // Fuel stats
        const fuel = row.fuel || 'Bilinmiyor';
        if (!fuelData.has(fuel)) {
          fuelData.set(fuel, []);
        }
        fuelData.get(fuel)!.push(row.priceNumeric);

        // Transmission stats
        const transmission = row.transmission || 'Bilinmiyor';
        if (!transmissionData.has(transmission)) {
          transmissionData.set(transmission, []);
        }
        transmissionData.get(transmission)!.push(row.priceNumeric);
      }
    }

    console.log(`  ${brandInfo.name}: ${storedData.rows.length} vehicles processed`);
  }

  // Calculate overall stats
  const overallStats = {
    avgPrice: allPrices.length > 0 ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length) : 0,
    minPrice: allPrices.length > 0 ? Math.min(...allPrices) : 0,
    maxPrice: allPrices.length > 0 ? Math.max(...allPrices) : 0,
    medianPrice: calculateMedian(allPrices),
  };

  // Calculate brand stats
  const brandStats: BrandStats[] = Array.from(brandData.entries())
    .filter(([_, data]) => data.prices.length > 0)
    .map(([_, data]) => {
      const prices = data.prices;
      return {
        name: data.name,
        vehicleCount: prices.length,
        avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
        medianPrice: calculateMedian(prices),
      };
    }).sort((a, b) => b.vehicleCount - a.vehicleCount);

  // Calculate fuel stats
  const fuelStats: FuelStats[] = Array.from(fuelData.entries())
    .filter(([_, prices]) => prices.length > 0)
    .map(([fuel, prices]) => ({
      fuel,
      count: prices.length,
      percentage: allPrices.length > 0 ? Math.round((prices.length / allPrices.length) * 100 * 10) / 10 : 0,
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
    })).sort((a, b) => b.count - a.count);

  // Calculate transmission stats
  const transmissionStats: TransmissionStats[] = Array.from(transmissionData.entries())
    .filter(([_, prices]) => prices.length > 0)
    .map(([transmission, prices]) => ({
      transmission,
      count: prices.length,
      percentage: allPrices.length > 0 ? Math.round((prices.length / allPrices.length) * 100 * 10) / 10 : 0,
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
    })).sort((a, b) => b.count - a.count);

  // Calculate price segments
  const priceSegments: PriceSegmentStats[] = PRICE_SEGMENTS.map(seg => {
    const count = allPrices.filter(p => p >= seg.min && p < seg.max).length;
    return {
      segment: seg.segment,
      min: seg.min,
      max: seg.max === Infinity ? 0 : seg.max,
      count,
      percentage: allPrices.length > 0 ? Math.round((count / allPrices.length) * 100 * 10) / 10 : 0,
    };
  });

  const stats: PrecomputedStats = {
    generatedAt: new Date().toISOString(),
    totalVehicles: allPrices.length,
    overallStats,
    brandStats,
    fuelStats,
    transmissionStats,
    priceSegments,
  };

  // Save stats
  const statsDir = path.join(dataDir, 'stats');
  fs.mkdirSync(statsDir, { recursive: true });
  const outputPath = path.join(statsDir, 'precomputed.json');
  fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2), 'utf-8');
  console.log(`[generateStats] Saved to ${outputPath}`);

  return stats;
}
