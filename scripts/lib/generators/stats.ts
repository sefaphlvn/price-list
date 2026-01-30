/**
 * Precomputed Statistics Generator
 * Creates pre-calculated statistics for the statistics page
 */

import * as fs from 'fs';
import * as path from 'path';
import { safeParseJSON } from '../errorLogger';
import { PriceListRow, StoredData, IndexData } from '../types';

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

interface OtvRateStats {
  rate: number;
  count: number;
  percentage: number;
  avgPrice: number;
}

interface OtvBrandStats {
  brand: string;
  avgOtvRate: number;
  count: number;
}

interface ModelYearStats {
  year: string;
  count: number;
  percentage: number;
  avgPrice: number;
}

interface FuelConsumptionStats {
  fuel: string;
  avgConsumption: number;
  count: number;
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
  // New extended stats
  otvStats?: {
    avgOtvRate: number;
    distribution: OtvRateStats[];
    byBrand: OtvBrandStats[];
  };
  modelYearStats?: {
    distribution: ModelYearStats[];
  };
  fuelConsumptionStats?: {
    byFuel: FuelConsumptionStats[];
  };
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

/**
 * Normalize fuel type names to consolidate similar values
 * e.g., "Benzin", "Petrol", "TSI" → "Benzin"
 */
function normalizeFuel(fuel: string): string {
  const f = fuel.toLowerCase().trim();

  // Empty or unknown
  if (!f) return 'Diger';

  // Hybrid variants (check first as they may contain "benzin" or "elektrik")
  if (f.includes('hybrid') || f.includes('hibrit') || f === 'benzin-elektrik' || f === 'elektrik - benzin' || f === 'elektrik-benzin') {
    if (f.includes('plug') || f.includes('phev')) {
      return 'Plug-in Hibrit';
    }
    if (f.includes('mild')) {
      return 'Hafif Hibrit';
    }
    return 'Hibrit';
  }

  // LPG/CNG (check before benzin as "benzin-lpg" should be LPG)
  if (f.includes('lpg') || f.includes('cng')) {
    return 'LPG';
  }

  // Electric (pure)
  if (f.includes('elektrik') || f.includes('electric') || f === 'ev' || f === 'bev') {
    return 'Elektrik';
  }

  // Diesel
  if (f.includes('dizel') || f.includes('diesel') || f.includes('tdi')) {
    return 'Dizel';
  }

  // Petrol/Benzin
  if (f.includes('benzin') || f.includes('petrol') || f.includes('tsi') || f.includes('tgi') || f.includes('tfsi')) {
    return 'Benzin';
  }

  return 'Diger';
}

/**
 * Normalize transmission names to consolidate similar values
 * e.g., "Manual", "Manuel", "Düz" → "Manuel"
 */
function normalizeTransmission(transmission: string): string {
  const t = transmission.toLowerCase().trim();

  // DSG specific (keep separate from generic automatic)
  if (t.includes('dsg')) {
    return 'DSG';
  }

  // DCT specific
  if (t.includes('dct')) {
    return 'DCT';
  }

  // CVT specific
  if (t.includes('cvt')) {
    return 'CVT';
  }

  // Tiptronic (automatic variant)
  if (t.includes('tiptronik') || t.includes('tiptronic')) {
    return 'Otomatik';
  }

  // Manual variants
  if (t.includes('manuel') || t.includes('manual') || t === 'mt' || t.includes('düz')) {
    return 'Manuel';
  }

  // Automatic variants (generic)
  if (t.includes('otomatik') || t.includes('automatic') || t === 'at' || t.includes('auto')) {
    return 'Otomatik';
  }

  // If nothing matches, return original with proper casing
  return transmission.trim() || 'Bilinmiyor';
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

  // Extended stats data collectors
  const otvData: { rate: number; price: number; brand: string }[] = [];
  const modelYearData: Map<string, number[]> = new Map();
  const fuelConsumptionData: Map<string, number[]> = new Map();

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

        // Fuel stats (normalized)
        const fuel = normalizeFuel(row.fuel || 'Bilinmiyor');
        if (!fuelData.has(fuel)) {
          fuelData.set(fuel, []);
        }
        fuelData.get(fuel)!.push(row.priceNumeric);

        // Transmission stats (normalized)
        const transmission = normalizeTransmission(row.transmission || 'Bilinmiyor');
        if (!transmissionData.has(transmission)) {
          transmissionData.set(transmission, []);
        }
        transmissionData.get(transmission)!.push(row.priceNumeric);

        // OTV stats (if available)
        if (row.otvRate !== undefined && row.otvRate > 0) {
          otvData.push({
            rate: row.otvRate,
            price: row.priceNumeric,
            brand: brandInfo.name,
          });
        }

        // Model year stats (if available)
        if (row.modelYear) {
          const year = String(row.modelYear);
          if (!modelYearData.has(year)) {
            modelYearData.set(year, []);
          }
          modelYearData.get(year)!.push(row.priceNumeric);
        }

        // Fuel consumption stats (if available)
        if (row.fuelConsumption) {
          // Parse consumption value (e.g., "5.2 L/100km" -> 5.2)
          const match = row.fuelConsumption.match(/(\d+[.,]?\d*)/);
          if (match) {
            const consumption = parseFloat(match[1].replace(',', '.'));
            if (!isNaN(consumption) && consumption > 0) {
              if (!fuelConsumptionData.has(fuel)) {
                fuelConsumptionData.set(fuel, []);
              }
              fuelConsumptionData.get(fuel)!.push(consumption);
            }
          }
        }
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

  // Calculate OTV stats (if we have data)
  let otvStats: PrecomputedStats['otvStats'] = undefined;
  if (otvData.length > 0) {
    const avgOtvRate = otvData.reduce((sum, d) => sum + d.rate, 0) / otvData.length;

    // Group by OTV rate
    const rateGroups = new Map<number, { prices: number[]; count: number }>();
    const brandOtvData = new Map<string, { rates: number[]; count: number }>();

    for (const d of otvData) {
      // Rate distribution
      if (!rateGroups.has(d.rate)) {
        rateGroups.set(d.rate, { prices: [], count: 0 });
      }
      const group = rateGroups.get(d.rate)!;
      group.prices.push(d.price);
      group.count++;

      // Brand OTV
      if (!brandOtvData.has(d.brand)) {
        brandOtvData.set(d.brand, { rates: [], count: 0 });
      }
      const brandGroup = brandOtvData.get(d.brand)!;
      brandGroup.rates.push(d.rate);
      brandGroup.count++;
    }

    const distribution: OtvRateStats[] = Array.from(rateGroups.entries())
      .map(([rate, data]) => ({
        rate,
        count: data.count,
        percentage: Math.round((data.count / otvData.length) * 100 * 10) / 10,
        avgPrice: data.prices.length > 0
          ? Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length)
          : 0,
      }))
      .sort((a, b) => a.rate - b.rate);

    const byBrand: OtvBrandStats[] = Array.from(brandOtvData.entries())
      .map(([brand, data]) => ({
        brand,
        avgOtvRate: Math.round((data.rates.reduce((a, b) => a + b, 0) / data.rates.length) * 10) / 10,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);

    otvStats = {
      avgOtvRate: Math.round(avgOtvRate * 10) / 10,
      distribution,
      byBrand,
    };

    console.log(`  OTV stats: ${otvData.length} vehicles with OTV data, avg rate ${otvStats.avgOtvRate}%`);
  }

  // Calculate model year stats (if we have data)
  let modelYearStats: PrecomputedStats['modelYearStats'] = undefined;
  if (modelYearData.size > 0) {
    const totalWithYear = Array.from(modelYearData.values()).reduce((sum, prices) => sum + prices.length, 0);

    const distribution: ModelYearStats[] = Array.from(modelYearData.entries())
      .map(([year, prices]) => ({
        year,
        count: prices.length,
        percentage: Math.round((prices.length / totalWithYear) * 100 * 10) / 10,
        avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      }))
      .sort((a, b) => b.year.localeCompare(a.year)); // Sort by year descending

    modelYearStats = { distribution };
    console.log(`  Model year stats: ${totalWithYear} vehicles with model year data`);
  }

  // Calculate fuel consumption stats (if we have data)
  let fuelConsumptionStats: PrecomputedStats['fuelConsumptionStats'] = undefined;
  if (fuelConsumptionData.size > 0) {
    const byFuel: FuelConsumptionStats[] = Array.from(fuelConsumptionData.entries())
      .map(([fuel, consumptions]) => ({
        fuel,
        avgConsumption: Math.round((consumptions.reduce((a, b) => a + b, 0) / consumptions.length) * 10) / 10,
        count: consumptions.length,
      }))
      .sort((a, b) => b.count - a.count);

    fuelConsumptionStats = { byFuel };
    console.log(`  Fuel consumption stats: ${byFuel.length} fuel types with consumption data`);
  }

  const stats: PrecomputedStats = {
    generatedAt: new Date().toISOString(),
    totalVehicles: allPrices.length,
    overallStats,
    brandStats,
    fuelStats,
    transmissionStats,
    priceSegments,
    ...(otvStats && { otvStats }),
    ...(modelYearStats && { modelYearStats }),
    ...(fuelConsumptionStats && { fuelConsumptionStats }),
  };

  // Save stats
  const statsDir = path.join(dataDir, 'stats');
  fs.mkdirSync(statsDir, { recursive: true });
  const outputPath = path.join(statsDir, 'precomputed.json');
  fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2), 'utf-8');
  console.log(`[generateStats] Saved to ${outputPath}`);

  return stats;
}
