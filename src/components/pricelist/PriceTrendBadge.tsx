// PriceTrendBadge - Compact inline price trend indicator with sparkline
// Shows 30-day trend with mini chart and percentage change

import { useState, useEffect, useMemo, memo } from 'react';
import { Tooltip, Tag, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { PriceListRow, IndexData, StoredData } from '../../types';
import { BRANDS } from '../../config/brands';
import { tokens } from '../../theme/tokens';

// Create normalized key for vehicle matching
function createRowKey(model: string, trim: string, engine: string): string {
  return `${model}-${trim}-${engine}`.toLowerCase().replace(/\s+/g, '-');
}

interface PriceTrendBadgeProps {
  vehicle: PriceListRow;
  showSparkline?: boolean;
  compact?: boolean;
}

interface TrendDataPoint {
  date: string;
  price: number;
}

interface TrendCache {
  data: TrendDataPoint[];
  timestamp: number;
}

// Global cache to avoid refetching for same vehicle
const trendCache = new Map<string, TrendCache>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Mini Sparkline SVG component
const Sparkline = memo(({ data, width = 40, height = 16 }: { data: number[]; width?: number; height?: number }) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Normalize data to 0-1 range
  const normalized = data.map(d => (d - min) / range);

  // Create SVG path
  const stepX = width / (data.length - 1);
  const points = normalized.map((y, i) => `${i * stepX},${height - y * height}`);
  const pathD = `M${points.join(' L')}`;

  // Determine color based on trend
  const isUp = data[data.length - 1] > data[0];
  const isFlat = data[data.length - 1] === data[0];
  const color = isFlat ? tokens.colors.gray[400] : isUp ? tokens.colors.error : tokens.colors.success;

  return (
    <svg width={width} height={height} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

Sparkline.displayName = 'Sparkline';

function PriceTrendBadge({ vehicle, showSparkline = true, compact = false }: PriceTrendBadgeProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [error, setError] = useState(false);

  const vehicleKey = useMemo(
    () => createRowKey(vehicle.model, vehicle.trim, vehicle.engine),
    [vehicle.model, vehicle.trim, vehicle.engine]
  );

  const cacheKey = useMemo(
    () => `${vehicle.brand}-${vehicleKey}`,
    [vehicle.brand, vehicleKey]
  );

  useEffect(() => {
    const fetchTrendData = async () => {
      // Check cache first
      const cached = trendCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setTrendData(cached.data);
        return;
      }

      setLoading(true);
      setError(false);
      const data: TrendDataPoint[] = [];

      try {
        // Get index to find available dates
        const indexResponse = await fetch('./data/index.json');
        if (!indexResponse.ok) {
          setError(true);
          setLoading(false);
          return;
        }

        const indexData: IndexData = await indexResponse.json();

        // Resolve brandId from display name
        const brandLower = vehicle.brand.toLowerCase();
        const brandConfig = BRANDS.find(
          (b) => b.name.toLowerCase() === brandLower || b.id === brandLower
        );
        const brandId = brandConfig?.id ?? brandLower;

        if (!indexData.brands[brandId]) {
          setError(true);
          setLoading(false);
          return;
        }

        const availableDates = indexData.brands[brandId].availableDates;

        // Get last 30 days of data (limit to 10 for performance)
        const recentDates = availableDates.slice(-10);

        // Fetch each date's data
        for (const dateStr of recentDates) {
          try {
            const [year, month, day] = dateStr.split('-');
            const url = `./data/${year}/${month}/${brandId}/${day}.json`;
            const response = await fetch(url);

            if (!response.ok) continue;

            const storedData: StoredData = await response.json();

            // Build a Map for consistent matching
            const rowMap = new Map<string, PriceListRow>();
            for (const row of storedData.rows) {
              rowMap.set(createRowKey(row.model, row.trim, row.engine), row);
            }

            // Find matching vehicle
            const match = rowMap.get(vehicleKey);

            if (match && match.priceNumeric > 0) {
              data.push({
                date: dateStr,
                price: match.priceNumeric,
              });
            }
          } catch {
            // Skip failed dates
          }
        }

        // Sort by date
        data.sort((a, b) => a.date.localeCompare(b.date));

        // Cache the result
        trendCache.set(cacheKey, { data, timestamp: Date.now() });
        setTrendData(data);
      } catch {
        setError(true);
      }

      setLoading(false);
    };

    fetchTrendData();
  }, [cacheKey, vehicleKey, vehicle.brand]);

  // Calculate trend stats
  const stats = useMemo(() => {
    if (trendData.length < 2) return null;

    const prices = trendData.map(d => d.price);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

    return { change, changePercent, prices };
  }, [trendData]);

  if (loading) {
    return <Spin size="small" />;
  }

  if (error || !stats) {
    return compact ? null : (
      <Tooltip title={t('trend.noData')}>
        <Tag style={{ opacity: 0.5 }}>
          <MinusOutlined />
        </Tag>
      </Tooltip>
    );
  }

  const isUp = stats.change > 0;
  const isFlat = stats.change === 0;

  const tooltipContent = (
    <div style={{ minWidth: 120 }}>
      <div style={{ marginBottom: 4 }}>
        <strong>{t('trend.last30Days', 'Son 30 Gün')}</strong>
      </div>
      {showSparkline && stats.prices.length > 1 && (
        <div style={{ marginBottom: 4 }}>
          <Sparkline data={stats.prices} width={100} height={24} />
        </div>
      )}
      <div style={{ fontSize: 12 }}>
        {isUp ? '+' : ''}{stats.change.toLocaleString('tr-TR')} TL
        <br />
        ({isUp ? '+' : ''}{stats.changePercent.toFixed(1)}%)
      </div>
    </div>
  );

  if (compact) {
    return (
      <Tooltip title={tooltipContent}>
        <Tag
          color={isFlat ? 'default' : isUp ? 'error' : 'success'}
          style={{ cursor: 'pointer', fontSize: 11, padding: '0 4px' }}
        >
          {isFlat ? (
            <MinusOutlined />
          ) : isUp ? (
            <ArrowUpOutlined />
          ) : (
            <ArrowDownOutlined />
          )}
          {' '}
          {Math.abs(stats.changePercent).toFixed(1)}%
        </Tag>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipContent}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
        {showSparkline && stats.prices.length > 1 && (
          <Sparkline data={stats.prices} width={40} height={16} />
        )}
        <Tag
          color={isFlat ? 'default' : isUp ? 'error' : 'success'}
          style={{ margin: 0, fontSize: 11 }}
        >
          {isFlat ? (
            <MinusOutlined />
          ) : isUp ? (
            <ArrowUpOutlined />
          ) : (
            <ArrowDownOutlined />
          )}
          {' '}
          {isUp ? '+' : ''}{stats.changePercent.toFixed(1)}%
        </Tag>
      </div>
    </Tooltip>
  );
}

export default memo(PriceTrendBadge);
