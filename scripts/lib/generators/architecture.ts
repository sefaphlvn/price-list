/**
 * Architecture Generator
 * Creates trim ladder and cross-brand comparison data
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

export interface TrimStep {
  trim: string;
  price: number;
  priceFormatted: string;
  stepFromBase: number;
  stepPercent: number;
  engine: string;
  transmission: string;
  fuel: string;
}

export interface TrimLadder {
  id: string;
  model: string;
  brand: string;
  brandId: string;
  trims: TrimStep[];
  basePrice: number;
  topPrice: number;
  priceSpread: number;
  priceSpreadPercent: number;
  trimCount: number;
}

export interface CrossBrandEntry {
  brand: string;
  brandId: string;
  model: string;
  basePrice: number;
  topPrice: number;
  basePriceFormatted: string;
  topPriceFormatted: string;
  trimCount: number;
}

export interface SegmentComparison {
  segment: string;
  models: CrossBrandEntry[];
  avgBasePrice: number;
  avgTopPrice: number;
}

export interface ArchitectureData {
  generatedAt: string;
  date: string;
  ladders: TrimLadder[];
  crossBrandComparison: SegmentComparison[];
  summary: {
    totalModels: number;
    avgTrimsPerModel: number;
    avgPriceSpread: number;
    avgPriceSpreadPercent: number;
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function detectSegment(model: string): string {
  const modelLower = model.toLowerCase();

  // SUV/Crossover keywords
  if (/suv|crossover|x\d|q\d|cx-|rav4|tucson|tiguan|karoq|kodiaq|ateca|tarraco|kuga|escape|explorer|sportage|sorento|outlander|cr-v|hr-v|x-trail|qashqai|juke|captur|kadjar|koleos|duster|jogger|2008|3008|5008|c3 aircross|c5 aircross/i.test(modelLower)) {
    return 'SUV';
  }

  // Sedan keywords
  if (/sedan|passat|jetta|arteon|superb|octavia|focus|mondeo|cerato|optima|camry|corolla|accord|civic|mazda3|mazda6|c4|308|508|megane/i.test(modelLower)) {
    return 'Sedan';
  }

  // Hatchback keywords
  if (/hatchback|polo|golf|fabia|scala|fiesta|i20|i30|clio|zoe|yaris|jazz|swift|leon|ibiza|208/i.test(modelLower)) {
    return 'Hatchback';
  }

  // MPV/Van keywords
  if (/mpv|van|touran|sharan|caddy|transporter|caravelle|berlingo|rifter|traveller|kangoo|express|staria/i.test(modelLower)) {
    return 'MPV';
  }

  // Pickup keywords
  if (/pickup|amarok|ranger|hilux|navara|l200|d-max|fullback/i.test(modelLower)) {
    return 'Pickup';
  }

  // Electric keywords
  if (/id\.|ioniq|kona electric|e-|ev|electric|elektrik/i.test(modelLower)) {
    return 'Electric';
  }

  return 'Other';
}

export async function generateArchitecture(): Promise<ArchitectureData> {
  console.log('[generateArchitecture] Starting...');

  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    throw new Error('index.json not found');
  }

  const index: IndexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const ladders: TrimLadder[] = [];
  const segmentModels: Map<string, CrossBrandEntry[]> = new Map();
  let latestDate = '';

  // Process each brand
  for (const [brandId, brandInfo] of Object.entries(index.brands)) {
    const currentDate = brandInfo.latestDate;
    if (!latestDate || currentDate > latestDate) {
      latestDate = currentDate;
    }

    const [year, month, day] = currentDate.split('-');
    const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`  ${brandInfo.name}: file not found`);
      continue;
    }

    const storedData: StoredData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Group by model
    const modelGroups: Map<string, PriceListRow[]> = new Map();
    for (const row of storedData.rows) {
      if (row.priceNumeric > 0) {
        const modelKey = row.model;
        if (!modelGroups.has(modelKey)) {
          modelGroups.set(modelKey, []);
        }
        modelGroups.get(modelKey)!.push(row);
      }
    }

    // Create trim ladder for each model
    for (const [model, rows] of modelGroups.entries()) {
      // Sort by price ascending
      const sortedRows = [...rows].sort((a, b) => a.priceNumeric - b.priceNumeric);

      if (sortedRows.length === 0) continue;

      const basePrice = sortedRows[0].priceNumeric;
      const topPrice = sortedRows[sortedRows.length - 1].priceNumeric;
      const priceSpread = topPrice - basePrice;
      const priceSpreadPercent = basePrice > 0 ? (priceSpread / basePrice) * 100 : 0;

      const trims: TrimStep[] = sortedRows.map((row) => ({
        trim: row.trim,
        price: row.priceNumeric,
        priceFormatted: row.priceRaw,
        stepFromBase: row.priceNumeric - basePrice,
        stepPercent: basePrice > 0 ? ((row.priceNumeric - basePrice) / basePrice) * 100 : 0,
        engine: row.engine,
        transmission: row.transmission,
        fuel: row.fuel,
      }));

      const ladderId = `${brandId}-${model}`.toLowerCase().replace(/\s+/g, '-');

      ladders.push({
        id: ladderId,
        model,
        brand: brandInfo.name,
        brandId,
        trims,
        basePrice,
        topPrice,
        priceSpread,
        priceSpreadPercent: Math.round(priceSpreadPercent * 100) / 100,
        trimCount: trims.length,
      });

      // Add to segment comparison
      const segment = detectSegment(model);
      if (!segmentModels.has(segment)) {
        segmentModels.set(segment, []);
      }

      segmentModels.get(segment)!.push({
        brand: brandInfo.name,
        brandId,
        model,
        basePrice,
        topPrice,
        basePriceFormatted: formatPrice(basePrice),
        topPriceFormatted: formatPrice(topPrice),
        trimCount: trims.length,
      });
    }

    console.log(`  ${brandInfo.name}: ${modelGroups.size} models processed`);
  }

  // Build cross-brand comparison
  const crossBrandComparison: SegmentComparison[] = [];
  for (const [segment, models] of segmentModels.entries()) {
    if (models.length > 1) {
      // Sort by base price
      models.sort((a, b) => a.basePrice - b.basePrice);

      const avgBasePrice = models.reduce((sum, m) => sum + m.basePrice, 0) / models.length;
      const avgTopPrice = models.reduce((sum, m) => sum + m.topPrice, 0) / models.length;

      crossBrandComparison.push({
        segment,
        models,
        avgBasePrice: Math.round(avgBasePrice),
        avgTopPrice: Math.round(avgTopPrice),
      });
    }
  }

  // Sort segments by model count
  crossBrandComparison.sort((a, b) => b.models.length - a.models.length);

  // Calculate summary
  const totalModels = ladders.length;
  const avgTrimsPerModel = totalModels > 0
    ? Math.round((ladders.reduce((sum, l) => sum + l.trimCount, 0) / totalModels) * 10) / 10
    : 0;
  const avgPriceSpread = totalModels > 0
    ? Math.round(ladders.reduce((sum, l) => sum + l.priceSpread, 0) / totalModels)
    : 0;
  const avgPriceSpreadPercent = totalModels > 0
    ? Math.round((ladders.reduce((sum, l) => sum + l.priceSpreadPercent, 0) / totalModels) * 100) / 100
    : 0;

  const now = new Date();

  const architectureData: ArchitectureData = {
    generatedAt: now.toISOString(),
    date: latestDate,
    ladders,
    crossBrandComparison,
    summary: {
      totalModels,
      avgTrimsPerModel,
      avgPriceSpread,
      avgPriceSpreadPercent,
    },
  };

  // Save architecture data
  const intelDir = path.join(dataDir, 'intel');
  fs.mkdirSync(intelDir, { recursive: true });
  const outputPath = path.join(intelDir, 'architecture.json');
  fs.writeFileSync(outputPath, JSON.stringify(architectureData, null, 2), 'utf-8');

  console.log(`[generateArchitecture] Saved to ${outputPath}`);
  console.log(`[generateArchitecture] Ladders: ${ladders.length}, Segments: ${crossBrandComparison.length}`);

  return architectureData;
}
