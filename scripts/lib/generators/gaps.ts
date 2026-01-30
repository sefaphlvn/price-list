/**
 * Gaps Generator
 * Creates segment gap analysis data - identifies market opportunities
 */

import * as fs from 'fs';
import * as path from 'path';
import { safeParseJSON } from '../errorLogger';
import { PriceListRow, StoredData, IndexData } from '../types';

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

  // === BMW MODELS ===
  if (brandLower === 'bmw') {
    // SUV/SAV - X series
    if (/\bx[1-7]\b|ix[1-7]?/i.test(modelLower)) {
      if (/x[5-7]|ix/i.test(modelLower)) return 'SUV-Large';
      if (/x[3-4]/i.test(modelLower)) return 'SUV-Medium';
      return 'SUV-Compact';
    }
    // Sedan - number series
    if (/\b[1-8][0-9]{2}[a-z]?|i[4-7]/i.test(modelLower)) {
      if (/[5-8][0-9]{2}|i[5-7]/i.test(modelLower)) return 'Sedan-D';
      if (/[3-4][0-9]{2}|i4/i.test(modelLower)) return 'Sedan-C';
      return 'Hatchback-C';
    }
    // M models
    if (/\bm[1-8]/i.test(modelLower)) return 'Sedan-D';
    // Z series
    if (/\bz[1-8]/i.test(modelLower)) return 'Coupe';
    return 'Sedan-C';
  }

  // === MERCEDES-BENZ MODELS ===
  if (brandLower === 'mercedes-benz' || brandLower === 'mercedes') {
    // SUV - GL/GLC/GLE/GLS/EQ SUV
    if (/\bgl[a-z]|eq[a-z].*suv|g\s*class|amg\s*g/i.test(modelLower)) {
      if (/gls|g\s*class|amg\s*g/i.test(modelLower)) return 'SUV-Large';
      if (/gle|glc|eqe.*suv/i.test(modelLower)) return 'SUV-Medium';
      return 'SUV-Compact';
    }
    // Sedan - A, C, E, S Class
    if (/^[acesmv]\s*\d|eq[a-z]\s*\d|cla|cls/i.test(modelLower)) {
      if (/^s\s*\d|eqs\s*\d|maybach/i.test(modelLower)) return 'Sedan-D';
      if (/^[e]\s*\d|cls|eqe\s*\d/i.test(modelLower)) return 'Sedan-D';
      if (/^c\s*\d/i.test(modelLower)) return 'Sedan-C';
      return 'Sedan-C';
    }
    // V-Class
    if (/\bv\s*class|\bv\d/i.test(modelLower)) return 'MPV';
    return 'Sedan-C';
  }

  // === VOLVO MODELS ===
  if (brandLower === 'volvo') {
    if (/xc[4-9]0|ex[3-9]0/i.test(modelLower)) {
      if (/xc90|xc60|ex90/i.test(modelLower)) return 'SUV-Large';
      return 'SUV-Compact';
    }
    if (/s[4-9]0|es[4-9]0/i.test(modelLower)) return 'Sedan-D';
    if (/v[4-9]0|ec[4-9]0/i.test(modelLower)) return 'Station Wagon';
    return 'Sedan-C';
  }

  // === FORD MODELS ===
  if (brandLower === 'ford') {
    if (/kuga|puma|explorer|mustang mach|edge|everest/i.test(modelLower)) {
      if (/explorer|everest/i.test(modelLower)) return 'SUV-Large';
      if (/kuga|edge/i.test(modelLower)) return 'SUV-Medium';
      return 'SUV-Compact';
    }
    if (/focus|fiesta/i.test(modelLower)) return 'Hatchback-C';
    if (/ranger/i.test(modelLower)) return 'Pickup';
    if (/transit|tourneo|custom/i.test(modelLower)) return 'MPV';
    return 'Hatchback-C';
  }

  // === OPEL MODELS ===
  if (brandLower === 'opel') {
    if (/mokka|grandland|crossland|frontera/i.test(modelLower)) {
      if (/grandland/i.test(modelLower)) return 'SUV-Medium';
      return 'SUV-Compact';
    }
    if (/corsa/i.test(modelLower)) return 'Hatchback-B';
    if (/astra/i.test(modelLower)) return 'Hatchback-C';
    if (/combo|vivaro|zafira|movano/i.test(modelLower)) return 'MPV';
    return 'Hatchback-C';
  }

  // === PEUGEOT MODELS ===
  if (brandLower === 'peugeot') {
    if (/[2-5]008|e-[2-5]008/i.test(modelLower)) {
      if (/5008/i.test(modelLower)) return 'SUV-Large';
      if (/3008/i.test(modelLower)) return 'SUV-Medium';
      return 'SUV-Compact';
    }
    if (/208|e-208/i.test(modelLower)) return 'Hatchback-B';
    if (/308|e-308|408/i.test(modelLower)) return 'Hatchback-C';
    if (/508/i.test(modelLower)) return 'Sedan-D';
    if (/rifter|partner|traveller|expert/i.test(modelLower)) return 'MPV';
    return 'Hatchback-C';
  }

  // === CITROEN MODELS ===
  if (brandLower === 'citroën' || brandLower === 'citroen') {
    if (/c[3-5].*aircross|ë-c[3-5]/i.test(modelLower)) {
      if (/c5.*aircross/i.test(modelLower)) return 'SUV-Medium';
      return 'SUV-Compact';
    }
    if (/c3(?!.*aircross)|ë-c3/i.test(modelLower)) return 'Hatchback-B';
    if (/c4(?!.*aircross)|ë-c4/i.test(modelLower)) return 'Hatchback-C';
    if (/berlingo|spacetourer|jumpy/i.test(modelLower)) return 'MPV';
    return 'Hatchback-C';
  }

  // === FIAT MODELS ===
  if (brandLower === 'fiat') {
    if (/500x|500l/i.test(modelLower)) return 'SUV-Compact';
    if (/500(?!x|l)|cinquecento/i.test(modelLower)) return 'Hatchback-B';
    if (/panda/i.test(modelLower)) return 'Hatchback-B';
    if (/egea|tipo/i.test(modelLower)) {
      if (/sedan/i.test(modelLower)) return 'Sedan-C';
      if (/station|sw|wagon|cross/i.test(modelLower)) return 'Station Wagon';
      return 'Hatchback-C';
    }
    if (/doblo|fiorino|scudo|ducato/i.test(modelLower)) return 'MPV';
    return 'Hatchback-C';
  }

  // === BYD MODELS ===
  if (brandLower === 'byd') {
    if (/atto|yuan|tang|song/i.test(modelLower)) return 'SUV-Compact';
    if (/dolphin|seal/i.test(modelLower)) return 'Hatchback-C';
    if (/han/i.test(modelLower)) return 'Sedan-D';
    return 'SUV-Compact';
  }

  // === NISSAN MODELS ===
  if (brandLower === 'nissan') {
    if (/qashqai|juke|x-trail|ariya/i.test(modelLower)) {
      if (/x-trail/i.test(modelLower)) return 'SUV-Medium';
      return 'SUV-Compact';
    }
    if (/leaf|micra/i.test(modelLower)) return 'Hatchback-B';
    if (/navara/i.test(modelLower)) return 'Pickup';
    return 'SUV-Compact';
  }

  // === HONDA MODELS ===
  if (brandLower === 'honda') {
    if (/cr-v|hr-v|zr-v/i.test(modelLower)) {
      if (/cr-v/i.test(modelLower)) return 'SUV-Medium';
      return 'SUV-Compact';
    }
    if (/jazz|e:ny1/i.test(modelLower)) return 'Hatchback-B';
    if (/civic/i.test(modelLower)) return 'Hatchback-C';
    return 'Hatchback-C';
  }

  // === KIA MODELS ===
  if (brandLower === 'kia') {
    if (/sportage|sorento|niro|ev6|ev9|stonic/i.test(modelLower)) {
      if (/sorento|ev9/i.test(modelLower)) return 'SUV-Large';
      if (/sportage|ev6/i.test(modelLower)) return 'SUV-Medium';
      return 'SUV-Compact';
    }
    if (/picanto|rio/i.test(modelLower)) return 'Hatchback-B';
    if (/ceed|xceed/i.test(modelLower)) return 'Hatchback-C';
    if (/stinger/i.test(modelLower)) return 'Sedan-D';
    return 'Hatchback-C';
  }

  // === SEAT/CUPRA MODELS ===
  if (brandLower === 'seat' || brandLower === 'cupra') {
    if (/ateca|arona|tarraco|formentor|terramar/i.test(modelLower)) {
      if (/tarraco|terramar/i.test(modelLower)) return 'SUV-Medium';
      return 'SUV-Compact';
    }
    if (/ibiza/i.test(modelLower)) return 'Hatchback-B';
    if (/leon|born/i.test(modelLower)) return 'Hatchback-C';
    return 'Hatchback-C';
  }

  // === DACIA MODELS ===
  if (brandLower === 'dacia') {
    if (/duster|jogger|spring/i.test(modelLower)) {
      if (/duster/i.test(modelLower)) return 'SUV-Compact';
      if (/jogger/i.test(modelLower)) return 'MPV';
      return 'Hatchback-B';
    }
    if (/sandero/i.test(modelLower)) return 'Hatchback-B';
    return 'Hatchback-B';
  }

  // === GENERIC PATTERNS (VW, Skoda, Renault, Toyota, Hyundai) ===

  // SUV patterns
  if (/suv|crossover|4x4|off-?road/i.test(modelLower) ||
      /tiguan|touareg|t-roc|t-cross|taigo/i.test(modelLower) ||
      /karoq|kodiaq|kamiq|elroq|enyaq/i.test(modelLower) ||
      /captur|kadjar|austral|koleos|arkana|symbioz/i.test(modelLower) ||
      /tucson|kona|santa|bayon|ioniq 5/i.test(modelLower) ||
      /c-hr|rav4|land cruiser|yaris cross|corolla cross/i.test(modelLower)) {
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

  // Electric specific (check after brand-specific)
  if (/id\.\d|electric|ev|bev/i.test(modelLower) ||
      /zoe|megane e-tech/i.test(modelLower) ||
      /ioniq 5|ioniq 6|kona electric/i.test(modelLower)) {
    return 'Electric';
  }

  // Pickup
  if (/pickup|pick-up|amarok|hilux/i.test(modelLower)) {
    return 'Pickup';
  }

  // Default
  return 'Other';
}

// Normalize fuel type (Turkish output for consistency with stats.ts)
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

// Normalize transmission (Turkish output for consistency with stats.ts)
function normalizeTransmission(transmission: string): string {
  const t = transmission.toLowerCase().trim();

  // DSG specific
  if (t.includes('dsg')) {
    return 'Otomatik';
  }

  // DCT specific
  if (t.includes('dct')) {
    return 'Otomatik';
  }

  // CVT specific
  if (t.includes('cvt')) {
    return 'Otomatik';
  }

  // Tiptronic
  if (t.includes('tiptronik') || t.includes('tiptronic')) {
    return 'Otomatik';
  }

  // Manual variants
  if (t.includes('manuel') || t.includes('manual') || t === 'mt' || t.includes('düz')) {
    return 'Manuel';
  }

  // Automatic variants
  if (t.includes('otomatik') || t.includes('automatic') || t === 'at' || t.includes('auto')) {
    return 'Otomatik';
  }

  return 'Diger';
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

  return safeParseJSON<StoredData | null>(filePath, null);
}

export async function generateGaps(): Promise<GapsData> {
  console.log('[generateGaps] Starting...');

  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    throw new Error('index.json not found');
  }

  const index = safeParseJSON<IndexData>(indexPath, { lastUpdated: '', brands: {} });

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
  const allFuels = ['Benzin', 'Dizel', 'Hibrit', 'Hafif Hibrit', 'Plug-in Hibrit', 'Elektrik', 'LPG'];
  const allTransmissions = ['Otomatik', 'Manuel'];

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
            const fuelPopularity = fuel === 'Benzin' ? 0.4 : fuel === 'Hibrit' ? 0.3 : fuel === 'Dizel' ? 0.2 : 0.1;
            const transPopularity = transmission === 'Otomatik' ? 0.7 : 0.3;
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
