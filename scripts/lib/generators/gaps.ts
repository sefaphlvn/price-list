/**
 * Gaps Generator
 * Creates segment gap analysis data - identifies market opportunities
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

export interface GapCell {
  segment: string;
  fuel: string;
  transmission: string;
  priceRange: string;
  priceRangeMin: number;
  priceRangeMax: number;
  vehicleCount: number;
  brands: string[];
  avgPrice: number;
  hasGap: boolean;
  opportunityScore: number;
}

export interface SegmentSummary {
  segment: string;
  totalVehicles: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  brands: string[];
  fuelTypes: string[];
}

export interface GapsData {
  generatedAt: string;
  date: string;
  summary: {
    totalSegments: number;
    totalGaps: number;
    totalOpportunities: number;
    avgOpportunityScore: number;
  };
  segments: SegmentSummary[];
  heatmapData: GapCell[];
  topOpportunities: GapCell[];
  priceRanges: { label: string; min: number; max: number }[];
}

// Segment detection from model name
function detectSegment(model: string, brand: string): string {
  const modelLower = model.toLowerCase();
  const brandLower = brand.toLowerCase();

  // SUV patterns
  if (/suv|crossover|4x4|off-?road/i.test(modelLower) ||
      /tiguan|touareg|t-roc|t-cross|taigo/i.test(modelLower) ||
      /karoq|kodiaq|kamiq|elroq|enyaq/i.test(modelLower) ||
      /captur|kadjar|austral|koleos|arkana|symbioz/i.test(modelLower) ||
      /tucson|kona|santa|bayon|ioniq 5/i.test(modelLower) ||
      /c-hr|rav4|land cruiser|yaris cross|corolla cross/i.test(modelLower)) {
    // Size detection
    if (/touareg|kodiaq|koleos|santa fe|land cruiser|enyaq/i.test(modelLower)) {
      return 'SUV-Large';
    }
    if (/tiguan|karoq|tucson|rav4|kadjar|austral|arkana/i.test(modelLower)) {
      return 'SUV-Medium';
    }
    return 'SUV-Compact';
  }

  // Sedan patterns
  if (/sedan|saloon/i.test(modelLower) ||
      /passat|arteon|jetta/i.test(modelLower) ||
      /superb|octavia/i.test(modelLower) ||
      /talisman|megane.*sedan/i.test(modelLower) ||
      /elantra|sonata|i30/i.test(modelLower) ||
      /camry|corolla(?!.*cross)/i.test(modelLower)) {
    if (/passat|arteon|superb|talisman|sonata|camry/i.test(modelLower)) {
      return 'Sedan-D';
    }
    return 'Sedan-C';
  }

  // Hatchback patterns
  if (/hatch|golf|polo|id\.\d/i.test(modelLower) ||
      /fabia|scala|elroq/i.test(modelLower) ||
      /clio|megane(?!.*sedan)|zoe/i.test(modelLower) ||
      /i20|i30|ioniq/i.test(modelLower) ||
      /yaris(?!.*cross)|corolla(?!.*cross).*hb|auris/i.test(modelLower)) {
    if (/golf|scala|megane|i30|corolla/i.test(modelLower)) {
      return 'Hatchback-C';
    }
    return 'Hatchback-B';
  }

  // MPV/Van patterns
  if (/mpv|van|touran|caddy|multivan|caravelle|transporter/i.test(modelLower) ||
      /sharan|alhambra/i.test(modelLower) ||
      /scenic|kangoo|trafic|master/i.test(modelLower) ||
      /staria/i.test(modelLower)) {
    return 'MPV';
  }

  // Electric specific
  if (/id\.\d|e-|electric|ev|bev/i.test(modelLower) ||
      /enyaq|elroq/i.test(modelLower) ||
      /zoe|megane e-tech/i.test(modelLower) ||
      /ioniq 5|ioniq 6|kona electric/i.test(modelLower)) {
    return 'Electric';
  }

  // Pickup
  if (/pickup|pick-up|amarok|hilux/i.test(modelLower)) {
    return 'Pickup';
  }

  // Default based on price heuristics (will be refined)
  return 'Other';
}

// Normalize fuel type
function normalizeFuel(fuel: string): string {
  const fuelLower = fuel.toLowerCase();
  if (fuelLower.includes('elektrik') || fuelLower.includes('electric') || fuelLower.includes('ev')) {
    return 'Electric';
  }
  if (fuelLower.includes('hybrid') || fuelLower.includes('hibrit')) {
    if (fuelLower.includes('plug') || fuelLower.includes('phev')) {
      return 'PHEV';
    }
    return 'Hybrid';
  }
  if (fuelLower.includes('dizel') || fuelLower.includes('diesel') || fuelLower.includes('tdi')) {
    return 'Diesel';
  }
  if (fuelLower.includes('benzin') || fuelLower.includes('petrol') || fuelLower.includes('tsi') || fuelLower.includes('tgi')) {
    return 'Petrol';
  }
  if (fuelLower.includes('lpg') || fuelLower.includes('cng')) {
    return 'LPG/CNG';
  }
  return 'Other';
}

// Normalize transmission
function normalizeTransmission(transmission: string): string {
  const transLower = transmission.toLowerCase();
  if (transLower.includes('otomatik') || transLower.includes('automatic') ||
      transLower.includes('dsg') || transLower.includes('cvt') ||
      transLower.includes('at') || transLower.includes('auto')) {
    return 'Automatic';
  }
  if (transLower.includes('manuel') || transLower.includes('manual') || transLower.includes('mt')) {
    return 'Manual';
  }
  return 'Other';
}

// Price range buckets (in millions TL)
const PRICE_RANGES = [
  { label: '0-500K', min: 0, max: 500_000 },
  { label: '500K-1M', min: 500_000, max: 1_000_000 },
  { label: '1M-1.5M', min: 1_000_000, max: 1_500_000 },
  { label: '1.5M-2M', min: 1_500_000, max: 2_000_000 },
  { label: '2M-3M', min: 2_000_000, max: 3_000_000 },
  { label: '3M-5M', min: 3_000_000, max: 5_000_000 },
  { label: '5M+', min: 5_000_000, max: 100_000_000 },
];

function getPriceRange(price: number): typeof PRICE_RANGES[0] | null {
  return PRICE_RANGES.find(r => price >= r.min && price < r.max) || null;
}

function loadLatestBrandData(dataDir: string, brandId: string, date: string): StoredData | null {
  const [year, month, day] = date.split('-');
  const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export async function generateGaps(): Promise<GapsData> {
  console.log('[generateGaps] Starting...');

  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    throw new Error('index.json not found');
  }

  const index: IndexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

  // Collect all vehicles with segment info
  interface ProcessedVehicle {
    brand: string;
    model: string;
    segment: string;
    fuel: string;
    transmission: string;
    price: number;
    priceRange: typeof PRICE_RANGES[0];
  }

  const vehicles: ProcessedVehicle[] = [];
  let latestDate = '';

  for (const [brandId, brandInfo] of Object.entries(index.brands)) {
    const data = loadLatestBrandData(dataDir, brandId, brandInfo.latestDate);
    if (!data) continue;

    if (!latestDate || brandInfo.latestDate > latestDate) {
      latestDate = brandInfo.latestDate;
    }

    for (const row of data.rows) {
      const priceRange = getPriceRange(row.priceNumeric);
      if (!priceRange) continue;

      vehicles.push({
        brand: row.brand,
        model: row.model,
        segment: detectSegment(row.model, row.brand),
        fuel: normalizeFuel(row.fuel),
        transmission: normalizeTransmission(row.transmission),
        price: row.priceNumeric,
        priceRange,
      });
    }
  }

  console.log(`[generateGaps] Processed ${vehicles.length} vehicles`);

  // Build segment summaries
  const segmentMap = new Map<string, ProcessedVehicle[]>();
  for (const v of vehicles) {
    if (!segmentMap.has(v.segment)) {
      segmentMap.set(v.segment, []);
    }
    segmentMap.get(v.segment)!.push(v);
  }

  const segments: SegmentSummary[] = [];
  for (const [segment, segVehicles] of segmentMap.entries()) {
    const prices = segVehicles.map(v => v.price);
    const brands = [...new Set(segVehicles.map(v => v.brand))];
    const fuels = [...new Set(segVehicles.map(v => v.fuel))];

    segments.push({
      segment,
      totalVehicles: segVehicles.length,
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      brands,
      fuelTypes: fuels,
    });
  }
  segments.sort((a, b) => b.totalVehicles - a.totalVehicles);

  // Build heatmap data (segment x fuel x transmission x priceRange)
  const heatmapData: GapCell[] = [];
  const allSegments = [...segmentMap.keys()].filter(s => s !== 'Other');
  const allFuels = ['Petrol', 'Diesel', 'Hybrid', 'PHEV', 'Electric'];
  const allTransmissions = ['Automatic', 'Manual'];

  // Calculate market density for opportunity scoring
  const totalVehicles = vehicles.length;
  const segmentPopularity = new Map<string, number>();
  for (const seg of allSegments) {
    segmentPopularity.set(seg, totalVehicles > 0 ? (segmentMap.get(seg)?.length || 0) / totalVehicles : 0);
  }

  for (const segment of allSegments) {
    for (const fuel of allFuels) {
      for (const transmission of allTransmissions) {
        for (const priceRange of PRICE_RANGES) {
          const matchingVehicles = vehicles.filter(v =>
            v.segment === segment &&
            v.fuel === fuel &&
            v.transmission === transmission &&
            v.priceRange.label === priceRange.label
          );

          const vehicleCount = matchingVehicles.length;
          const brands = [...new Set(matchingVehicles.map(v => v.brand))];
          const avgPrice = matchingVehicles.length > 0
            ? Math.round(matchingVehicles.reduce((a, b) => a + b.price, 0) / matchingVehicles.length)
            : 0;

          // Determine if this is a gap (no or few vehicles)
          const hasGap = vehicleCount < 2;

          // Calculate opportunity score
          // Higher score for: popular segments, common fuel/transmission combos, mid-price ranges
          let opportunityScore = 0;
          if (hasGap) {
            const segPop = segmentPopularity.get(segment) || 0;
            const fuelPopularity = fuel === 'Petrol' ? 0.4 : fuel === 'Hybrid' ? 0.3 : fuel === 'Diesel' ? 0.2 : 0.1;
            const transPopularity = transmission === 'Automatic' ? 0.7 : 0.3;
            const pricePopularity = priceRange.label.includes('1M') || priceRange.label.includes('2M') ? 0.4 : 0.2;

            opportunityScore = Math.round((segPop * 40 + fuelPopularity * 25 + transPopularity * 20 + pricePopularity * 15) * 100) / 100;
          }

          heatmapData.push({
            segment,
            fuel,
            transmission,
            priceRange: priceRange.label,
            priceRangeMin: priceRange.min,
            priceRangeMax: priceRange.max,
            vehicleCount,
            brands,
            avgPrice,
            hasGap,
            opportunityScore,
          });
        }
      }
    }
  }

  // Get top opportunities
  const topOpportunities = heatmapData
    .filter(cell => cell.hasGap && cell.opportunityScore > 0)
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 20);

  const totalGaps = heatmapData.filter(c => c.hasGap).length;
  const opportunitiesWithScore = heatmapData.filter(c => c.opportunityScore > 0);
  const avgOpportunityScore = opportunitiesWithScore.length > 0
    ? Math.round((opportunitiesWithScore.reduce((a, b) => a + b.opportunityScore, 0) / opportunitiesWithScore.length) * 100) / 100
    : 0;

  const gapsData: GapsData = {
    generatedAt: new Date().toISOString(),
    date: latestDate,
    summary: {
      totalSegments: allSegments.length,
      totalGaps,
      totalOpportunities: topOpportunities.length,
      avgOpportunityScore,
    },
    segments,
    heatmapData,
    topOpportunities,
    priceRanges: PRICE_RANGES,
  };

  // Save data
  const intelDir = path.join(dataDir, 'intel');
  fs.mkdirSync(intelDir, { recursive: true });
  const outputPath = path.join(intelDir, 'gaps.json');
  fs.writeFileSync(outputPath, JSON.stringify(gapsData, null, 2), 'utf-8');

  console.log(`[generateGaps] Saved to ${outputPath}`);
  console.log(`[generateGaps] Segments: ${allSegments.length}, Gaps: ${totalGaps}, Opportunities: ${topOpportunities.length}`);

  return gapsData;
}
