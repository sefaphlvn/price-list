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
  // Ford disabled - API requires session cookies which cannot be proxied
  // {
  //   id: 'ford',
  //   name: 'Ford',
  //   url: `${CORS_PROXY}https://www.ford.com.tr/fwebapi/main/carPriceListNewUI?searchparam=&cartype=Binek`,
  //   parser: 'ford',
  // },
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
