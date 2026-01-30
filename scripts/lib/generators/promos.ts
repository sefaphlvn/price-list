/**
 * Promos Generator
 * Tracks price drops and implicit discounts over time
 * Since suggestedPrice doesn't exist, we track historical price drops
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

export interface PriceDrop {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  trim: string;
  engine: string;
  fuel: string;
  transmission: string;
  currentPrice: number;
  currentPriceFormatted: string;
  peakPrice: number;
  peakPriceFormatted: string;
  peakDate: string;
  dropAmount: number;
  dropPercent: number;
  daysSincePeak: number;
  priceHistory: { date: string; price: number }[];
}

export interface RecentDrop {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  trim: string;
  engine: string;
  currentPrice: number;
  previousPrice: number;
  dropAmount: number;
  dropPercent: number;
  date: string;
  previousDate: string;
}

export interface PromosData {
  generatedAt: string;
  date: string;
  summary: {
    totalPriceDrops: number;
    totalRecentDrops: number;
    avgDropPercent: number;
    maxDropPercent: number;
    brandsWithDrops: number;
  };
  priceDrops: PriceDrop[];
  recentDrops: RecentDrop[];
  brandSummary: {
    brandId: string;
    brand: string;
    dropCount: number;
    avgDropPercent: number;
  }[];
}

function createVehicleKey(row: PriceListRow): string {
  return `${row.model}-${row.trim}-${row.engine}`.toLowerCase().replace(/\s+/g, '-');
}

// Normalize fuel type to Turkish (consistent with other generators)
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

function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function loadBrandData(dataDir: string, brandId: string, date: string): StoredData | null {
  const [year, month, day] = date.split('-');
  const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = safeParseJSON<StoredData | null>(filePath, null);
  return data;
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function generatePromos(): Promise<PromosData> {
  console.log('[generatePromos] Starting...');

  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    throw new Error('index.json not found');
  }

  const index = safeParseJSON<IndexData>(indexPath, { lastUpdated: '', brands: {} });

  const priceDrops: PriceDrop[] = [];
  const recentDrops: RecentDrop[] = [];
  const brandDropCounts = new Map<string, { brand: string; count: number; totalPercent: number }>();

  let latestDate = '';

  // Process each brand
  for (const [brandId, brandInfo] of Object.entries(index.brands)) {
    const availableDates = [...brandInfo.availableDates].sort().reverse(); // newest first
    if (availableDates.length < 2) {
      console.log(`  ${brandInfo.name}: not enough historical data`);
      continue;
    }

    if (!latestDate || brandInfo.latestDate > latestDate) {
      latestDate = brandInfo.latestDate;
    }

    // Track price history for each vehicle (last 90 days / available dates)
    const vehiclePriceHistory = new Map<string, { row: PriceListRow; history: { date: string; price: number }[] }>();

    // Load data for available dates (up to 90 days or 30 data points)
    const datesToCheck = availableDates.slice(0, 30);

    for (const date of datesToCheck) {
      const data = loadBrandData(dataDir, brandId, date);
      if (!data) continue;

      for (const row of data.rows) {
        const key = createVehicleKey(row);
        if (!vehiclePriceHistory.has(key)) {
          vehiclePriceHistory.set(key, { row, history: [] });
        }
        vehiclePriceHistory.get(key)!.history.push({ date, price: row.priceNumeric });
      }
    }

    // Analyze price history for each vehicle
    for (const [key, { row, history }] of vehiclePriceHistory.entries()) {
      if (history.length < 2) continue;

      // Sort history by date (oldest first)
      history.sort((a, b) => a.date.localeCompare(b.date));

      // Find peak price
      const peakEntry = history.reduce((max, entry) => entry.price > max.price ? entry : max, history[0]);
      const currentEntry = history[history.length - 1];

      // Check if current price is significantly lower than peak (>5% drop)
      if (currentEntry.price < peakEntry.price && peakEntry.price > 0) {
        const dropAmount = peakEntry.price - currentEntry.price;
        const dropPercent = peakEntry.price > 0 ? (dropAmount / peakEntry.price) * 100 : 0;

        if (dropPercent >= 5) {
          const daysSincePeak = daysBetween(peakEntry.date, currentEntry.date);

          priceDrops.push({
            id: `${brandId}-${key}`,
            brand: row.brand,
            brandId,
            model: row.model,
            trim: row.trim,
            engine: row.engine,
            fuel: normalizeFuel(row.fuel),
            transmission: row.transmission,
            currentPrice: currentEntry.price,
            currentPriceFormatted: formatPrice(currentEntry.price),
            peakPrice: peakEntry.price,
            peakPriceFormatted: formatPrice(peakEntry.price),
            peakDate: peakEntry.date,
            dropAmount,
            dropPercent: Math.round(dropPercent * 100) / 100,
            daysSincePeak,
            priceHistory: history.slice(-10), // Last 10 data points
          });

          // Track brand stats
          if (!brandDropCounts.has(brandId)) {
            brandDropCounts.set(brandId, { brand: row.brand, count: 0, totalPercent: 0 });
          }
          const brandStats = brandDropCounts.get(brandId)!;
          brandStats.count++;
          brandStats.totalPercent += dropPercent;
        }
      }

      // Check for recent drops (last data point vs previous)
      if (history.length >= 2) {
        const prev = history[history.length - 2];
        const curr = history[history.length - 1];

        if (curr.price < prev.price && prev.price > 0) {
          const dropAmount = prev.price - curr.price;
          const dropPercent = prev.price > 0 ? (dropAmount / prev.price) * 100 : 0;

          if (dropPercent >= 1) { // Even small recent drops are interesting
            recentDrops.push({
              id: `${brandId}-${key}-recent`,
              brand: row.brand,
              brandId,
              model: row.model,
              trim: row.trim,
              engine: row.engine,
              currentPrice: curr.price,
              previousPrice: prev.price,
              dropAmount,
              dropPercent: Math.round(dropPercent * 100) / 100,
              date: curr.date,
              previousDate: prev.date,
            });
          }
        }
      }
    }

    console.log(`  ${brandInfo.name}: processed ${vehiclePriceHistory.size} vehicles`);
  }

  // Sort and limit results
  priceDrops.sort((a, b) => b.dropPercent - a.dropPercent);
  recentDrops.sort((a, b) => b.dropPercent - a.dropPercent);

  const topPriceDrops = priceDrops.slice(0, 50);
  const topRecentDrops = recentDrops.slice(0, 30);

  // Build brand summary
  const brandSummary = Array.from(brandDropCounts.entries()).map(([brandId, stats]) => ({
    brandId,
    brand: stats.brand,
    dropCount: stats.count,
    avgDropPercent: stats.count > 0 ? Math.round((stats.totalPercent / stats.count) * 100) / 100 : 0,
  })).sort((a, b) => b.dropCount - a.dropCount);

  // Calculate summary stats
  const avgDropPercent = priceDrops.length > 0
    ? Math.round((priceDrops.reduce((sum, d) => sum + d.dropPercent, 0) / priceDrops.length) * 100) / 100
    : 0;
  const maxDropPercent = priceDrops.length > 0
    ? Math.max(...priceDrops.map(d => d.dropPercent))
    : 0;

  const promosData: PromosData = {
    generatedAt: new Date().toISOString(),
    date: latestDate,
    summary: {
      totalPriceDrops: priceDrops.length,
      totalRecentDrops: recentDrops.length,
      avgDropPercent,
      maxDropPercent: Math.round(maxDropPercent * 100) / 100,
      brandsWithDrops: brandDropCounts.size,
    },
    priceDrops: topPriceDrops,
    recentDrops: topRecentDrops,
    brandSummary,
  };

  // Save data
  const intelDir = path.join(dataDir, 'intel');
  fs.mkdirSync(intelDir, { recursive: true });
  const outputPath = path.join(intelDir, 'promos.json');
  fs.writeFileSync(outputPath, JSON.stringify(promosData, null, 2), 'utf-8');

  console.log(`[generatePromos] Saved to ${outputPath}`);
  console.log(`[generatePromos] Price drops: ${priceDrops.length}, Recent drops: ${recentDrops.length}`);

  return promosData;
}
