/**
 * Price List Collector Script
 * Runs daily via GitHub Actions to collect and store price data
 *
 * Usage: npx tsx scripts/collect.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';

// Types
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

interface BrandConfig {
  id: string;
  name: string;
  url: string;
  parser: 'vw' | 'skoda' | 'renault' | 'toyota' | 'hyundai' | 'ford' | 'generic';
  responseType?: 'json' | 'xml';
}

interface CollectionResult {
  brand: string;
  success: boolean;
  count?: number;
  error?: string;
  usedFallback?: boolean;
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

interface StoredData {
  collectedAt: string;
  brand: string;
  brandId: string;
  rowCount: number;
  rows: PriceListRow[];
}

// Brand configurations - Direct URLs (no CORS proxy needed in Node.js)
const BRANDS: BrandConfig[] = [
  {
    id: 'volkswagen',
    name: 'Volkswagen',
    url: 'https://binekarac2.vw.com.tr/app/local/fiyatlardata/fiyatlar-test.json?v=202511071652',
    parser: 'vw',
  },
  {
    id: 'skoda',
    name: 'Škoda',
    url: 'https://www.skoda.com.tr/_next/data/JqOPjpaBnXsRA79zGw7R6/fiyat-listesi.json',
    parser: 'skoda',
  },
  {
    id: 'renault',
    name: 'Renault',
    url: 'https://best.renault.com.tr/wp-json/service/v1/CatFiyatData?cat=Binek',
    parser: 'renault',
  },
  {
    id: 'toyota',
    name: 'Toyota',
    url: 'https://turkiye.toyota.com.tr/middle/fiyat-listesi/fiyat_v3.xml',
    parser: 'toyota',
    responseType: 'xml',
  },
  {
    id: 'hyundai',
    name: 'Hyundai',
    url: 'https://www.hyundai.com/wsvc/tr/spa/pricelist/list?loc=TR&lan=tr',
    parser: 'hyundai',
  },
];

// Price validation constants (Turkish vehicle price range)
const MIN_VALID_PRICE = 100_000; // 100K TL - minimum realistic car price
const MAX_VALID_PRICE = 50_000_000; // 50M TL - maximum realistic car price

// Parse price string to number
const parsePrice = (priceStr: string): number => {
  if (!priceStr) return 0;
  const cleaned = priceStr
    .replace(/₺/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Validate price is within reasonable bounds
const isValidPrice = (price: number): boolean => {
  return price >= MIN_VALID_PRICE && price <= MAX_VALID_PRICE;
};

// Filter and warn about invalid prices
const filterValidRows = (rows: PriceListRow[], brandName: string): PriceListRow[] => {
  const validRows: PriceListRow[] = [];
  const invalidPrices: { model: string; trim: string; price: number }[] = [];

  for (const row of rows) {
    if (isValidPrice(row.priceNumeric)) {
      validRows.push(row);
    } else if (row.priceNumeric > 0) {
      invalidPrices.push({
        model: row.model,
        trim: row.trim,
        price: row.priceNumeric,
      });
    }
  }

  if (invalidPrices.length > 0) {
    console.log(`  Warning: ${invalidPrices.length} rows with invalid prices filtered out for ${brandName}`);
    invalidPrices.slice(0, 3).forEach(item => {
      console.log(`    - ${item.model} ${item.trim}: ${item.price} TL`);
    });
    if (invalidPrices.length > 3) {
      console.log(`    ... and ${invalidPrices.length - 3} more`);
    }
  }

  return validRows;
};

// Volkswagen parser
const parseVWData = (data: any, brand: string): PriceListRow[] => {
  const rows: PriceListRow[] = [];
  try {
    const araclar = data?.Data?.FiyatBilgisi?.Arac;
    if (!Array.isArray(araclar)) return rows;

    araclar.forEach((arac: any) => {
      const priceData = arac?.AracXML?.PriceData;
      if (!priceData) return;

      const modelName = priceData['-ModelName'] || 'Unknown';
      const subListItem = priceData?.SubList?.Item;
      if (!subListItem) return;

      const itemArray = Array.isArray(subListItem) ? subListItem : [subListItem];

      itemArray.forEach((item: any) => {
        const subItemArray = item.SubItem;
        if (!Array.isArray(subItemArray)) return;

        let donanim = '', motor = '', sanziman = '', fiyat = '';

        subItemArray.forEach((detail: any) => {
          const title = detail['-Title'] || '';
          const value = detail['-Value'] || '';
          if (title === 'Donanım') donanim = value;
          else if (title === 'Motor') motor = value;
          else if (title === 'Şanzıman') sanziman = value;
          else if (title.includes('Fiyat') && title.includes('Anahtar Teslim') && !title.includes('Noter')) {
            fiyat = value;
          }
        });

        const combinedText = `${modelName} ${motor} ${donanim}`.toLowerCase();
        let yakit = '';
        if (combinedText.includes('e-hybrid') || combinedText.includes('ehybrid') || combinedText.includes('phev')) {
          yakit = 'Plug-in Hybrid';
        } else if (combinedText.includes('id.')) {
          yakit = 'Elektrik';
        } else if (combinedText.includes('tsi') || combinedText.includes('tfsi')) {
          yakit = 'Benzin';
        } else if (combinedText.includes('tdi')) {
          yakit = 'Dizel';
        } else if (combinedText.includes('tgi')) {
          yakit = 'CNG';
        }

        if (fiyat) {
          rows.push({ model: modelName, trim: donanim, engine: motor, transmission: sanziman, fuel: yakit, priceRaw: fiyat, priceNumeric: parsePrice(fiyat), brand });
        }
      });
    });
  } catch (error) {
    console.error('VW parse error:', error);
  }
  return rows;
};

// Skoda parser
const parseSkodaData = (data: any, brand: string): PriceListRow[] => {
  const rows: PriceListRow[] = [];
  try {
    // New structure: pageProps.tabs[0].content.priceListData.priceListSections
    // Old structure: pageProps.priceListSections
    let sections = data?.pageProps?.priceListSections;
    if (!sections) {
      // Try new structure
      const tabs = data?.pageProps?.tabs;
      if (Array.isArray(tabs) && tabs[0]?.content?.priceListData?.priceListSections) {
        sections = tabs[0].content.priceListData.priceListSections;
      }
    }
    if (!Array.isArray(sections)) return rows;

    sections.forEach((section: any) => {
      const items = section.items;
      if (!Array.isArray(items)) return;

      items.forEach((item: any) => {
        const modelName = item.title || 'Unknown';
        const tableData = item.modelPricesTable?.data;
        if (!Array.isArray(tableData)) return;

        tableData.forEach((row: any) => {
          const donanim = row.hardware?.value || '';
          const fiyat = row.currentPrice?.value || '';

          let sanziman = '';
          if (donanim.includes('DSG')) sanziman = 'DSG';
          else if (donanim.includes('Manuel')) sanziman = 'Manuel';
          else if (donanim.includes('Otomatik')) sanziman = 'Otomatik';

          const combinedText = `${modelName} ${donanim}`.toLowerCase();
          let yakit = '';
          if (combinedText.includes('elroq') || combinedText.includes('enyaq') || /\d+\s*e-/.test(combinedText)) {
            yakit = 'Elektrik';
          } else if (combinedText.includes('plug-in') || combinedText.includes('phev') || combinedText.includes('ivrs')) {
            yakit = 'Plug-in Hybrid';
          } else if (combinedText.includes('tsi') || combinedText.includes('tgi')) {
            yakit = 'Benzin';
          } else if (combinedText.includes('tdi')) {
            yakit = 'Dizel';
          }

          const motor = donanim.replace(/DSG|Manuel|Otomatik/gi, '').trim();

          if (fiyat) {
            rows.push({ model: modelName, trim: donanim, engine: motor, transmission: sanziman, fuel: yakit, priceRaw: fiyat, priceNumeric: parsePrice(fiyat), brand });
          }
        });
      });
    });
  } catch (error) {
    console.error('Skoda parse error:', error);
  }
  return rows;
};

// Renault parser
const parseRenaultData = (data: any, brand: string): PriceListRow[] => {
  const rows: PriceListRow[] = [];
  try {
    const results = data?.results;
    if (!Array.isArray(results)) return rows;

    results.forEach((item: any) => {
      const modelName = item.ModelAdi || 'Unknown';
      const trim = item.EkipmanAdi || item.VersiyonAdi || '';
      const engine = item.VersiyonAdi || '';
      const transmission = item.VitesTipi || '';
      const fuel = item.YakitTipi || '';
      const priceRaw = item.AntesFiyati ? `₺${parseFloat(item.AntesFiyati).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';

      if (priceRaw) {
        rows.push({ model: modelName, trim, engine, transmission, fuel, priceRaw, priceNumeric: parseFloat(item.AntesFiyati) || 0, brand });
      }
    });
  } catch (error) {
    console.error('Renault parse error:', error);
  }
  return rows;
};

// Toyota parser
const parseToyotaData = (data: any, brand: string): PriceListRow[] => {
  const rows: PriceListRow[] = [];
  try {
    let models = data?.Data?.Model;
    if (!models) return rows;
    if (!Array.isArray(models)) models = [models];

    models.forEach((model: any) => {
      let modelFiyatArray = model.ModelFiyat;
      if (!modelFiyatArray) return;
      if (!Array.isArray(modelFiyatArray)) modelFiyatArray = [modelFiyatArray];

      modelFiyatArray.forEach((item: any) => {
        if (item.Durum !== 1 && item.Durum !== '1') return;

        const modelName = item.Model || 'Unknown';
        if (modelName.includes('%') || modelName.includes('ÖTV') || modelName.toLowerCase().includes('tüm versiyonlarda')) return;

        const govde = item.Govde || '';
        const motorHacmi = item.MotorHacmi || '';
        const vitesTipi = item.VitesTipi || '';
        const motorTipi = item.MotorTipi || '';

        let fiyat = item.KampanyaliFiyati2 || item.KampanyaliFiyati1 || item.ListeFiyati2 || item.ListeFiyati1 || '';
        if (fiyat) fiyat = fiyat.toString().replace(/\s*TL\s*$/i, '').trim();

        let yakit = '';
        const motorTipiLower = motorTipi.toLowerCase();
        if (motorTipiLower.includes('hybrid') || motorTipiLower.includes('hibrit')) yakit = 'Hybrid';
        else if (motorTipiLower.includes('benzin')) yakit = 'Benzin';
        else if (motorTipiLower.includes('dizel')) yakit = 'Dizel';
        else if (motorTipiLower.includes('elektrik')) yakit = 'Elektrik';

        if (fiyat) {
          rows.push({ model: govde, trim: modelName, engine: motorHacmi, transmission: vitesTipi, fuel: yakit, priceRaw: fiyat, priceNumeric: parsePrice(fiyat), brand });
        }
      });
    });
  } catch (error) {
    console.error('Toyota parse error:', error);
  }
  return rows;
};

// Hyundai parser
const parseHyundaiData = (data: any, brand: string): PriceListRow[] => {
  const rows: PriceListRow[] = [];
  try {
    const productList = data?.productList;
    if (!Array.isArray(productList)) return rows;

    productList.forEach((product: any) => {
      const productName = product.productName || 'Unknown';
      const yearDetailList = product.yearDetailList;
      if (!Array.isArray(yearDetailList)) return;

      yearDetailList.forEach((yearDetail: any) => {
        const priceDetailList = yearDetail.priceDetailList;
        if (!Array.isArray(priceDetailList)) return;

        priceDetailList.forEach((item: any) => {
          const trimName = item.trimName || '';
          const powertrainName = item.powertrainName || '';
          const transmission = item.transmission || '';
          const fuelName = item.fuelName || '';
          const price = item.suggestedPrice || item.price || '';

          if (price && price !== 'N/A') {
            rows.push({
              model: productName,
              trim: trimName,
              engine: powertrainName.replace(trimName, '').trim(),
              transmission,
              fuel: fuelName,
              priceRaw: price.toString(),
              priceNumeric: parsePrice(price.toString()),
              brand,
            });
          }
        });
      });
    });
  } catch (error) {
    console.error('Hyundai parse error:', error);
  }
  return rows;
};

// Parse data based on brand parser type
const parseData = (data: any, brand: string, parserType: string): PriceListRow[] => {
  switch (parserType) {
    case 'vw': return parseVWData(data, brand);
    case 'skoda': return parseSkodaData(data, brand);
    case 'renault': return parseRenaultData(data, brand);
    case 'toyota': return parseToyotaData(data, brand);
    case 'hyundai': return parseHyundaiData(data, brand);
    default: return [];
  }
};

// Fetch data from URL
async function fetchBrandData(brand: BrandConfig): Promise<any> {
  console.log(`  Fetching ${brand.name} from ${brand.url}`);

  const response = await fetch(brand.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, application/xml, text/xml, text/plain, */*',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  if (brand.responseType === 'xml') {
    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    return parser.parse(xmlText);
  }

  return response.json();
}

// Save data to file
function saveData(brandId: string, date: Date, data: StoredData): void {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const dirPath = path.join(process.cwd(), 'data', year, month, brandId);
  const filePath = path.join(dirPath, `${day}.json`);

  // Create directory if it doesn't exist
  fs.mkdirSync(dirPath, { recursive: true });

  // Write data
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  Saved to ${filePath}`);
}

// Safe JSON parse with fallback
function safeParseJSON<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`JSON parse failed for ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return fallback;
  }
}

// Load existing index or create new one
function loadIndex(): IndexData {
  const indexPath = path.join(process.cwd(), 'data', 'index.json');
  const defaultIndex: IndexData = {
    lastUpdated: new Date().toISOString(),
    brands: {},
  };

  return safeParseJSON(indexPath, defaultIndex);
}

// Save index
function saveIndex(index: IndexData): void {
  const indexPath = path.join(process.cwd(), 'data', 'index.json');
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`Index saved to ${indexPath}`);
}

// Get previous day's data as fallback
function getPreviousData(brandId: string, currentDate: Date): StoredData | null {
  const dataDir = path.join(process.cwd(), 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    return null;
  }

  const index = safeParseJSON<IndexData>(indexPath, { lastUpdated: '', brands: {} });
  const brandInfo = index.brands[brandId];

  if (!brandInfo || brandInfo.availableDates.length === 0) {
    return null;
  }

  // Get the most recent available date
  const latestDate = brandInfo.availableDates[0]; // Already sorted descending
  const [year, month, day] = latestDate.split('-');
  const filePath = path.join(dataDir, year, month, brandId, `${day}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return safeParseJSON<StoredData | null>(filePath, null);
}

// Copy previous data as current day's data (fallback)
function useFallbackData(brandId: string, brandName: string, currentDate: Date, previousData: StoredData): StoredData {
  const fallbackData: StoredData = {
    collectedAt: currentDate.toISOString(),
    brand: brandName,
    brandId: brandId,
    rowCount: previousData.rowCount,
    rows: previousData.rows,
  };

  // Add metadata to indicate this is fallback data
  (fallbackData as any).isFallback = true;
  (fallbackData as any).originalDate = previousData.collectedAt;

  return fallbackData;
}

// Update index with new data
function updateIndex(index: IndexData, brandId: string, brandName: string, dateStr: string, rowCount: number): void {
  if (!index.brands[brandId]) {
    index.brands[brandId] = {
      name: brandName,
      availableDates: [],
      latestDate: dateStr,
      totalRecords: 0,
    };
  }

  const brandIndex = index.brands[brandId];

  // Add date if not already present
  if (!brandIndex.availableDates.includes(dateStr)) {
    brandIndex.availableDates.push(dateStr);
    // Sort dates in descending order (newest first)
    brandIndex.availableDates.sort((a, b) => b.localeCompare(a));
  }

  brandIndex.latestDate = brandIndex.availableDates[0];
  brandIndex.totalRecords = rowCount;
  index.lastUpdated = new Date().toISOString();
}

// Main collection function
async function collectAllBrands(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Price List Collector');
  console.log('='.repeat(60));

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`Collection date: ${dateStr}`);
  console.log(`Brands to collect: ${BRANDS.length}`);
  console.log('');

  const index = loadIndex();
  const results: CollectionResult[] = [];

  for (const brand of BRANDS) {
    console.log(`[${brand.name}]`);

    try {
      const data = await fetchBrandData(brand);
      const rawRows = parseData(data, brand.name, brand.parser);
      const rows = filterValidRows(rawRows, brand.name);

      if (rows.length === 0) {
        // Try fallback if no rows parsed
        console.log(`  Warning: No rows parsed for ${brand.name}, trying fallback...`);
        const previousData = getPreviousData(brand.id, now);

        if (previousData) {
          const fallbackData = useFallbackData(brand.id, brand.name, now, previousData);
          saveData(brand.id, now, fallbackData);
          updateIndex(index, brand.id, brand.name, dateStr, fallbackData.rowCount);
          console.log(`  Fallback: Using previous data (${fallbackData.rowCount} rows)`);
          results.push({ brand: brand.id, success: true, count: fallbackData.rowCount, usedFallback: true });
        } else {
          console.log(`  Error: No fallback data available`);
          results.push({ brand: brand.id, success: false, error: 'No rows parsed and no fallback available' });
        }
        continue;
      }

      const storedData: StoredData = {
        collectedAt: now.toISOString(),
        brand: brand.name,
        brandId: brand.id,
        rowCount: rows.length,
        rows,
      };

      saveData(brand.id, now, storedData);
      updateIndex(index, brand.id, brand.name, dateStr, rows.length);

      console.log(`  Success: ${rows.length} rows collected`);
      results.push({ brand: brand.id, success: true, count: rows.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`  Error: ${errorMessage}`);

      // Try fallback on error
      console.log(`  Trying fallback...`);
      const previousData = getPreviousData(brand.id, now);

      if (previousData) {
        const fallbackData = useFallbackData(brand.id, brand.name, now, previousData);
        saveData(brand.id, now, fallbackData);
        updateIndex(index, brand.id, brand.name, dateStr, fallbackData.rowCount);
        console.log(`  Fallback: Using previous data (${fallbackData.rowCount} rows)`);
        results.push({ brand: brand.id, success: true, count: fallbackData.rowCount, usedFallback: true });
      } else {
        console.log(`  Error: No fallback data available`);
        results.push({ brand: brand.id, success: false, error: errorMessage });
      }
    }

    console.log('');
  }

  // Save updated index
  saveIndex(index);

  // Generate health report
  const fallbackUsed = results.filter(r => r.usedFallback);
  const healthReport = {
    generatedAt: now.toISOString(),
    date: dateStr,
    totalBrands: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    usedFallback: fallbackUsed.length,
    details: results.map(r => ({
      brand: r.brand,
      success: r.success,
      count: r.count || 0,
      error: r.error || null,
      usedFallback: r.usedFallback || false,
    })),
  };

  const healthPath = path.join(process.cwd(), 'data', 'health-report.json');
  fs.writeFileSync(healthPath, JSON.stringify(healthReport, null, 2), 'utf-8');
  console.log(`Health report saved to ${healthPath}`);

  // Summary
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Total: ${results.length} brands`);
  console.log(`Success: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Used Fallback: ${fallbackUsed.length}`);

  if (fallbackUsed.length > 0) {
    console.log('\nBrands using previous day data:');
    fallbackUsed.forEach(r => console.log(`  - ${r.brand} (${r.count} rows)`));
  }

  if (failed.length > 0) {
    console.log('\nFailed brands:');
    failed.forEach(r => console.log(`  - ${r.brand}: ${r.error}`));
  }

  // Don't exit with error if we have fallback data
  // Only exit with error if ALL brands failed
  if (successful.length === 0) {
    console.log('\nCritical: All brands failed, exiting with error');
    process.exit(1);
  }
}

// Run
collectAllBrands().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
