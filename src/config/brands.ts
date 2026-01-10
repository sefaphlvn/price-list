import { BrandConfig } from '../types';

// CORS Proxy for production (GitHub Pages)
// Using Cloudflare Worker (Free 100k req/day)
const CORS_PROXY = 'https://price-list-proxy.sefa-pehlivan.workers.dev/?url=';

export const BRANDS: BrandConfig[] = [
  {
    id: 'volkswagen',
    name: 'Volkswagen',
    url: `${CORS_PROXY}https://binekarac2.vw.com.tr/app/local/fiyatlardata/fiyatlar-test.json?v=202511071652`,
    parser: 'vw',
  },
  {
    id: 'skoda',
    name: 'Škoda',
    url: `${CORS_PROXY}https://www.skoda.com.tr/_next/data/vZMbunJTIP43xbP9kKalr/fiyat-listesi.json`,
    parser: 'skoda',
  },
  {
    id: 'renault',
    name: 'Renault',
    url: `${CORS_PROXY}https://best.renault.com.tr/wp-json/service/v1/CatFiyatData?cat=Binek`,
    parser: 'renault',
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
