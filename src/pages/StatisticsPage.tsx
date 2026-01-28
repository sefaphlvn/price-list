// Statistics Page - Price analysis, segment comparisons, and trends
// Uses historical data (no live API calls)
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Row, Col, Typography, Card, Spin, Empty, Segmented } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { getBrandById } from '../config/brands';
import { PriceListRow, IndexData, StoredData } from '../types';
import { tokens } from '../theme/tokens';
import { staggerContainer, staggerItem } from '../theme/animations';

const { Title, Text } = Typography;

// Price segment definitions
const PRICE_SEGMENTS = [
  { key: 'budget', min: 0, max: 1500000, color: tokens.colors.success },
  { key: 'mid', min: 1500000, max: 3000000, color: tokens.colors.accent },
  { key: 'premium', min: 3000000, max: 5000000, color: tokens.colors.warning },
  { key: 'luxury', min: 5000000, max: Infinity, color: tokens.colors.error },
];

// Fuel type colors
const FUEL_COLORS: { [key: string]: string } = {
  Benzin: tokens.colors.fuel.benzin,
  Dizel: tokens.colors.fuel.dizel,
  Elektrik: tokens.colors.fuel.elektrik,
  Hybrid: tokens.colors.fuel.hybrid,
  'Plug-in Hybrid': tokens.colors.fuel.pluginHybrid,
};

export default function StatisticsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<Map<string, StoredData>>(new Map());
  const [activeChart, setActiveChart] = useState<'brand' | 'fuel' | 'segment'>('brand');

  // Fetch data from historical files
  useEffect(() => {
    const fetchAllBrands = async () => {
      setLoading(true);
      const dataMap = new Map<string, StoredData>();

      try {
        // First fetch the index to get latest dates
        const indexResponse = await fetch('./data/index.json');
        if (!indexResponse.ok) {
          setLoading(false);
          return;
        }

        const indexData: IndexData = await indexResponse.json();

        // Fetch latest data for each brand
        await Promise.all(
          Object.keys(indexData.brands).map(async (brandId) => {
            try {
              const brandInfo = indexData.brands[brandId];
              const latestDate = brandInfo.latestDate;
              const [year, month, day] = latestDate.split('-');
              const url = `./data/${year}/${month}/${brandId}/${day}.json`;

              const response = await fetch(url);
              if (response.ok) {
                const storedData: StoredData = await response.json();
                dataMap.set(brandId, storedData);
              }
            } catch (error) {
              console.error(`Failed to fetch ${brandId}:`, error);
            }
          })
        );
      } catch (error) {
        console.error('Failed to fetch index:', error);
      }

      setAllData(dataMap);
      setLoading(false);
    };

    fetchAllBrands();
  }, []);

  // Combine all rows
  const allRows = useMemo(() => {
    const rows: PriceListRow[] = [];
    allData.forEach((data) => {
      rows.push(...data.rows);
    });
    return rows;
  }, [allData]);

  // Brand average prices
  const brandAverages = useMemo(() => {
    const averages: { brand: string; average: number; count: number }[] = [];

    allData.forEach((data, brandId) => {
      const brand = getBrandById(brandId);
      if (brand && data.rows.length > 0) {
        const sum = data.rows.reduce((acc, row) => acc + row.priceNumeric, 0);
        averages.push({
          brand: brand.name,
          average: Math.round(sum / data.rows.length),
          count: data.rows.length,
        });
      }
    });

    return averages.sort((a, b) => a.average - b.average);
  }, [allData]);

  // Fuel distribution
  const fuelDistribution = useMemo(() => {
    const fuelCounts: { [key: string]: number } = {};

    allRows.forEach((row) => {
      if (row.fuel) {
        fuelCounts[row.fuel] = (fuelCounts[row.fuel] || 0) + 1;
      }
    });

    return Object.entries(fuelCounts)
      .map(([name, value]) => ({
        name,
        value,
        color: FUEL_COLORS[name] || tokens.colors.gray[400],
      }))
      .sort((a, b) => b.value - a.value);
  }, [allRows]);

  // Price segment distribution
  const segmentDistribution = useMemo(() => {
    const segments = PRICE_SEGMENTS.map((seg) => ({
      name: t(`segments.priceRanges.${seg.key}`),
      value: 0,
      color: seg.color,
    }));

    allRows.forEach((row) => {
      const segIndex = PRICE_SEGMENTS.findIndex(
        (seg) => row.priceNumeric >= seg.min && row.priceNumeric < seg.max
      );
      if (segIndex >= 0) {
        segments[segIndex].value += 1;
      }
    });

    return segments.filter((s) => s.value > 0);
  }, [allRows, t]);

  // Price range by brand
  const priceRangeByBrand = useMemo(() => {
    const ranges: { brand: string; min: number; max: number; avg: number }[] = [];

    allData.forEach((data, brandId) => {
      const brand = getBrandById(brandId);
      if (brand && data.rows.length > 0) {
        const prices = data.rows.map((r) => r.priceNumeric);
        ranges.push({
          brand: brand.name,
          min: Math.min(...prices),
          max: Math.max(...prices),
          avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        });
      }
    });

    return ranges;
  }, [allData]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="enter"
      style={{ padding: tokens.spacing.lg }}
    >
      {/* Page Header */}
      <motion.div variants={staggerItem} style={{ marginBottom: tokens.spacing.xl }}>
        <Title level={2} style={{ marginBottom: tokens.spacing.xs }}>
          {t('statistics.title')}
        </Title>
        <Text type="secondary">{t('statistics.subtitle')}</Text>
      </motion.div>

      {allRows.length === 0 ? (
        <Empty description={t('common.noData')} />
      ) : (
        <>
          {/* Chart Type Selector */}
          <motion.div variants={staggerItem} style={{ marginBottom: tokens.spacing.xl }}>
            <Segmented
              value={activeChart}
              onChange={(value) => setActiveChart(value as typeof activeChart)}
              options={[
                { label: t('statistics.priceComparison.avgByBrand'), value: 'brand' },
                { label: t('common.fuel'), value: 'fuel' },
                { label: t('statistics.segmentAnalysis.byPriceRange'), value: 'segment' },
              ]}
              size="large"
            />
          </motion.div>

          <Row gutter={[24, 24]}>
            {/* Main Chart */}
            <Col xs={24} lg={16}>
              <motion.div variants={staggerItem}>
                <Card
                  title={
                    activeChart === 'brand'
                      ? t('statistics.priceComparison.avgByBrand')
                      : activeChart === 'fuel'
                      ? t('common.fuel')
                      : t('statistics.segmentAnalysis.byPriceRange')
                  }
                  style={{ borderRadius: tokens.borderRadius.lg }}
                >
                  {activeChart === 'brand' && (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={brandAverages} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={tokens.colors.gray[200]} />
                        <XAxis
                          type="number"
                          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        />
                        <YAxis type="category" dataKey="brand" width={100} />
                        <Tooltip
                          formatter={(value: number) => formatPrice(value)}
                          labelStyle={{ color: tokens.colors.gray[700] }}
                        />
                        <Bar dataKey="average" fill={tokens.colors.accent} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {activeChart === 'fuel' && (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={fuelDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {fuelDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  {activeChart === 'segment' && (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={segmentDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {segmentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </motion.div>
            </Col>

            {/* Side Stats */}
            <Col xs={24} lg={8}>
              <motion.div variants={staggerItem}>
                <Card
                  title={t('statistics.priceComparison.priceRange')}
                  style={{ borderRadius: tokens.borderRadius.lg, marginBottom: tokens.spacing.lg }}
                >
                  {priceRangeByBrand.map((item) => (
                    <div
                      key={item.brand}
                      style={{
                        padding: `${tokens.spacing.sm} 0`,
                        borderBottom: `1px solid ${tokens.colors.gray[100]}`,
                      }}
                    >
                      <Text strong>{item.brand}</Text>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: tokens.spacing.xs,
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t('statistics.priceTrend.minPrice')}:{' '}
                          <span style={{ color: tokens.colors.success }}>
                            {formatPrice(item.min)}
                          </span>
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t('statistics.priceTrend.maxPrice')}:{' '}
                          <span style={{ color: tokens.colors.error }}>
                            {formatPrice(item.max)}
                          </span>
                        </Text>
                      </div>
                    </div>
                  ))}
                </Card>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card
                  title={t('statistics.segmentAnalysis.title')}
                  style={{ borderRadius: tokens.borderRadius.lg }}
                >
                  <div style={{ marginBottom: tokens.spacing.md }}>
                    <Text type="secondary">{t('common.total')}</Text>
                    <Title level={3} style={{ margin: 0 }}>
                      {allRows.length} {t('common.records')}
                    </Title>
                  </div>

                  {segmentDistribution.map((seg) => (
                    <div
                      key={seg.name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: `${tokens.spacing.xs} 0`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: seg.color,
                          }}
                        />
                        <Text>{seg.name}</Text>
                      </div>
                      <Text strong>{seg.value}</Text>
                    </div>
                  ))}
                </Card>
              </motion.div>
            </Col>
          </Row>
        </>
      )}
    </motion.div>
  );
}
