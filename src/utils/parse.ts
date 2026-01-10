import { PriceListRow, ParsedData } from '../types';

// Parse price string to number
// Examples: "1.750.000,00 ₺" -> 1750000.00
export const parsePrice = (priceStr: string): number => {
  if (!priceStr) return 0;

  const cleaned = priceStr
    .replace(/₺/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '') // Remove thousands separator
    .replace(/,/g, '.'); // Replace decimal comma with dot

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Extract last updated date from URL
export const extractLastUpdated = (url: string): string | undefined => {
  const match = url.match(/v=(\d+)/);
  if (!match) return undefined;

  const dateStr = match[1];
  // Format: 202511071652 -> YYYY-MM-DD HH:mm
  if (dateStr.length >= 12) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }

  return dateStr;
};

// Volkswagen-specific parser
const parseVWData = (data: any, brand: string): PriceListRow[] => {
  const rows: PriceListRow[] = [];

  try {
    // console.log('🔍 Parsing VW data, root keys:', Object.keys(data));

    // VW JSON structure: Data.FiyatBilgisi.Arac[]
    const araclar = data?.Data?.FiyatBilgisi?.Arac;

    // console.log('📦 Araclar:', araclar ? `Array of ${araclar.length}` : 'Not found');

    if (!Array.isArray(araclar)) {
      console.error('❌ Araclar is not an array');
      return rows;
    }

    araclar.forEach((arac: any, index: number) => {
      const priceData = arac?.AracXML?.PriceData;
      if (!priceData) {
        console.warn(`⚠️ No PriceData for arac ${index}`);
        return;
      }

      const modelName = priceData['-ModelName'] || 'Unknown';
      // console.log(`🚗 Processing model: ${modelName}`);

      const subListItem = priceData?.SubList?.Item;

      if (!subListItem) {
        console.warn(`⚠️ No SubList.Item for ${modelName}`);
        return;
      }

      // SubList.Item can be either a single object or an array of objects (multiple variants)
      const itemArray = Array.isArray(subListItem) ? subListItem : [subListItem];
      // console.log(`📦 Found ${itemArray.length} variant(s) for ${modelName}`);

      // Process each variant
      itemArray.forEach((item: any, variantIndex: number) => {
        const subItemArray = item.SubItem;

        if (!Array.isArray(subItemArray)) {
          console.warn(`⚠️ SubItem is not an array for ${modelName} variant ${variantIndex}`);
          return;
        }

        // console.log(`📋 Processing variant ${variantIndex + 1} with ${subItemArray.length} details`);

        // Parse the array of details for this variant
        let donanim = '';
        let motor = '';
        let sanziman = '';
        let fiyat = '';

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

        // Extract fuel type from model name, trim, or engine
        const combinedText = `${modelName} ${motor} ${donanim}`.toLowerCase();
        let yakit = '';

        // Check for hybrid first (since they often also contain TSI)
        if (combinedText.includes('e-hybrid') || combinedText.includes('ehybrid') || combinedText.includes('phev')) {
          yakit = 'Plug-in Hybrid';
        } else if (combinedText.includes('kw') || combinedText.includes('ps') && (combinedText.includes('id.') || modelName.toLowerCase().includes('id.'))) {
          yakit = 'Elektrik';
        } else if (combinedText.includes('tsi') || combinedText.includes('tfsi')) {
          yakit = 'Benzin';
        } else if (combinedText.includes('tdi')) {
          yakit = 'Dizel';
        } else if (combinedText.includes('tgi')) {
          yakit = 'CNG';
        }

        // console.log(`✅ Parsed: ${modelName} | ${donanim} | ${motor} | ${sanziman} | ${yakit} | ${fiyat}`);

        // Only add if we have a price
        if (fiyat) {
          rows.push({
            model: modelName,
            trim: donanim,
            engine: motor,
            transmission: sanziman,
            fuel: yakit,
            priceRaw: fiyat,
            priceNumeric: parsePrice(fiyat),
            brand,
          });
        } else {
          console.warn(`⚠️ No price found for ${modelName} variant ${variantIndex}`);
        }
      });
    });

    // console.log(`✅ Total rows parsed: ${rows.length}`);
  } catch (error) {
    console.error('❌ VW parse error:', error);
  }

  return rows;
};

// Skoda-specific parser
const parseSkodaData = (data: any, brand: string): PriceListRow[] => {
  const rows: PriceListRow[] = [];

  try {
    // console.log('🔍 Parsing Skoda data, root keys:', Object.keys(data));

    // Skoda JSON structure: pageProps.priceListSections[]
    const sections = data?.pageProps?.priceListSections;

    if (!Array.isArray(sections)) {
      console.error('❌ priceListSections is not an array');
      return rows;
    }

    // console.log(`📦 Found ${sections.length} section(s)`);

    sections.forEach((section: any) => {
      const items = section.items;
      if (!Array.isArray(items)) return;

      items.forEach((item: any) => {
        const modelName = item.title || 'Unknown';
        const tableData = item.modelPricesTable?.data;

        if (!Array.isArray(tableData)) return;

        // console.log(`🚗 Processing model: ${modelName}, variants: ${tableData.length}`);

        tableData.forEach((row: any) => {
          const donanim = row.hardware?.value || '';
          const fiyat = row.currentPrice?.value || '';

          // Extract engine info from hardware field (e.g., "1.5 TSI 150 PS DSG")
          let motor = '';
          let sanziman = '';
          let yakit = '';

          // Try to extract transmission
          if (donanim.includes('DSG')) sanziman = 'DSG';
          else if (donanim.includes('Manuel')) sanziman = 'Manuel';
          else if (donanim.includes('Otomatik')) sanziman = 'Otomatik';

          // Extract fuel type from model name or hardware
          const combinedText = `${modelName} ${donanim}`.toLowerCase();

          // Check for electric vehicles (Elroq, Enyaq, etc.)
          if (combinedText.includes('elektr') ||
              combinedText.includes('e-tech') ||
              combinedText.includes('elroq') ||
              combinedText.includes('enyaq') ||
              /\d+\s*e-/.test(combinedText) || // e.g., "60 e-Prestige", "85 e-Sportline"
              /\se\s/.test(combinedText)) { // " e " pattern
            yakit = 'Elektrik';
          } else if (combinedText.includes('plug-in') || combinedText.includes('phev') || combinedText.includes('ivrs')) {
            yakit = 'Plug-in Hybrid';
          } else if (combinedText.includes('tsi') || combinedText.includes('tgi')) {
            yakit = 'Benzin';
          } else if (combinedText.includes('tdi')) {
            yakit = 'Dizel';
          }

          // Extract engine (e.g., "1.5 TSI 150 PS")
          motor = donanim.replace(/DSG|Manuel|Otomatik/gi, '').trim();

          if (fiyat) {
            rows.push({
              model: modelName,
              trim: donanim,
              engine: motor,
              transmission: sanziman,
              fuel: yakit,
              priceRaw: fiyat,
              priceNumeric: parsePrice(fiyat),
              brand,
            });
          }
        });
      });
    });

    // console.log(`✅ Total Skoda rows parsed: ${rows.length}`);
  } catch (error) {
    console.error('❌ Skoda parse error:', error);
  }

  return rows;
};

// Renault-specific parser
const parseRenaultData = (data: any, brand: string): PriceListRow[] => {
  const rows: PriceListRow[] = [];

  try {
    // Renault JSON structure: results[]
    const results = data?.results;

    if (!Array.isArray(results)) {
      return rows;
    }

    results.forEach((item: any) => {
      const modelName = item.ModelAdi || 'Unknown';
      const trim = item.EkipmanAdi || item.VersiyonAdi || '';
      const engine = item.VersiyonAdi || '';
      const transmission = item.VitesTipi || '';
      const fuel = item.YakitTipi || '';

      // AntesFiyati is the final price (with taxes)
      const priceRaw = item.AntesFiyati ? `₺${parseFloat(item.AntesFiyati).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';

      if (priceRaw) {
        rows.push({
          model: modelName,
          trim: trim,
          engine: engine,
          transmission: transmission,
          fuel: fuel,
          priceRaw: priceRaw,
          priceNumeric: parseFloat(item.AntesFiyati) || 0,
          brand,
        });
      }
    });
  } catch (error) {
    console.error('Renault parse error:', error);
  }

  return rows;
};

// Toyota-specific parser
const parseToyotaData = (data: any, brand: string): PriceListRow[] => {
  const rows: PriceListRow[] = [];

  try {
    // Toyota XML structure: Data.Model[] > ModelFiyat[]
    let models = data?.Data?.Model;

    if (!models) {
      console.error('❌ Model not found in XML');
      return rows;
    }

    // Convert to array if it's a single object
    if (!Array.isArray(models)) {
      models = [models];
    }

    // Process each model and its variants
    models.forEach((model: any) => {
      let modelFiyatArray = model.ModelFiyat;

      if (!modelFiyatArray) {
        console.log('⚠️ No ModelFiyat in model');
        return; // Skip models without ModelFiyat
      }

      // Convert to array if it's a single object
      if (!Array.isArray(modelFiyatArray)) {
        modelFiyatArray = [modelFiyatArray];
      }

      console.log(`📋 Processing ${modelFiyatArray.length} variants`);

      modelFiyatArray.forEach((item: any) => {
        // Skip inactive items (Durum can be number 1 or string "1")
        if (item.Durum !== 1 && item.Durum !== '1') {
          return;
        }

        const modelName = item.Model || 'Unknown';

        // Skip informational rows (ÖTV disclosures, etc.)
        if (modelName.includes('%') ||
            modelName.includes('ÖTV') ||
            modelName.toLowerCase().includes('tüm versiyonlarda') ||
            modelName.toLowerCase().includes('versiyonlarda')) {
          return;
        }

        const govde = item.Govde || '';
        const motorHacmi = item.MotorHacmi || '';
        const vitesTipi = item.VitesTipi || '';
        const motorTipi = item.MotorTipi || '';

        // Price priority: KampanyaliFiyati2 > KampanyaliFiyati1 > ListeFiyati2 > ListeFiyati1
        let fiyat = item.KampanyaliFiyati2 || item.KampanyaliFiyati1 || item.ListeFiyati2 || item.ListeFiyati1 || '';

        // Clean price (remove " TL" suffix and convert to string)
        if (fiyat) {
          fiyat = fiyat.toString().replace(/\s*TL\s*$/i, '').trim();
        }

        // Map motor type to fuel type
        let yakit = '';
        const motorTipiLower = motorTipi.toLowerCase();
        if (motorTipiLower.includes('hybrid') || motorTipiLower.includes('hibrit')) {
          yakit = 'Hybrid';
        } else if (motorTipiLower.includes('benzin')) {
          yakit = 'Benzin';
        } else if (motorTipiLower.includes('dizel') || motorTipiLower.includes('diesel')) {
          yakit = 'Dizel';
        } else if (motorTipiLower.includes('elektrik') || motorTipiLower.includes('electric')) {
          yakit = 'Elektrik';
        }

        if (fiyat) {
          rows.push({
            model: govde,
            trim: modelName,
            engine: motorHacmi,
            transmission: vitesTipi,
            fuel: yakit,
            priceRaw: fiyat,
            priceNumeric: parsePrice(fiyat),
            brand,
          });
        }
      });
    });

    console.log(`✅ Total Toyota rows parsed: ${rows.length}`);
  } catch (error) {
    console.error('❌ Toyota parse error:', error);
  }

  return rows;
};

// Hyundai-specific parser
const parseHyundaiData = (data: any, brand: string): PriceListRow[] => {
  const rows: PriceListRow[] = [];

  try {
    // Hyundai JSON structure: productList[] > yearDetailList[] > priceDetailList[]
    const productList = data?.productList;

    if (!Array.isArray(productList)) {
      console.error('❌ productList is not an array');
      return rows;
    }

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

          // Use suggestedPrice if available, otherwise use price
          const price = item.suggestedPrice || item.price || '';

          if (price && price !== 'N/A') {
            rows.push({
              model: productName,
              trim: trimName,
              engine: powertrainName.replace(trimName, '').trim(),
              transmission: transmission,
              fuel: fuelName,
              priceRaw: price.toString(),
              priceNumeric: parsePrice(price.toString()),
              brand,
            });
          }
        });
      });
    });

    console.log(`✅ Total Hyundai rows parsed: ${rows.length}`);
  } catch (error) {
    console.error('❌ Hyundai parse error:', error);
  }

  return rows;
};

// Ford-specific parser
const parseFordData = (data: any, brand: string): PriceListRow[] => {
  const rows: PriceListRow[] = [];

  try {
    // Ford JSON structure: carPriceList[] > entities[]
    const carPriceList = data?.carPriceList;

    if (!Array.isArray(carPriceList)) {
      console.error('❌ carPriceList is not an array');
      return rows;
    }

    carPriceList.forEach((car: any) => {
      const modelName = car.modelName || 'Unknown';
      const entities = car.entities;

      if (!Array.isArray(entities)) return;

      entities.forEach((entity: any) => {
        const series = entity.series || '';
        const engine = entity.engine || '';
        const gearbox = entity.gearbox || '';
        const fuelType = entity.fuelType || '';

        // Use campaignedTurnkeyPrice if available, otherwise use deliveredTurnkeyListPrice
        const price = entity.campaignedTurnkeyPrice || entity.deliveredTurnkeyListPrice || '';

        if (price) {
          rows.push({
            model: modelName,
            trim: series,
            engine: engine,
            transmission: gearbox,
            fuel: fuelType,
            priceRaw: price.toString(),
            priceNumeric: parsePrice(price.toString()),
            brand,
          });
        }
      });
    });

    console.log(`✅ Total Ford rows parsed: ${rows.length}`);
  } catch (error) {
    console.error('❌ Ford parse error:', error);
  }

  return rows;
};

// Generic parser for other brands
const parseGenericData = (data: any, brand: string): PriceListRow[] => {
  const rows: PriceListRow[] = [];

  // Try to find array structure in the data
  let dataArray: any[] = [];

  if (Array.isArray(data)) {
    dataArray = data;
  } else if (data.models && Array.isArray(data.models)) {
    dataArray = data.models;
  } else if (data.data && Array.isArray(data.data)) {
    dataArray = data.data;
  }

  dataArray.forEach((item: any) => {
    const priceRaw = item.price || item.fiyat || item.liste_fiyati || '';

    rows.push({
      model: item.model || item.name || item.title || 'Unknown',
      trim: item.trim || item.donanim || item.version || '',
      engine: item.engine || item.motor || '',
      transmission: item.transmission || item.vites || item.sanziman || '',
      fuel: item.fuel || item.yakit || '',
      priceRaw: priceRaw.toString(),
      priceNumeric: parsePrice(priceRaw.toString()),
      brand,
    });
  });

  return rows;
};

// Main parser function
export const parseData = (
  data: any,
  brand: string,
  parserType: 'vw' | 'skoda' | 'renault' | 'toyota' | 'hyundai' | 'ford' | 'generic',
  url?: string
): ParsedData => {
  let rows: PriceListRow[] = [];

  try {
    if (parserType === 'vw') {
      rows = parseVWData(data, brand);
    } else if (parserType === 'skoda') {
      rows = parseSkodaData(data, brand);
    } else if (parserType === 'renault') {
      rows = parseRenaultData(data, brand);
    } else if (parserType === 'toyota') {
      rows = parseToyotaData(data, brand);
    } else if (parserType === 'hyundai') {
      rows = parseHyundaiData(data, brand);
    } else if (parserType === 'ford') {
      rows = parseFordData(data, brand);
    } else {
      rows = parseGenericData(data, brand);
    }
  } catch (error) {
    console.error('Parse error:', error);
  }

  return {
    rows,
    lastUpdated: url ? extractLastUpdated(url) : undefined,
    brand,
  };
};
