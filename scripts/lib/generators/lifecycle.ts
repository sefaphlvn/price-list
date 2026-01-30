/**
 * Lifecycle Generator
 * Tracks model year transitions, entry price changes, and stale models
 */

import * as fs from 'fs';
import * as path from 'path';
import { safeParseJSON } from '../errorLogger';
import { PriceListRow, StoredData, IndexData } from '../types';

export interface ModelYearTransition {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  oldYear: string;
  newYear: string;
  oldEntryPrice: number;
  newEntryPrice: number;
  priceDelta: number;
  priceDeltaPercent: number;
  transitionDate: string;
  trimCount: number;
}

export interface EntryPriceDelta {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  currentEntryPrice: number;
  previousEntryPrice: number;
  delta: number;
  deltaPercent: number;
  currentDate: string;
  previousDate: string;
  daysBetween: number;
}

export interface StaleModel {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  lastUpdateDate: string;
  daysSinceUpdate: number;
  currentEntryPrice: number;
  trimCount: number;
}

export interface ModelInfo {
  brand: string;
  brandId: string;
  model: string;
  entryPrice: number;
  topPrice: number;
  trimCount: number;
  fuelTypes: string[];
  lastUpdated: string;
}

export interface LifecycleData {
  generatedAt: string;
  date: string;
  summary: {
    totalModels: number;
    totalTransitions: number;
    totalStaleModels: number;
    avgEntryPriceDelta: number;
  };
  modelYearTransitions: ModelYearTransition[];
  entryPriceDeltas: EntryPriceDelta[];
  staleModels: StaleModel[];
  allModels: ModelInfo[];
}

function extractModelYear(modelName: string): string | null {
  // Match patterns like "2025", "MY2025", "2025 Model", etc.
  const yearMatch = modelName.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    return yearMatch[1];
  }
  return null;
}

function getBaseModelName(modelName: string): string {
  // Remove year from model name for comparison
  return modelName.replace(/\b20\d{2}\b/g, '').trim().replace(/\s+/g, ' ');
}

function loadBrandData(dataDir: string, brandId: string, date: string): StoredData | null {
  const [year, month, day] = date.split('-');
  const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return safeParseJSON<StoredData | null>(filePath, null);
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Normalize fuel type to Turkish (consistent with stats.ts and gaps.ts)
function normalizeFuel(fuel: string): string {
  const f = fuel.toLowerCase().trim();

  // Empty or unknown
  if (!f) return 'Diger';

  // Hybrid variants (check first as they may contain "benzin" or "elektrik")
  if (f.includes('hybrid') || f.includes('hibrit') || f === 'benzin-elektrik') {
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

export async function generateLifecycle(): Promise<LifecycleData> {
  console.log('[generateLifecycle] Starting...');

  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    throw new Error('index.json not found');
  }

  const index = safeParseJSON<IndexData>(indexPath, { lastUpdated: '', brands: {} });

  const modelYearTransitions: ModelYearTransition[] = [];
  const entryPriceDeltas: EntryPriceDelta[] = [];
  const staleModels: StaleModel[] = [];
  const allModels: ModelInfo[] = [];

  let latestDate = '';
  const today = new Date();

  // Process each brand
  for (const [brandId, brandInfo] of Object.entries(index.brands)) {
    const availableDates = [...brandInfo.availableDates].sort().reverse(); // newest first
    if (availableDates.length < 1) continue;

    if (!latestDate || brandInfo.latestDate > latestDate) {
      latestDate = brandInfo.latestDate;
    }

    // Load current data
    const currentData = loadBrandData(dataDir, brandId, brandInfo.latestDate);
    if (!currentData) continue;

    // Group by model
    const modelGroups = new Map<string, PriceListRow[]>();
    for (const row of currentData.rows) {
      const baseModel = getBaseModelName(row.model);
      if (!modelGroups.has(baseModel)) {
        modelGroups.set(baseModel, []);
      }
      modelGroups.get(baseModel)!.push(row);
    }

    // Analyze each model
    for (const [baseModel, rows] of modelGroups.entries()) {
      const prices = rows.map(r => r.priceNumeric).sort((a, b) => a - b);
      const entryPrice = prices[0];
      const topPrice = prices[prices.length - 1];
      const fuelTypes = [...new Set(rows.map(r => normalizeFuel(r.fuel)))];

      allModels.push({
        brand: rows[0].brand,
        brandId,
        model: baseModel,
        entryPrice,
        topPrice,
        trimCount: rows.length,
        fuelTypes,
        lastUpdated: brandInfo.latestDate,
      });

      // Check for model year in any trim
      const years = rows.map(r => extractModelYear(r.model)).filter(Boolean) as string[];
      const uniqueYears = [...new Set(years)].sort();

      // If we have multiple years in current data, that's interesting
      if (uniqueYears.length > 1) {
        const oldYear = uniqueYears[0];
        const newYear = uniqueYears[uniqueYears.length - 1];

        const oldYearRows = rows.filter(r => extractModelYear(r.model) === oldYear);
        const newYearRows = rows.filter(r => extractModelYear(r.model) === newYear);

        if (oldYearRows.length > 0 && newYearRows.length > 0) {
          const oldEntryPrice = Math.min(...oldYearRows.map(r => r.priceNumeric));
          const newEntryPrice = Math.min(...newYearRows.map(r => r.priceNumeric));
          const priceDelta = newEntryPrice - oldEntryPrice;
          const priceDeltaPercent = oldEntryPrice > 0 ? (priceDelta / oldEntryPrice) * 100 : 0;

          modelYearTransitions.push({
            id: `${brandId}-${baseModel}-${oldYear}-${newYear}`,
            brand: rows[0].brand,
            brandId,
            model: baseModel,
            oldYear,
            newYear,
            oldEntryPrice,
            newEntryPrice,
            priceDelta,
            priceDeltaPercent: Math.round(priceDeltaPercent * 100) / 100,
            transitionDate: brandInfo.latestDate,
            trimCount: newYearRows.length,
          });
        }
      }
    }

    // Compare with previous data for entry price deltas
    if (availableDates.length >= 2) {
      // Find data from ~30 days ago
      const targetDate = availableDates.find((d, i) => i > 0 && daysBetween(d, brandInfo.latestDate) >= 7);

      if (targetDate) {
        const previousData = loadBrandData(dataDir, brandId, targetDate);
        if (previousData) {
          const prevModelPrices = new Map<string, number>();
          for (const row of previousData.rows) {
            const baseModel = getBaseModelName(row.model);
            const existing = prevModelPrices.get(baseModel);
            if (!existing || row.priceNumeric < existing) {
              prevModelPrices.set(baseModel, row.priceNumeric);
            }
          }

          for (const [baseModel, rows] of modelGroups.entries()) {
            const prices = rows.map(r => r.priceNumeric);
            const currentEntry = prices.length > 0 ? Math.min(...prices) : 0;
            const previousEntry = prevModelPrices.get(baseModel);

            if (previousEntry && currentEntry !== previousEntry) {
              const delta = currentEntry - previousEntry;
              const deltaPercent = previousEntry > 0 ? (delta / previousEntry) * 100 : 0;

              if (Math.abs(deltaPercent) >= 1) { // Only significant changes
                entryPriceDeltas.push({
                  id: `${brandId}-${baseModel}-entry`,
                  brand: rows[0].brand,
                  brandId,
                  model: baseModel,
                  currentEntryPrice: currentEntry,
                  previousEntryPrice: previousEntry,
                  delta,
                  deltaPercent: Math.round(deltaPercent * 100) / 100,
                  currentDate: brandInfo.latestDate,
                  previousDate: targetDate,
                  daysBetween: daysBetween(targetDate, brandInfo.latestDate),
                });
              }
            }
          }
        }
      }
    }

    // Check for stale models (no updates in 14+ days)
    const daysSinceUpdate = daysBetween(brandInfo.latestDate, today.toISOString().split('T')[0]);
    if (daysSinceUpdate >= 14) {
      for (const [baseModel, rows] of modelGroups.entries()) {
        const rowPrices = rows.map(r => r.priceNumeric);
        const entryPrice = rowPrices.length > 0 ? Math.min(...rowPrices) : 0;
        staleModels.push({
          id: `${brandId}-${baseModel}-stale`,
          brand: rows[0].brand,
          brandId,
          model: baseModel,
          lastUpdateDate: brandInfo.latestDate,
          daysSinceUpdate,
          currentEntryPrice: entryPrice,
          trimCount: rows.length,
        });
      }
    }

    console.log(`  ${brandInfo.name}: ${modelGroups.size} models analyzed`);
  }

  // Sort results
  modelYearTransitions.sort((a, b) => b.priceDeltaPercent - a.priceDeltaPercent);
  entryPriceDeltas.sort((a, b) => Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent));
  staleModels.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
  allModels.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));

  // Calculate summary
  const avgEntryPriceDelta = entryPriceDeltas.length > 0
    ? Math.round((entryPriceDeltas.reduce((sum, d) => sum + d.deltaPercent, 0) / entryPriceDeltas.length) * 100) / 100
    : 0;

  const lifecycleData: LifecycleData = {
    generatedAt: new Date().toISOString(),
    date: latestDate,
    summary: {
      totalModels: allModels.length,
      totalTransitions: modelYearTransitions.length,
      totalStaleModels: staleModels.length,
      avgEntryPriceDelta,
    },
    modelYearTransitions: modelYearTransitions.slice(0, 20),
    entryPriceDeltas: entryPriceDeltas.slice(0, 30),
    staleModels: staleModels.slice(0, 20),
    allModels,
  };

  // Save data
  const intelDir = path.join(dataDir, 'intel');
  fs.mkdirSync(intelDir, { recursive: true });
  const outputPath = path.join(intelDir, 'lifecycle.json');
  fs.writeFileSync(outputPath, JSON.stringify(lifecycleData, null, 2), 'utf-8');

  console.log(`[generateLifecycle] Saved to ${outputPath}`);
  console.log(`[generateLifecycle] Models: ${allModels.length}, Transitions: ${modelYearTransitions.length}, Stale: ${staleModels.length}`);

  return lifecycleData;
}
