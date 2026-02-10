// PriceTrendBadge - Compact inline price trend indicator with sparkline
// Uses single backend /trend endpoint instead of fetching N historical dates

import { useState, useMemo, useCallback, memo } from 'react';
import { Tooltip, Tag, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined, LineChartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { PriceListRow } from '../../types';
import { BRANDS } from '../../config/brands';
import { tokens } from '../../theme/tokens';
import { fetchDedup, DATA_URLS } from '../../utils/fetchData';

interface PriceTrendBadgeProps {
  vehicle: PriceListRow;
  showSparkline?: boolean;
  compact?: boolean;
}

interface TrendDataPoint {
  date: string;
  price: number;
}

interface TrendResponse {
  points: TrendDataPoint[] | null;
}

interface TrendCache {
  data: TrendDataPoint[];
  timestamp: number;
}

// Global cache to avoid refetching for same vehicle (bounded to prevent memory leak)
const trendCache = new Map<string, TrendCache>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 200;

// Mini Sparkline SVG component
const Sparkline = memo(({ data, width = 40, height = 16 }: { data: number[]; width?: number; height?: number }) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const normalized = data.map(d => (d - min) / range);

  const stepX = width / (data.length - 1);
  const points = normalized.map((y, i) => `${i * stepX},${height - y * height}`);
  const pathD = `M${points.join(' L')}`;

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
  const [trendData, setTrendData] = useState<TrendDataPoint[] | null>(null);
  const [error, setError] = useState(false);
  const [fetched, setFetched] = useState(false);

  const cacheKey = useMemo(() => {
    const brandLower = vehicle.brand.toLowerCase();
    const brandConfig = BRANDS.find(
      (b) => b.name.toLowerCase() === brandLower || b.id === brandLower
    );
    const brandId = brandConfig?.id ?? brandLower;
    return `${brandId}-${vehicle.model}-${vehicle.trim}-${vehicle.engine}`;
  }, [vehicle.brand, vehicle.model, vehicle.trim, vehicle.engine]);

  // Fetch trend data from backend - single API call
  const fetchTrendData = useCallback(async () => {
    if (fetched || loading) return;

    // Check cache first
    const cached = trendCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setTrendData(cached.data);
      setFetched(true);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      // Resolve brandId from display name
      const brandLower = vehicle.brand.toLowerCase();
      const brandConfig = BRANDS.find(
        (b) => b.name.toLowerCase() === brandLower || b.id === brandLower
      );
      const brandId = brandConfig?.id ?? brandLower;

      // Single API call - backend does the aggregation
      const url = DATA_URLS.trend(brandId, vehicle.model, vehicle.trim, vehicle.engine);
      const response = await fetchDedup<TrendResponse>(url);
      const points = response.points || [];

      // Cache the result (evict oldest if at capacity)
      if (trendCache.size >= MAX_CACHE_SIZE) {
        const oldest = trendCache.keys().next().value;
        if (oldest !== undefined) trendCache.delete(oldest);
      }
      trendCache.set(cacheKey, { data: points, timestamp: Date.now() });
      setTrendData(points);
    } catch {
      setError(true);
    }

    setLoading(false);
    setFetched(true);
  }, [fetched, loading, cacheKey, vehicle.brand, vehicle.model, vehicle.trim, vehicle.engine]);

  // Calculate trend stats
  const stats = useMemo(() => {
    if (!trendData || trendData.length < 2) return null;

    const prices = trendData.map(d => d.price);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

    return { change, changePercent, prices };
  }, [trendData]);

  // Not yet fetched - show placeholder that fetches on hover
  if (!fetched && !loading) {
    return (
      <Tooltip title={t('trend.hoverToLoad', 'Trend icin ustune gelin')}>
        <Tag
          style={{ opacity: 0.4, cursor: 'pointer', fontSize: 11, padding: '0 4px' }}
          onMouseEnter={fetchTrendData}
          onClick={fetchTrendData}
        >
          <LineChartOutlined />
        </Tag>
      </Tooltip>
    );
  }

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
        <strong>{t('trend.last30Days', 'Son 30 Gun')}</strong>
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
