/**
 * Shared types for data pipeline
 * Used by both collect.ts and all generators
 */

export interface PriceListRow {
  // Core fields (required)
  model: string;
  trim: string;
  engine: string;
  transmission: string;
  fuel: string;
  priceRaw: string;
  priceNumeric: number;
  brand: string;

  // Extended fields (optional - available from some APIs)
  modelYear?: number | string;        // Model year: 2024, 2025, "MY26"
  otvRate?: number;                   // ÖTV tax rate percentage
  priceListNumeric?: number;          // Original list price (if different from campaign)
  priceCampaignNumeric?: number;      // Campaign/promotional price
  fuelConsumption?: string;           // L/100km or kWh/100km
  monthlyLease?: number;              // Monthly leasing price

  [key: string]: string | number | undefined; // Allow additional fields
}

export interface StoredData {
  collectedAt: string;
  brand: string;
  brandId: string;
  rowCount: number;
  rows: PriceListRow[];
}

export interface BrandIndexData {
  name: string;
  availableDates: string[];
  latestDate: string;
  totalRecords: number;
}

export interface IndexData {
  lastUpdated: string;
  brands: {
    [brandId: string]: BrandIndexData;
  };
}
