// Generic types for multi-brand price list system

export interface BrandConfig {
  id: string;
  name: string;
  url: string;
  parser: 'vw' | 'skoda' | 'renault' | 'toyota' | 'hyundai' | 'ford' | 'generic'; // Parser strategy
  responseType?: 'json' | 'xml'; // Response type (default: json)
  logo?: string;
}

export interface PriceListRow {
  model: string;
  trim: string;
  engine: string;
  transmission: string;
  fuel: string;
  priceRaw: string;
  priceNumeric: number;
  brand: string;
  [key: string]: string | number; // Allow additional fields
}

export interface ParsedData {
  rows: PriceListRow[];
  lastUpdated?: string;
  brand: string;
}

export interface FetchState {
  loading: boolean;
  error: string | null;
  data: ParsedData | null;
}
