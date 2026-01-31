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

  // VW-specific extended fields
  netPrice?: number;                  // Net price before taxes (KDV hariç)
  otvAmount?: number;                 // ÖTV amount in TL
  kdvAmount?: number;                 // KDV (VAT) amount in TL
  mtvAmount?: number;                 // MTV (motor vehicle tax) in TL
  trafficRegistrationFee?: number;    // Traffic registration fee
  notaryFee?: number;                 // Notary fee
  origin?: string;                    // Country of origin (menşei)
  optionalEquipment?: {               // Optional equipment with prices
    name: string;
    price: number;
  }[];

  // Toyota-specific extended fields
  otvIncentivePrice?: number;         // ÖTV teşvikli fiyat (hurda indirimi)

  // Fiat-specific & generic EV/powertrain fields
  batteryCapacity?: number;           // Battery capacity in kWh (for EVs)
  powerKW?: number;                   // Power in kW
  powerHP?: number;                   // Power in HP
  engineDisplacement?: string;        // Engine displacement (e.g., "1.6L", "1.4L")
  engineType?: string;                // Engine type (e.g., "M.Jet", "Fire", "MHEV")
  hasGSR?: boolean;                   // Fiat GSR feature
  hasTractionPlus?: boolean;          // Fiat Traction+ feature
  isElectric?: boolean;               // Is electric vehicle
  isHybrid?: boolean;                 // Is hybrid vehicle

  // Peugeot-specific & generic transmission/commercial fields
  transmissionType?: string;          // Transmission code (e.g., "EAT8", "eDCS6", "MT6", "DCT")
  emissionStandard?: string;          // Emission standard (e.g., "€6eBIS", "Euro 6d")
  vehicleCategory?: string;           // Vehicle category ("Binek", "Ticari")
  vehicleLength?: string;             // Vehicle length for vans (e.g., "L2", "L3", "L4H2")
  cargoVolume?: number;               // Cargo volume in m³ (for commercial vehicles)
  seatingCapacity?: string;           // Seating capacity (e.g., "8+1", "16+1")
  hasPanoramicRoof?: boolean;         // Has panoramic roof

  // BYD-specific & generic EV fields
  driveType?: string;                 // Drive type ("RWD", "AWD", "FWD")
  wltpRange?: number;                 // WLTP range in km (for EVs)

  // Opel-specific & generic EV fields
  hasLongRange?: boolean;             // Long range battery version (Uzun Menzil)

  // BMW-specific & generic hybrid fields
  powerHPSecondary?: number;          // Secondary power for hybrids (electric boost)
  isMildHybrid?: boolean;             // Is mild hybrid (48V system)
  isPlugInHybrid?: boolean;           // Is plug-in hybrid (rechargeable)

  // Mercedes-specific field
  isAMG?: boolean;                    // Is AMG performance model (not just AMG Line trim)

  [key: string]: string | number | boolean | { name: string; price: number }[] | undefined; // Allow additional fields
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
