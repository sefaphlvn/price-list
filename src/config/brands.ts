import { BrandConfig } from '../types';

// CORS Proxy for production (GitHub Pages)
// Using Cloudflare Worker (Free 100k req/day)
const CORS_PROXY = 'https://price-list-proxy.sefa-pehlivan.workers.dev/?url=';

// Direct URLs for server-side collection (no CORS proxy needed)
export const BRAND_DIRECT_URLS: Record<string, string> = {
  volkswagen: 'https://binekarac2.vw.com.tr/app/local/fiyatlardata/fiyatlar-test.json?v=202511071652',
  skoda: 'https://www.skoda.com.tr/_next/data/JqOPjpaBnXsRA79zGw7R6/fiyat-listesi.json',
  renault: 'https://best.renault.com.tr/wp-json/service/v1/CatFiyatData?cat=Binek',
  toyota: 'https://turkiye.toyota.com.tr/middle/fiyat-listesi/fiyat_v3.xml',
  hyundai: 'https://www.hyundai.com/wsvc/tr/spa/pricelist/list?loc=TR&lan=tr',
  fiat: 'https://kampanya.fiat.com.tr/Pdf/Fiyatlar/OtomobilFiyatListesi.pdf',
  peugeot: 'https://kampanya.peugeot.com.tr/fiyat-listesi/fiyatlar.pdf',
  byd: 'https://www.bydauto.com.tr/fiyat-listesi',
  opel: 'https://www.opel.com.tr/araclar', // Base URL - multi-URL brand
  citroen: 'https://talep.citroen.com.tr/fiyat-listesi', // Page URL - uses dynamic build ID
  bmw: 'https://www.borusanotomotiv.com/bmw/stage2/fiyat-listesi/static-fiyat-listesi-v2.aspx',
  mercedes: 'https://pladmin.mercedes-benz.com.tr/api/product/searchByCategoryCode', // Base API URL - multi-URL brand
  ford: 'https://www.ford.com.tr/fwebapi/main/carPriceListNewUI?searchparam=&cartype=Binek',
  dacia: 'https://best.renault.com.tr/wp-json/service/v1/CatFiyatData?brand=DACIA&cat=',
  nissan: 'https://www.nissan.com.tr/fiyat-listesi/{year}-price-list.html', // {year} replaced dynamically
  honda: 'https://www.honda.com.tr/otomobil/otomobil-fiyat-listesi-{year}', // {year} replaced dynamically
  seat: 'https://www.seat.com.tr/firsatlar/fiyat-listesi',
  kia: 'https://www.kia.com/tr/satis-merkezi/fiyat-listesi.html',
  volvo: 'https://www.volvocars.com/tr/l/fiyat-listesi/', // HTML page with dynamic PDF link
};

// Multiple URLs for brands with per-model pages
export const BRAND_MULTI_URLS: Record<string, string[]> = {
  opel: [
    'https://fiyatlisteleri.opel.com.tr/arac/corsa',
    'https://fiyatlisteleri.opel.com.tr/arac/corsa-e',
    'https://fiyatlisteleri.opel.com.tr/arac/yeni-frontera-hybrid',
    'https://fiyatlisteleri.opel.com.tr/arac/frontera-elektrik',
    'https://fiyatlisteleri.opel.com.tr/arac/yeni-mokka',
    'https://fiyatlisteleri.opel.com.tr/arac/astra',
    'https://fiyatlisteleri.opel.com.tr/arac/astra-elektrik',
    'https://fiyatlisteleri.opel.com.tr/arac/yeni-grandland',
    'https://fiyatlisteleri.opel.com.tr/arac/yeni-grandland-elektrik',
  ],
  mercedes: [
    // A-Class, CLA, AMG GT
    'w177-fl',   // A-Class
    'c118-fl',   // CLA Coupé
    'x118-fl',   // CLA Shooting Brake
    'x290-fl',   // AMG GT 4-Door
    // C-Class
    'w206',      // C-Class Sedan
    's206',      // C-Class Estate
    // E-Class
    'w214',      // E-Class Sedan
    'c236',      // E-Class Coupé
    'a236',      // E-Class Cabriolet
    // S-Class, Maybach
    'wv223',     // S-Class
    'z223',      // Mercedes-Maybach S-Class
    // EQ Electric
    'v295',      // EQE
    'v297',      // EQS
    // SUV
    'h243-fl',   // GLA
    'h247-fl',   // GLB
    'x247-fl',   // GLC (old)
    'x254',      // GLC (new)
    'c254',      // GLC Coupé
    'w465',      // G-Class
    // Sports / Luxury
    'r232',      // SL
    'z232',      // Mercedes-Maybach SL
    'c192',      // CLE Coupé
    'c174',      // B-Class
  ],
};

export const BRANDS: BrandConfig[] = [
  {
    id: 'volkswagen',
    name: 'Volkswagen',
    url: `${CORS_PROXY}${BRAND_DIRECT_URLS.volkswagen}`,
    parser: 'vw',
  },
  {
    id: 'skoda',
    name: 'Škoda',
    url: `${CORS_PROXY}${BRAND_DIRECT_URLS.skoda}`,
    parser: 'skoda',
  },
  {
    id: 'renault',
    name: 'Renault',
    url: `${CORS_PROXY}${BRAND_DIRECT_URLS.renault}`,
    parser: 'renault',
  },
  {
    id: 'toyota',
    name: 'Toyota',
    url: `${CORS_PROXY}${BRAND_DIRECT_URLS.toyota}`,
    parser: 'toyota',
    responseType: 'xml',
  },
  {
    id: 'hyundai',
    name: 'Hyundai',
    url: `${CORS_PROXY}${BRAND_DIRECT_URLS.hyundai}`,
    parser: 'hyundai',
  },
  {
    id: 'fiat',
    name: 'Fiat',
    url: BRAND_DIRECT_URLS.fiat,
    parser: 'fiat',
    responseType: 'pdf',
  },
  {
    id: 'peugeot',
    name: 'Peugeot',
    url: BRAND_DIRECT_URLS.peugeot,
    parser: 'peugeot',
    responseType: 'pdf',
  },
  {
    id: 'byd',
    name: 'BYD',
    url: BRAND_DIRECT_URLS.byd,
    parser: 'byd',
    responseType: 'html',
  },
  {
    id: 'opel',
    name: 'Opel',
    url: BRAND_DIRECT_URLS.opel,
    urls: BRAND_MULTI_URLS.opel,
    parser: 'opel',
    responseType: 'html',
  },
  {
    id: 'citroen',
    name: 'Citroën',
    url: BRAND_DIRECT_URLS.citroen,
    parser: 'citroen',
    responseType: 'json',
  },
  {
    id: 'bmw',
    name: 'BMW',
    url: BRAND_DIRECT_URLS.bmw,
    parser: 'bmw',
    responseType: 'html',
  },
  {
    id: 'mercedes',
    name: 'Mercedes-Benz',
    url: BRAND_DIRECT_URLS.mercedes,
    urls: BRAND_MULTI_URLS.mercedes,
    parser: 'mercedes',
    responseType: 'json',
  },
  {
    id: 'ford',
    name: 'Ford',
    url: BRAND_DIRECT_URLS.ford,
    parser: 'ford',
    responseType: 'json',
  },
  {
    id: 'dacia',
    name: 'Dacia',
    url: `${CORS_PROXY}${BRAND_DIRECT_URLS.dacia}`,
    parser: 'renault', // Same API structure as Renault
  },
  {
    id: 'nissan',
    name: 'Nissan',
    url: BRAND_DIRECT_URLS.nissan,
    parser: 'nissan',
    responseType: 'html',
  },
  {
    id: 'honda',
    name: 'Honda',
    url: BRAND_DIRECT_URLS.honda,
    parser: 'honda',
    responseType: 'html',
  },
  {
    id: 'seat',
    name: 'SEAT',
    url: BRAND_DIRECT_URLS.seat,
    parser: 'seat',
    responseType: 'html',
  },
  {
    id: 'kia',
    name: 'Kia',
    url: BRAND_DIRECT_URLS.kia,
    parser: 'kia',
    responseType: 'html',
  },
  {
    id: 'volvo',
    name: 'Volvo',
    url: BRAND_DIRECT_URLS.volvo,
    parser: 'volvo',
    responseType: 'pdf',
  },
  // Future brands can be added here:
  // {
  //   id: 'audi',
  //   name: 'Audi',
  //   url: `${CORS_PROXY}https://example.com/audi-prices.json`,
  //   parser: 'generic',
  // },
];

export const getBrandById = (id: string): BrandConfig | undefined => {
  return BRANDS.find(brand => brand.id === id);
};
