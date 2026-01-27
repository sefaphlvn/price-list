/**
 * useIntelData Hook
 * Loads and caches Intel Mode data from precomputed JSON files
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseIntelDataOptions {
  enabled?: boolean;
}

interface UseIntelDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cache for Intel data to avoid refetching
const dataCache: Map<string, { data: unknown; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useIntelData<T>(
  dataType: 'events' | 'architecture' | 'promos' | 'lifecycle' | 'gaps',
  options: UseIntelDataOptions = {}
): UseIntelDataResult<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!enabled) {
      setData(null);
      setLoading(false);
      return;
    }

    const cacheKey = `intel-${dataType}`;
    const cached = dataCache.get(cacheKey);

    // Check cache validity
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data as T);
      setLoading(false);
      return;
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`./data/intel/${dataType}.json`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${dataType} data: ${response.status}`);
      }

      const result = await response.json();

      // Update cache
      dataCache.set(cacheKey, { data: result, timestamp: Date.now() });

      // Only update state if not aborted
      if (!controller.signal.aborted) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (!controller.signal.aborted) {
        setError(message);
        setData(null);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [dataType, enabled]);

  useEffect(() => {
    fetchData();

    // Cleanup: abort on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Typed hooks for specific data types
export interface EventsData {
  generatedAt: string;
  date: string;
  previousDate: string;
  summary: {
    totalEvents: number;
    newVehicles: number;
    removedVehicles: number;
    priceIncreases: number;
    priceDecreases: number;
    avgPriceChange: number;
    avgPriceChangePercent: number;
  };
  events: PriceEvent[];
  volatility: {
    byBrand: VolatilityMetric[];
    byModel: VolatilityMetric[];
  };
  bigMoves: {
    topIncreases: PriceEvent[];
    topDecreases: PriceEvent[];
  };
}

export interface PriceEvent {
  id: string;
  type: 'new' | 'removed' | 'price_increase' | 'price_decrease';
  vehicleId: string;
  brand: string;
  brandId: string;
  model: string;
  trim: string;
  engine: string;
  fuel: string;
  transmission: string;
  oldPrice?: number;
  newPrice?: number;
  oldPriceFormatted?: string;
  newPriceFormatted?: string;
  priceChange?: number;
  priceChangePercent?: number;
  date: string;
  previousDate?: string;
}

export interface VolatilityMetric {
  id: string;
  name: string;
  changeCount: number;
  avgChange: number;
  avgChangePercent: number;
  increaseCount: number;
  decreaseCount: number;
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

// Gaps Data Types
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

// Promos Data Types
export interface PriceDrop {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  trim: string;
  engine: string;
  fuel: string;
  transmission: string;
  currentPrice: number;
  currentPriceFormatted: string;
  peakPrice: number;
  peakPriceFormatted: string;
  peakDate: string;
  dropAmount: number;
  dropPercent: number;
  daysSincePeak: number;
  priceHistory: { date: string; price: number }[];
}

export interface RecentDrop {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  trim: string;
  engine: string;
  currentPrice: number;
  previousPrice: number;
  dropAmount: number;
  dropPercent: number;
  date: string;
  previousDate: string;
}

export interface PromosData {
  generatedAt: string;
  date: string;
  summary: {
    totalPriceDrops: number;
    totalRecentDrops: number;
    avgDropPercent: number;
    maxDropPercent: number;
    brandsWithDrops: number;
  };
  priceDrops: PriceDrop[];
  recentDrops: RecentDrop[];
  brandSummary: {
    brandId: string;
    brand: string;
    dropCount: number;
    avgDropPercent: number;
  }[];
}

// Lifecycle Data Types
export interface ModelYearTransition {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  oldYear: string;
  newYear: string;
  oldEntryPrice: number;
  newEntryPrice: number;
  priceDelta: number;
  priceDeltaPercent: number;
  transitionDate: string;
  trimCount: number;
}

export interface EntryPriceDelta {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  currentEntryPrice: number;
  previousEntryPrice: number;
  delta: number;
  deltaPercent: number;
  currentDate: string;
  previousDate: string;
  daysBetween: number;
}

export interface StaleModel {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  lastUpdateDate: string;
  daysSinceUpdate: number;
  currentEntryPrice: number;
  trimCount: number;
}

export interface ModelInfo {
  brand: string;
  brandId: string;
  model: string;
  entryPrice: number;
  topPrice: number;
  trimCount: number;
  fuelTypes: string[];
  lastUpdated: string;
}

export interface LifecycleData {
  generatedAt: string;
  date: string;
  summary: {
    totalModels: number;
    totalTransitions: number;
    totalStaleModels: number;
    avgEntryPriceDelta: number;
  };
  modelYearTransitions: ModelYearTransition[];
  entryPriceDeltas: EntryPriceDelta[];
  staleModels: StaleModel[];
  allModels: ModelInfo[];
}

// Typed hooks for specific data types
export function useEventsData(options?: UseIntelDataOptions) {
  return useIntelData<EventsData>('events', options);
}

export function useArchitectureData(options?: UseIntelDataOptions) {
  return useIntelData<ArchitectureData>('architecture', options);
}

export function useGapsData(options?: UseIntelDataOptions) {
  return useIntelData<GapsData>('gaps', options);
}

export function usePromosData(options?: UseIntelDataOptions) {
  return useIntelData<PromosData>('promos', options);
}

export function useLifecycleData(options?: UseIntelDataOptions) {
  return useIntelData<LifecycleData>('lifecycle', options);
}

// Clear cache utility
export function clearIntelCache(): void {
  dataCache.clear();
}
