/**
 * Events Generator
 * Creates price change events, volatility metrics, and big moves data for Market Pulse
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

export interface PriceEvent {
  id: string;
  type: 'new' | 'removed' | 'price_increase' | 'price_decrease';
  vehicleId: string;
  brand: string;
  brandId: string;
  model: string;
  trim: string;
  engine: string;
  fuel: string;
  transmission: string;
  oldPrice?: number;
  newPrice?: number;
  oldPriceFormatted?: string;
  newPriceFormatted?: string;
  priceChange?: number;
  priceChangePercent?: number;
  date: string;
  previousDate?: string;
}

export interface VolatilityMetric {
  id: string;
  name: string;
  changeCount: number;
  avgChange: number;
  avgChangePercent: number;
  increaseCount: number;
  decreaseCount: number;
}

export interface EventsData {
  generatedAt: string;
  date: string;
  previousDate: string;
  summary: {
    totalEvents: number;
    newVehicles: number;
    removedVehicles: number;
    priceIncreases: number;
    priceDecreases: number;
    avgPriceChange: number;
    avgPriceChangePercent: number;
  };
  events: PriceEvent[];
  volatility: {
    byBrand: VolatilityMetric[];
    byModel: VolatilityMetric[];
  };
  bigMoves: {
    topIncreases: PriceEvent[];
    topDecreases: PriceEvent[];
  };
}

function createVehicleId(brand: string, model: string, trim: string, engine: string): string {
  return `${brand}-${model}-${trim}-${engine}`.toLowerCase().replace(/\s+/g, '-');
}

function createRowKey(row: PriceListRow): string {
  return `${row.model}-${row.trim}-${row.engine}`.toLowerCase().replace(/\s+/g, '-');
}

function loadBrandData(dataDir: string, brandId: string, date: string): StoredData | null {
  const [year, month, day] = date.split('-');
  const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function findPreviousDate(availableDates: string[], currentDate: string): string | null {
  const sorted = [...availableDates].sort().reverse();
  const currentIndex = sorted.indexOf(currentDate);
  if (currentIndex === -1 || currentIndex === sorted.length - 1) {
    return null;
  }
  return sorted[currentIndex + 1];
}

export async function generateEvents(): Promise<EventsData> {
  console.log('[generateEvents] Starting...');

  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    throw new Error('index.json not found');
  }

  const index: IndexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const events: PriceEvent[] = [];
  const brandStats: Map<string, { changes: number; totalAbsChange: number; totalChangePercent: number; increases: number; decreases: number }> = new Map();
  const modelStats: Map<string, { name: string; changes: number; totalAbsChange: number; totalChangePercent: number; increases: number; decreases: number }> = new Map();

  let latestDate = '';
  let previousDate = '';

  // Process each brand
  for (const [brandId, brandInfo] of Object.entries(index.brands)) {
    const currentDate = brandInfo.latestDate;
    const prevDate = findPreviousDate(brandInfo.availableDates, currentDate);

    if (!prevDate) {
      console.log(`  ${brandInfo.name}: no previous date available`);
      continue;
    }

    if (!latestDate || currentDate > latestDate) {
      latestDate = currentDate;
      previousDate = prevDate;
    }

    const currentData = loadBrandData(dataDir, brandId, currentDate);
    const previousData = loadBrandData(dataDir, brandId, prevDate);

    if (!currentData || !previousData) {
      console.log(`  ${brandInfo.name}: missing data files`);
      continue;
    }

    // Create maps for comparison
    const currentMap = new Map<string, PriceListRow>();
    const previousMap = new Map<string, PriceListRow>();

    for (const row of currentData.rows) {
      currentMap.set(createRowKey(row), row);
    }

    for (const row of previousData.rows) {
      previousMap.set(createRowKey(row), row);
    }

    // Initialize brand stats
    if (!brandStats.has(brandId)) {
      brandStats.set(brandId, { changes: 0, totalAbsChange: 0, totalChangePercent: 0, increases: 0, decreases: 0 });
    }
    const brandStat = brandStats.get(brandId)!;

    // Find new vehicles
    for (const [key, row] of currentMap.entries()) {
      if (!previousMap.has(key)) {
        events.push({
          id: `${brandId}-${key}-new-${currentDate}`,
          type: 'new',
          vehicleId: createVehicleId(row.brand, row.model, row.trim, row.engine),
          brand: row.brand,
          brandId,
          model: row.model,
          trim: row.trim,
          engine: row.engine,
          fuel: row.fuel,
          transmission: row.transmission,
          newPrice: row.priceNumeric,
          newPriceFormatted: row.priceRaw,
          date: currentDate,
        });
      }
    }

    // Find removed vehicles
    for (const [key, row] of previousMap.entries()) {
      if (!currentMap.has(key)) {
        events.push({
          id: `${brandId}-${key}-removed-${currentDate}`,
          type: 'removed',
          vehicleId: createVehicleId(row.brand, row.model, row.trim, row.engine),
          brand: row.brand,
          brandId,
          model: row.model,
          trim: row.trim,
          engine: row.engine,
          fuel: row.fuel,
          transmission: row.transmission,
          oldPrice: row.priceNumeric,
          oldPriceFormatted: row.priceRaw,
          date: currentDate,
          previousDate: prevDate,
        });
      }
    }

    // Find price changes
    for (const [key, currentRow] of currentMap.entries()) {
      const previousRow = previousMap.get(key);
      if (previousRow && currentRow.priceNumeric !== previousRow.priceNumeric) {
        const change = currentRow.priceNumeric - previousRow.priceNumeric;
        const changePercent = previousRow.priceNumeric > 0
          ? (change / previousRow.priceNumeric) * 100
          : 0;

        const eventType = change > 0 ? 'price_increase' : 'price_decrease';

        events.push({
          id: `${brandId}-${key}-${eventType}-${currentDate}`,
          type: eventType,
          vehicleId: createVehicleId(currentRow.brand, currentRow.model, currentRow.trim, currentRow.engine),
          brand: currentRow.brand,
          brandId,
          model: currentRow.model,
          trim: currentRow.trim,
          engine: currentRow.engine,
          fuel: currentRow.fuel,
          transmission: currentRow.transmission,
          oldPrice: previousRow.priceNumeric,
          newPrice: currentRow.priceNumeric,
          oldPriceFormatted: previousRow.priceRaw,
          newPriceFormatted: currentRow.priceRaw,
          priceChange: change,
          priceChangePercent: Math.round(changePercent * 100) / 100,
          date: currentDate,
          previousDate: prevDate,
        });

        // Update brand stats
        brandStat.changes++;
        brandStat.totalAbsChange += Math.abs(change); // TL amount
        brandStat.totalChangePercent += Math.abs(changePercent); // Percentage
        if (change > 0) {
          brandStat.increases++;
        } else {
          brandStat.decreases++;
        }

        // Update model stats
        const modelKey = `${brandId}-${currentRow.model}`;
        if (!modelStats.has(modelKey)) {
          modelStats.set(modelKey, {
            name: `${currentRow.brand} ${currentRow.model}`,
            changes: 0,
            totalAbsChange: 0,
            totalChangePercent: 0,
            increases: 0,
            decreases: 0,
          });
        }
        const modelStat = modelStats.get(modelKey)!;
        modelStat.changes++;
        modelStat.totalAbsChange += Math.abs(change); // TL amount
        modelStat.totalChangePercent += Math.abs(changePercent); // Percentage
        if (change > 0) {
          modelStat.increases++;
        } else {
          modelStat.decreases++;
        }
      }
    }

    console.log(`  ${brandInfo.name}: processed (${currentData.rowCount} current, ${previousData.rowCount} previous)`);
  }

  // Calculate summary
  const priceChangeEvents = events.filter(e => e.type === 'price_increase' || e.type === 'price_decrease');
  const totalPriceChange = priceChangeEvents.reduce((sum, e) => sum + (e.priceChange || 0), 0);
  const totalPriceChangePercent = priceChangeEvents.reduce((sum, e) => sum + (e.priceChangePercent || 0), 0);

  const summary = {
    totalEvents: events.length,
    newVehicles: events.filter(e => e.type === 'new').length,
    removedVehicles: events.filter(e => e.type === 'removed').length,
    priceIncreases: events.filter(e => e.type === 'price_increase').length,
    priceDecreases: events.filter(e => e.type === 'price_decrease').length,
    avgPriceChange: priceChangeEvents.length > 0 ? Math.round(totalPriceChange / priceChangeEvents.length) : 0,
    avgPriceChangePercent: priceChangeEvents.length > 0
      ? Math.round((totalPriceChangePercent / priceChangeEvents.length) * 100) / 100
      : 0,
  };

  // Build volatility metrics
  const byBrand: VolatilityMetric[] = [];
  for (const [brandId, stats] of brandStats.entries()) {
    if (stats.changes > 0) {
      byBrand.push({
        id: brandId,
        name: index.brands[brandId]?.name || brandId,
        changeCount: stats.changes,
        avgChange: Math.round(stats.totalAbsChange / stats.changes), // Average TL change
        avgChangePercent: Math.round((stats.totalChangePercent / stats.changes) * 100) / 100, // Average % change
        increaseCount: stats.increases,
        decreaseCount: stats.decreases,
      });
    }
  }
  byBrand.sort((a, b) => b.changeCount - a.changeCount);

  const byModel: VolatilityMetric[] = [];
  for (const [modelId, stats] of modelStats.entries()) {
    if (stats.changes > 0) {
      byModel.push({
        id: modelId,
        name: stats.name,
        changeCount: stats.changes,
        avgChange: Math.round(stats.totalAbsChange / stats.changes), // Average TL change
        avgChangePercent: Math.round((stats.totalChangePercent / stats.changes) * 100) / 100, // Average % change
        increaseCount: stats.increases,
        decreaseCount: stats.decreases,
      });
    }
  }
  byModel.sort((a, b) => b.changeCount - a.changeCount);

  // Big moves
  const priceChangesWithAmount = priceChangeEvents.filter(e => e.priceChangePercent !== undefined);
  const topIncreases = priceChangesWithAmount
    .filter(e => e.type === 'price_increase')
    .sort((a, b) => (b.priceChangePercent || 0) - (a.priceChangePercent || 0))
    .slice(0, 20);

  const topDecreases = priceChangesWithAmount
    .filter(e => e.type === 'price_decrease')
    .sort((a, b) => (a.priceChangePercent || 0) - (b.priceChangePercent || 0))
    .slice(0, 20);

  const now = new Date();

  const eventsData: EventsData = {
    generatedAt: now.toISOString(),
    date: latestDate,
    previousDate,
    summary,
    events,
    volatility: {
      byBrand,
      byModel: byModel.slice(0, 20),
    },
    bigMoves: {
      topIncreases,
      topDecreases,
    },
  };

  // Save events data
  const intelDir = path.join(dataDir, 'intel');
  fs.mkdirSync(intelDir, { recursive: true });
  const outputPath = path.join(intelDir, 'events.json');
  fs.writeFileSync(outputPath, JSON.stringify(eventsData, null, 2), 'utf-8');

  console.log(`[generateEvents] Saved to ${outputPath}`);
  console.log(`[generateEvents] Events: ${events.length}, Price changes: ${priceChangeEvents.length}`);

  return eventsData;
}
