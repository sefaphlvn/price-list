/**
 * Insights Generator
 * Creates deal scores and outlier detection data
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

interface VehicleWithScore {
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
  dealScore: number;
  zScore: number;
  percentile: number;
  segmentAvg: number;
  isOutlier: boolean;
  outlierType: 'cheap' | 'expensive' | null;
}

interface InsightsData {
  generatedAt: string;
  date: string;
  topDeals: VehicleWithScore[];
  cheapOutliers: VehicleWithScore[];
  expensiveOutliers: VehicleWithScore[];
  allVehicles: VehicleWithScore[];
}

function createVehicleId(brand: string, model: string, trim: string, engine: string): string {
  return `${brand}-${model}-${trim}-${engine}`.toLowerCase().replace(/\s+/g, '-');
}

function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function calculatePercentile(value: number, sortedValues: number[]): number {
  if (sortedValues.length === 0) return 0;
  const index = sortedValues.findIndex(v => v >= value);
  if (index === -1) return 100;
  return Math.round((index / sortedValues.length) * 100);
}

export async function generateInsights(): Promise<InsightsData> {
  console.log('[generateInsights] Starting...');

  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    throw new Error('index.json not found');
  }

  const index: IndexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const allVehicles: VehicleWithScore[] = [];

  // Group vehicles by segment (fuel + transmission)
  const segmentGroups: Map<string, PriceListRow[]> = new Map();

  // First pass: collect all vehicles and group by segment
  for (const [brandId, brandInfo] of Object.entries(index.brands)) {
    const latestDate = brandInfo.latestDate;
    const [year, month, day] = latestDate.split('-');
    const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const storedData: StoredData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const row of storedData.rows) {
      if (row.priceNumeric > 0) {
        const segment = `${row.fuel || 'unknown'}-${row.transmission || 'unknown'}`;
        if (!segmentGroups.has(segment)) {
          segmentGroups.set(segment, []);
        }
        segmentGroups.get(segment)!.push(row);
      }
    }
  }

  // Calculate segment statistics
  const segmentStats: Map<string, { mean: number; stdDev: number; sortedPrices: number[] }> = new Map();

  for (const [segment, vehicles] of segmentGroups.entries()) {
    const prices = vehicles.map(v => v.priceNumeric);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const stdDev = calculateStdDev(prices, mean);
    const sortedPrices = [...prices].sort((a, b) => a - b);

    segmentStats.set(segment, { mean, stdDev, sortedPrices });
  }

  // Second pass: calculate scores for each vehicle
  for (const [brandId, brandInfo] of Object.entries(index.brands)) {
    const latestDate = brandInfo.latestDate;
    const [year, month, day] = latestDate.split('-');
    const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const storedData: StoredData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const row of storedData.rows) {
      if (row.priceNumeric > 0) {
        const segment = `${row.fuel || 'unknown'}-${row.transmission || 'unknown'}`;
        const stats = segmentStats.get(segment)!;

        const zScore = calculateZScore(row.priceNumeric, stats.mean, stats.stdDev);
        const percentile = calculatePercentile(row.priceNumeric, stats.sortedPrices);

        // Determine if outlier (using 1.5 IQR rule approximated with z-score)
        const isOutlier = Math.abs(zScore) > 1.5;
        let outlierType: 'cheap' | 'expensive' | null = null;
        if (isOutlier) {
          outlierType = zScore < 0 ? 'cheap' : 'expensive';
        }

        // Calculate deal score (lower price = higher score within segment)
        // Score from 0-100, where 100 is the best deal
        const dealScore = Math.max(0, Math.min(100, Math.round(100 - percentile)));

        allVehicles.push({
          id: createVehicleId(row.brand, row.model, row.trim, row.engine),
          brand: row.brand,
          brandId,
          model: row.model,
          trim: row.trim,
          engine: row.engine,
          fuel: row.fuel,
          transmission: row.transmission,
          price: row.priceNumeric,
          priceFormatted: row.priceRaw,
          dealScore,
          zScore: Math.round(zScore * 100) / 100,
          percentile,
          segmentAvg: Math.round(stats.mean),
          isOutlier,
          outlierType,
        });
      }
    }

    console.log(`  ${brandInfo.name}: processed`);
  }

  // Sort and filter
  const topDeals = [...allVehicles]
    .sort((a, b) => b.dealScore - a.dealScore)
    .slice(0, 20);

  const cheapOutliers = allVehicles
    .filter(v => v.outlierType === 'cheap')
    .sort((a, b) => a.zScore - b.zScore)
    .slice(0, 10);

  const expensiveOutliers = allVehicles
    .filter(v => v.outlierType === 'expensive')
    .sort((a, b) => b.zScore - a.zScore)
    .slice(0, 10);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const insights: InsightsData = {
    generatedAt: now.toISOString(),
    date: dateStr,
    topDeals,
    cheapOutliers,
    expensiveOutliers,
    allVehicles,
  };

  // Save insights
  const insightsDir = path.join(dataDir, 'insights');
  fs.mkdirSync(insightsDir, { recursive: true });
  const outputPath = path.join(insightsDir, `deals-${dateStr}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(insights, null, 2), 'utf-8');

  // Also save as latest insights
  const latestPath = path.join(insightsDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(insights, null, 2), 'utf-8');

  console.log(`[generateInsights] Saved to ${outputPath}`);
  console.log(`[generateInsights] Top deals: ${topDeals.length}, Cheap outliers: ${cheapOutliers.length}, Expensive outliers: ${expensiveOutliers.length}`);

  return insights;
}
