/**
 * Insights Generator
 * Creates deal scores and outlier detection data
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

interface VehicleWithScore {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  trim: string;
  engine: string;
  fuel: string;
  transmission: string;
  vehicleClass: string;
  priceBand: string;
  price: number;
  priceFormatted: string;
  dealScore: number;
  zScore: number;
  percentile: number;
  segmentAvg: number;
  segmentSize: number;
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
  if (sortedValues.length === 0) return 50;
  // For very small segments, percentile is less meaningful
  if (sortedValues.length < 3) return 50;
  const index = sortedValues.findIndex(v => v >= value);
  if (index === -1) return 100;
  // Use (index + 0.5) for better distribution
  return Math.round(((index + 0.5) / sortedValues.length) * 100);
}

// Minimum segment size for meaningful comparison
const MIN_SEGMENT_SIZE = 5;

// Detect vehicle class from model name
function detectVehicleClass(model: string): string {
  const modelLower = model.toLowerCase();

  // SUV/Crossover patterns
  const suvPatterns = [
    'suv', 'crossover', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7',
    'q2', 'q3', 'q4', 'q5', 'q7', 'q8', 'tiguan', 'touareg', 't-roc', 'taigo',
    'tucson', 'kona', 'santa', 'bayon', 'venue', 'palisade',
    'kadjar', 'captur', 'koleos', 'austral', 'symbioz', 'duster', 'jogger',
    'puma', 'kuga', 'ecosport', 'explorer', 'mustang mach',
    'karoq', 'kodiaq', 'kamiq', 'enyaq',
    'corolla cross', 'c-hr', 'rav4', 'yaris cross', 'land cruiser', 'highlander',
    '2008', '3008', '5008', 'rifter',
    'c3 aircross', 'c4 cactus', 'c5 aircross', 'berlingo',
    'mokka', 'grandland', 'crossland', 'combo',
    'atto', 'tang', 'yuan', 'song', 'seal u',
    'tipo cross', '500x', 'pulse',
    'ateca', 'arona', 'tarraco', 'formentor',
    'niro', 'sportage', 'sorento', 'seltos', 'ev6', 'ev9',
    'hr-v', 'cr-v', 'zr-v',
    'juke', 'qashqai', 'x-trail', 'ariya',
    'xc40', 'xc60', 'xc90', 'ex30', 'ex90',
    'glb', 'glc', 'gle', 'gls', 'eqa', 'eqb', 'eqc', 'eqe suv', 'eqs suv'
  ];

  // Sedan patterns
  const sedanPatterns = [
    'sedan', 'jetta', 'passat', 'arteon',
    'elantra', 'sonata', 'ioniq 6', 'i30 fastback',
    'megane sedan', 'talisman', 'fluence',
    'focus sedan', 'mondeo',
    'octavia', 'superb',
    'camry', 'corolla sedan', 'prius',
    '508', '301',
    'c4 x', 'c5 x',
    'insignia',
    'seal',
    'tipo sedan', 'egea',
    'toledo', 'leon',
    'k5', 'stinger',
    'civic sedan', 'accord',
    'altima', 'sentra',
    's60', 's90',
    'a-class sedan', 'c-class', 'e-class', 's-class', 'eqa', 'eqe', 'eqs',
    '3 series', '5 series', '7 series', 'i4', 'i5', 'i7'
  ];

  // Hatchback patterns
  const hatchPatterns = [
    'hatchback', 'hb', 'golf', 'polo', 'id.3', 'id.4', 'id.5', 'id.7',
    'i20', 'i30', 'ioniq 5',
    'clio', 'megane', 'zoe', 'r5',
    'fiesta', 'focus hb',
    'fabia', 'scala',
    'yaris', 'corolla hb', 'auris',
    '208', '308',
    'c3', 'c4',
    'corsa', 'astra',
    'dolphin', 'seagull',
    '500', 'punto', 'tipo hb',
    'ibiza', 'leon',
    'rio', 'ceed', 'ev3',
    'civic hb', 'jazz', 'e:ny1',
    'leaf', 'micra', 'note',
    'v40',
    'a-class', '1 series', '2 series'
  ];

  // MPV/Van patterns
  const mpvPatterns = [
    'mpv', 'van', 'touran', 'sharan', 'multivan', 't6', 't7', 'caddy', 'transporter', 'caravelle',
    'staria',
    'kangoo', 'trafic', 'master', 'espace',
    'transit', 'tourneo', 'galaxy', 's-max',
    'traveller', 'expert',
    'spacetourer', 'jumpy',
    'vivaro', 'movano', 'zafira',
    'proace', 'sienna',
    'carnival', 'carens',
    'odyssey',
    'serena',
    'v-class', 'vito', 'sprinter',
    'fiorino', 'doblo', 'ducato', 'scudo'
  ];

  // Pickup patterns
  const pickupPatterns = [
    'pickup', 'pick-up', 'amarok',
    'ranger', 'maverick',
    'hilux', 'tacoma', 'tundra',
    'navara', 'frontier',
    'fullback', 'strada'
  ];

  // Coupe/Sports patterns
  const coupePatterns = [
    'coupe', 'coupé', 'roadster', 'cabrio', 'cabriolet', 'convertible',
    'tt', 'r8',
    'mustang', 'z4', 'm2', 'm3', 'm4', 'm8',
    '86', 'gr86', 'supra',
    'mx-5', 'miata',
    'alpine', 'a110',
    'amg gt', 'cla', 'slc', 'sl'
  ];

  for (const pattern of suvPatterns) {
    if (modelLower.includes(pattern)) return 'SUV';
  }
  for (const pattern of sedanPatterns) {
    if (modelLower.includes(pattern)) return 'Sedan';
  }
  for (const pattern of hatchPatterns) {
    if (modelLower.includes(pattern)) return 'Hatchback';
  }
  for (const pattern of mpvPatterns) {
    if (modelLower.includes(pattern)) return 'MPV';
  }
  for (const pattern of pickupPatterns) {
    if (modelLower.includes(pattern)) return 'Pickup';
  }
  for (const pattern of coupePatterns) {
    if (modelLower.includes(pattern)) return 'Coupe';
  }

  return 'Other';
}

// Get price band for additional segmentation
function getPriceBand(price: number): string {
  if (price < 1000000) return 'economy';      // < 1M
  if (price < 2000000) return 'budget';       // 1-2M
  if (price < 3500000) return 'mid';          // 2-3.5M
  if (price < 6000000) return 'premium';      // 3.5-6M
  return 'luxury';                             // > 6M
}

export async function generateInsights(): Promise<InsightsData> {
  console.log('[generateInsights] Starting...');

  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    throw new Error('index.json not found');
  }

  const index = safeParseJSON<IndexData>(indexPath, { lastUpdated: '', brands: {} });
  const allVehicles: VehicleWithScore[] = [];

  // Group vehicles by segment (vehicle class + fuel + price band for meaningful comparison)
  const segmentGroups: Map<string, PriceListRow[]> = new Map();

  // First pass: collect all vehicles and group by segment
  for (const [brandId, brandInfo] of Object.entries(index.brands)) {
    const latestDate = brandInfo.latestDate;
    const [year, month, day] = latestDate.split('-');
    const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const storedData = safeParseJSON<StoredData>(filePath, { collectedAt: '', brand: '', brandId: '', rowCount: 0, rows: [] });

    for (const row of storedData.rows) {
      if (row.priceNumeric > 0) {
        const vehicleClass = detectVehicleClass(row.model);
        const priceBand = getPriceBand(row.priceNumeric);
        // Segment: VehicleClass-Fuel-PriceBand (e.g., "SUV-Dizel-premium")
        const segment = `${vehicleClass}-${row.fuel || 'unknown'}-${priceBand}`;
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
    if (prices.length === 0) continue;
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

    const storedData = safeParseJSON<StoredData>(filePath, { collectedAt: '', brand: '', brandId: '', rowCount: 0, rows: [] });

    for (const row of storedData.rows) {
      if (row.priceNumeric > 0) {
        const vehicleClass = detectVehicleClass(row.model);
        const priceBand = getPriceBand(row.priceNumeric);
        const segment = `${vehicleClass}-${row.fuel || 'unknown'}-${priceBand}`;
        const stats = segmentStats.get(segment);
        if (!stats) continue;

        // Skip segments that are too small for meaningful comparison
        const segmentSize = stats.sortedPrices.length;
        const isSmallSegment = segmentSize < MIN_SEGMENT_SIZE;

        const zScore = calculateZScore(row.priceNumeric, stats.mean, stats.stdDev);
        const percentile = calculatePercentile(row.priceNumeric, stats.sortedPrices);

        // Determine if outlier (using 1.5 IQR rule approximated with z-score)
        // Only mark as outlier if segment is large enough
        // Use z-score > 2.0 for outlier detection (~5% of data, more conservative than 1.5)
        const isOutlier = !isSmallSegment && Math.abs(zScore) > 2.0;
        let outlierType: 'cheap' | 'expensive' | null = null;
        if (isOutlier) {
          outlierType = zScore < 0 ? 'cheap' : 'expensive';
        }

        // Calculate deal score:
        // - For small segments: base on how much below segment average (z-score based)
        // - For large segments: use percentile
        let dealScore: number;
        if (isSmallSegment) {
          // Z-score based: negative z-score = good deal
          // Map z-score from [-2, 2] to [100, 0]
          dealScore = Math.max(0, Math.min(100, Math.round(50 - (zScore * 25))));
        } else {
          dealScore = Math.max(0, Math.min(100, Math.round(100 - percentile)));
        }

        allVehicles.push({
          id: createVehicleId(row.brand, row.model, row.trim, row.engine),
          brand: row.brand,
          brandId,
          model: row.model,
          trim: row.trim,
          engine: row.engine,
          fuel: row.fuel,
          transmission: row.transmission,
          vehicleClass,
          priceBand,
          price: row.priceNumeric,
          priceFormatted: row.priceRaw,
          dealScore,
          zScore: Math.round(zScore * 100) / 100,
          percentile,
          segmentAvg: Math.round(stats.mean),
          segmentSize,
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
