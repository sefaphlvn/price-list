// Price Trend Modal - Shows historical price chart for a vehicle
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Segmented, Spin, Empty, Typography, Space, Tag } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';

import { PriceListRow, IndexData, StoredData } from '../../types';
import { tokens } from '../../theme/tokens';
import { BRANDS } from '../../config/brands';

const { Title, Text } = Typography;

interface PriceTrendModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: PriceListRow | null;
}

type PeriodType = '30' | '90' | '365';

interface TrendDataPoint {
  date: string;
  dateFormatted: string;
  price: number;
  priceFormatted: string;
}

export default function PriceTrendModal({ open, onClose, vehicle }: PriceTrendModalProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<PeriodType>('30');
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);

  // Fetch historical data for the vehicle
  useEffect(() => {
    if (!open || !vehicle) return;

    const fetchTrendData = async () => {
      setLoading(true);
      const data: TrendDataPoint[] = [];

      try {
        // Get index to find available dates
        const indexResponse = await fetch('./data/index.json');
        if (!indexResponse.ok) {
          setTrendData([]);
          setLoading(false);
          return;
        }

        const indexData: IndexData = await indexResponse.json();

        // Resolve brandId from display name (e.g., "Citroën" -> "citroen")
        const brandLower = vehicle.brand.toLowerCase();
        const brandConfig = BRANDS.find(
          (b) => b.name.toLowerCase() === brandLower || b.id === brandLower
        );
        const brandId = brandConfig?.id ?? brandLower;

        if (!indexData.brands[brandId]) {
          setTrendData([]);
          setLoading(false);
          return;
        }

        const availableDates = indexData.brands[brandId].availableDates;
        const periodDays = parseInt(period);
        const cutoffDate = dayjs().subtract(periodDays, 'day');

        // Filter dates within the period
        const datesInPeriod = availableDates.filter((d) =>
          dayjs(d).isAfter(cutoffDate) || dayjs(d).isSame(cutoffDate)
        );

        // Limit to reasonable number of dates (max 30 for performance)
        const datesToFetch = datesInPeriod.slice(-30);

        // Fetch each date's data
        for (const dateStr of datesToFetch) {
          try {
            const [year, month, day] = dateStr.split('-');
            const url = `./data/${year}/${month}/${brandId}/${day}.json`;
            const response = await fetch(url);

            if (!response.ok) continue;

            const storedData: StoredData = await response.json();

            // Find matching vehicle
            const match = storedData.rows.find(
              (row) =>
                row.model === vehicle.model &&
                row.trim === vehicle.trim &&
                row.engine === vehicle.engine
            );

            if (match && match.priceNumeric > 0) {
              data.push({
                date: dateStr,
                dateFormatted: dayjs(dateStr).format('DD/MM'),
                price: match.priceNumeric,
                priceFormatted: match.priceRaw,
              });
            }
          } catch {
            // Skip failed dates
          }
        }

        // Sort by date
        data.sort((a, b) => a.date.localeCompare(b.date));
        setTrendData(data);
      } catch (error) {
        console.error('Failed to fetch trend data:', error);
        setTrendData([]);
      }

      setLoading(false);
    };

    fetchTrendData();
  }, [open, vehicle, period]);

  // Calculate min/max/avg
  const stats = useMemo(() => {
    if (trendData.length === 0) return null;

    const prices = trendData.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const change = prices.length > 1 ? prices[prices.length - 1] - prices[0] : 0;
    const changePercent = prices[0] > 0 ? (change / prices[0]) * 100 : 0;

    return { min, max, avg, change, changePercent };
  }, [trendData]);

  // Format price for axis
  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  if (!vehicle) return null;

  return (
    <Modal
      title={
        <Space>
          {t('trend.title')}
          <Tag color="blue">{vehicle.brand}</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <div style={{ marginBottom: tokens.spacing.md }}>
        <Title level={5} style={{ margin: 0 }}>
          {vehicle.model}
        </Title>
        <Text type="secondary">{vehicle.trim}</Text>
      </div>

      <Segmented
        value={period}
        onChange={(v) => setPeriod(v as PeriodType)}
        options={[
          { label: t('trend.days30'), value: '30' },
          { label: t('trend.days90'), value: '90' },
          { label: t('trend.days365'), value: '365' },
        ]}
        style={{ marginBottom: tokens.spacing.lg }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: tokens.spacing['2xl'] }}>
          <Spin size="large" />
        </div>
      ) : trendData.length === 0 ? (
        <Empty description={t('trend.noData')} />
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div
              style={{
                display: 'flex',
                gap: tokens.spacing.lg,
                marginBottom: tokens.spacing.lg,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('statistics.priceTrend.minPrice')}
                </Text>
                <br />
                <Text strong style={{ color: tokens.colors.success }}>
                  {stats.min.toLocaleString('tr-TR')} TL
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('statistics.priceTrend.maxPrice')}
                </Text>
                <br />
                <Text strong style={{ color: tokens.colors.error }}>
                  {stats.max.toLocaleString('tr-TR')} TL
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('statistics.priceTrend.avgPrice')}
                </Text>
                <br />
                <Text strong>{Math.round(stats.avg).toLocaleString('tr-TR')} TL</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('statistics.priceTrend.change')}
                </Text>
                <br />
                <Tag color={stats.change >= 0 ? 'error' : 'success'}>
                  {stats.change >= 0 ? '+' : ''}
                  {stats.change.toLocaleString('tr-TR')} TL ({stats.changePercent >= 0 ? '+' : ''}
                  {stats.changePercent.toFixed(1)}%)
                </Tag>
              </div>
            </div>
          )}

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colors.gray[200]} />
              <XAxis
                dataKey="dateFormatted"
                tick={{ fontSize: 12, fill: tokens.colors.gray[500] }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatPrice}
                tick={{ fontSize: 12, fill: tokens.colors.gray[500] }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString('tr-TR')} TL`,
                  t('trend.price'),
                ]}
                labelFormatter={(label) => `${t('trend.date')}: ${label}`}
                contentStyle={{
                  borderRadius: tokens.borderRadius.md,
                  border: `1px solid ${tokens.colors.gray[200]}`,
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={tokens.colors.accent}
                strokeWidth={2}
                dot={{ fill: tokens.colors.accent, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </Modal>
  );
}
