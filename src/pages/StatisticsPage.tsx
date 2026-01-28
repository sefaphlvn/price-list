// Statistics Page - Advanced price analysis, segment comparisons, and trends
// Uses historical data (no live API calls)
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Row, Col, Typography, Card, Spin, Empty, Tabs, Statistic, Table, Tag, Progress } from 'antd';
import {
  CarOutlined,
  RiseOutlined,
  FallOutlined,
  DashboardOutlined,
  BarChartOutlined,
  PieChartOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
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
  ComposedChart,
  Line,
  Area,
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

// Normalize fuel type names (different brands use different naming conventions)
const normalizeFuelType = (fuel: string): string => {
  if (!fuel) return 'Bilinmiyor';

  const fuelLower = fuel.toLowerCase().trim();

  // Electric
  if (fuelLower === 'elektrik' || fuelLower === 'electric') return 'Elektrik';

  // Plug-in Hybrid (check first, before general hybrid)
  if (fuelLower.includes('plug-in') || fuelLower.includes('plugin')) return 'Plug-in Hybrid';

  // Mild Hybrid
  if (fuelLower.includes('mild hybrid') || fuelLower.includes('mhev')) return 'Mild Hybrid';

  // Hybrid (Benzin-Elektrik, Elektrik-Benzin, Hibrit, Hybrid combinations)
  if (
    fuelLower.includes('hybrid') ||
    fuelLower.includes('hibrit') ||
    (fuelLower.includes('benzin') && fuelLower.includes('elektrik')) ||
    (fuelLower.includes('elektrik') && fuelLower.includes('benzin'))
  ) {
    return 'Hybrid';
  }

  // Diesel Hybrid
  if (fuelLower.includes('dizel') && (fuelLower.includes('elektrik') || fuelLower.includes('hybrid'))) {
    return 'Dizel Hybrid';
  }

  // Benzin + LPG
  if (fuelLower.includes('lpg') || fuelLower.includes('benzin-lpg') || fuelLower.includes('lpg-benzin')) {
    return 'Benzin + LPG';
  }

  // CNG
  if (fuelLower.includes('cng') || fuelLower.includes('dogalgaz')) return 'CNG';

  // Diesel
  if (fuelLower === 'dizel' || fuelLower === 'diesel') return 'Dizel';

  // Benzin (check last to avoid matching hybrids)
  if (fuelLower === 'benzin' || fuelLower === 'petrol' || fuelLower === 'gasoline') return 'Benzin';

  // Return original if no match
  return fuel;
};

// Fuel type colors
const FUEL_COLORS: { [key: string]: string } = {
  Benzin: tokens.colors.fuel.benzin,
  Dizel: tokens.colors.fuel.dizel,
  Elektrik: tokens.colors.fuel.elektrik,
  Hybrid: tokens.colors.fuel.hybrid,
  'Plug-in Hybrid': tokens.colors.fuel.pluginHybrid,
  'Mild Hybrid': '#9333ea', // Purple for mild hybrid
  'Dizel Hybrid': '#6366f1', // Indigo for diesel hybrid
  'Benzin + LPG': '#f59e0b', // Amber for LPG
  CNG: tokens.colors.fuel.cng || '#6b7280',
  Bilinmiyor: '#9ca3af',
};

// Transmission colors
const TRANSMISSION_COLORS: { [key: string]: string } = {
  Otomatik: tokens.colors.accent,
  Manuel: tokens.colors.primary,
  'Yarı Otomatik': tokens.colors.warning,
  CVT: tokens.colors.success,
};

export default function StatisticsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<Map<string, StoredData>>(new Map());
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data from historical files
  useEffect(() => {
    const fetchAllBrands = async () => {
      setLoading(true);
      const dataMap = new Map<string, StoredData>();

      try {
        const indexResponse = await fetch('./data/index.json');
        if (!indexResponse.ok) {
          setLoading(false);
          return;
        }

        const indexData: IndexData = await indexResponse.json();

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

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (allRows.length === 0) return null;

    const prices = allRows.map((r) => r.priceNumeric).sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = sum / prices.length;
    const median = prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];

    return {
      total: allRows.length,
      brands: allData.size,
      avgPrice: Math.round(avg),
      medianPrice: Math.round(median),
      minPrice: prices[0],
      maxPrice: prices[prices.length - 1],
      priceSpread: prices[prices.length - 1] - prices[0],
    };
  }, [allRows, allData]);

  // Brand average prices
  const brandAverages = useMemo(() => {
    const averages: { brand: string; average: number; count: number; min: number; max: number }[] = [];

    allData.forEach((data, brandId) => {
      const brand = getBrandById(brandId);
      if (brand && data.rows.length > 0) {
        const prices = data.rows.map((r) => r.priceNumeric);
        const sum = prices.reduce((acc, p) => acc + p, 0);
        averages.push({
          brand: brand.name,
          average: Math.round(sum / data.rows.length),
          count: data.rows.length,
          min: Math.min(...prices),
          max: Math.max(...prices),
        });
      }
    });

    return averages.sort((a, b) => a.average - b.average);
  }, [allData]);

  // Brand model counts
  const brandModelCounts = useMemo(() => {
    return brandAverages
      .map((b) => ({ brand: b.brand, count: b.count }))
      .sort((a, b) => b.count - a.count);
  }, [brandAverages]);

  // Fuel distribution (with normalization)
  const fuelDistribution = useMemo(() => {
    const fuelCounts: { [key: string]: number } = {};

    allRows.forEach((row) => {
      if (row.fuel) {
        const normalizedFuel = normalizeFuelType(row.fuel);
        fuelCounts[normalizedFuel] = (fuelCounts[normalizedFuel] || 0) + 1;
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

  // Transmission distribution
  const transmissionDistribution = useMemo(() => {
    const counts: { [key: string]: number } = {};

    allRows.forEach((row) => {
      if (row.transmission) {
        counts[row.transmission] = (counts[row.transmission] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: TRANSMISSION_COLORS[name] || tokens.colors.gray[400],
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

  // Price distribution histogram (binned)
  const priceHistogram = useMemo(() => {
    if (allRows.length === 0) return [];

    const bins = [
      { label: '0-1M', min: 0, max: 1000000, count: 0 },
      { label: '1-1.5M', min: 1000000, max: 1500000, count: 0 },
      { label: '1.5-2M', min: 1500000, max: 2000000, count: 0 },
      { label: '2-2.5M', min: 2000000, max: 2500000, count: 0 },
      { label: '2.5-3M', min: 2500000, max: 3000000, count: 0 },
      { label: '3-4M', min: 3000000, max: 4000000, count: 0 },
      { label: '4-5M', min: 4000000, max: 5000000, count: 0 },
      { label: '5-7M', min: 5000000, max: 7000000, count: 0 },
      { label: '7-10M', min: 7000000, max: 10000000, count: 0 },
      { label: '10M+', min: 10000000, max: Infinity, count: 0 },
    ];

    allRows.forEach((row) => {
      const bin = bins.find((b) => row.priceNumeric >= b.min && row.priceNumeric < b.max);
      if (bin) bin.count += 1;
    });

    return bins.filter((b) => b.count > 0);
  }, [allRows]);

  // Price range by brand (for scatter chart)
  const brandPriceScatter = useMemo(() => {
    return brandAverages.map((b, index) => ({
      brand: b.brand,
      x: index,
      y: b.average,
      z: b.count,
      min: b.min,
      max: b.max,
      spread: b.max - b.min,
    }));
  }, [brandAverages]);

  // Top 10 cheapest and most expensive
  const topCheapest = useMemo(() => {
    return [...allRows]
      .sort((a, b) => a.priceNumeric - b.priceNumeric)
      .slice(0, 10)
      .map((row, index) => ({
        key: index,
        rank: index + 1,
        brand: row.brand,
        model: row.model,
        trim: row.trim,
        price: row.priceNumeric,
        priceRaw: row.priceRaw,
        fuel: row.fuel,
      }));
  }, [allRows]);

  const topExpensive = useMemo(() => {
    return [...allRows]
      .sort((a, b) => b.priceNumeric - a.priceNumeric)
      .slice(0, 10)
      .map((row, index) => ({
        key: index,
        rank: index + 1,
        brand: row.brand,
        model: row.model,
        trim: row.trim,
        price: row.priceNumeric,
        priceRaw: row.priceRaw,
        fuel: row.fuel,
      }));
  }, [allRows]);

  // Brand fuel breakdown (with normalization)
  const brandFuelBreakdown = useMemo(() => {
    const breakdown: { brand: string; [key: string]: number | string }[] = [];

    allData.forEach((data, brandId) => {
      const brand = getBrandById(brandId);
      if (brand) {
        const fuelCounts: { [key: string]: number } = {};
        data.rows.forEach((row) => {
          if (row.fuel) {
            const normalizedFuel = normalizeFuelType(row.fuel);
            fuelCounts[normalizedFuel] = (fuelCounts[normalizedFuel] || 0) + 1;
          }
        });
        breakdown.push({
          brand: brand.name,
          ...fuelCounts,
        });
      }
    });

    return breakdown.sort((a, b) => (a.brand as string).localeCompare(b.brand as string, 'tr'));
  }, [allData]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPriceShort = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return `${(value / 1000).toFixed(0)}K`;
  };

  // Table columns for top lists
  const topListColumns = [
    {
      title: '#',
      dataIndex: 'rank',
      key: 'rank',
      width: 50,
    },
    {
      title: t('common.brand'),
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
    },
    {
      title: t('common.model'),
      dataIndex: 'model',
      key: 'model',
      width: 120,
    },
    {
      title: t('common.trim'),
      dataIndex: 'trim',
      key: 'trim',
      ellipsis: true,
    },
    {
      title: t('common.fuel'),
      dataIndex: 'fuel',
      key: 'fuel',
      width: 100,
      render: (fuel: string) => (
        <Tag color={FUEL_COLORS[fuel] || 'default'} style={{ color: '#fff' }}>
          {fuel}
        </Tag>
      ),
    },
    {
      title: t('common.price'),
      dataIndex: 'priceRaw',
      key: 'price',
      width: 150,
      render: (price: string) => <Text strong style={{ color: tokens.colors.success }}>{price}</Text>,
    },
  ];

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

  if (allRows.length === 0) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="enter"
        style={{ padding: tokens.spacing.lg }}
      >
        <Empty description={t('common.noData')} />
      </motion.div>
    );
  }

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <DashboardOutlined /> {t('statistics.tabs.overview', 'Genel Bakis')}
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          {/* Summary Stats Cards */}
          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={4}>
                <Card size="small" style={{ borderRadius: tokens.borderRadius.md }}>
                  <Statistic
                    title={t('statistics.summary.totalVehicles', 'Toplam Arac')}
                    value={summaryStats?.total || 0}
                    prefix={<CarOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Card size="small" style={{ borderRadius: tokens.borderRadius.md }}>
                  <Statistic
                    title={t('statistics.summary.totalBrands', 'Marka Sayisi')}
                    value={summaryStats?.brands || 0}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Card size="small" style={{ borderRadius: tokens.borderRadius.md }}>
                  <Statistic
                    title={t('statistics.summary.avgPrice', 'Ortalama')}
                    value={summaryStats?.avgPrice || 0}
                    formatter={(v) => formatPriceShort(v as number)}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Card size="small" style={{ borderRadius: tokens.borderRadius.md }}>
                  <Statistic
                    title={t('statistics.summary.medianPrice', 'Medyan')}
                    value={summaryStats?.medianPrice || 0}
                    formatter={(v) => formatPriceShort(v as number)}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Card size="small" style={{ borderRadius: tokens.borderRadius.md }}>
                  <Statistic
                    title={t('statistics.priceTrend.minPrice', 'Minimum')}
                    value={summaryStats?.minPrice || 0}
                    formatter={(v) => formatPriceShort(v as number)}
                    valueStyle={{ color: tokens.colors.success }}
                    prefix={<FallOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Card size="small" style={{ borderRadius: tokens.borderRadius.md }}>
                  <Statistic
                    title={t('statistics.priceTrend.maxPrice', 'Maksimum')}
                    value={summaryStats?.maxPrice || 0}
                    formatter={(v) => formatPriceShort(v as number)}
                    valueStyle={{ color: tokens.colors.error }}
                    prefix={<RiseOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Price Distribution Histogram */}
          <Col xs={24} lg={16}>
            <Card
              title={t('statistics.priceDistribution', 'Fiyat Dagilimi')}
              style={{ borderRadius: tokens.borderRadius.lg }}
            >
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={priceHistogram}>
                  <CartesianGrid strokeDasharray="3 3" stroke={tokens.colors.gray[200]} />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${value} arac`, 'Sayi']}
                    labelFormatter={(label) => `Fiyat: ${label} TL`}
                  />
                  <Bar dataKey="count" fill={tokens.colors.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Segment Distribution */}
          <Col xs={24} lg={8}>
            <Card
              title={t('statistics.segmentAnalysis.title')}
              style={{ borderRadius: tokens.borderRadius.lg, height: '100%' }}
            >
              <div style={{ marginBottom: tokens.spacing.md }}>
                {segmentDistribution.map((seg) => {
                  const percent = ((seg.value / (summaryStats?.total || 1)) * 100).toFixed(1);
                  return (
                    <div key={seg.name} style={{ marginBottom: tokens.spacing.sm }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text>{seg.name}</Text>
                        <Text strong>{seg.value} ({percent}%)</Text>
                      </div>
                      <Progress
                        percent={parseFloat(percent)}
                        showInfo={false}
                        strokeColor={seg.color}
                        size="small"
                      />
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>

          {/* Fuel & Transmission Distribution */}
          <Col xs={24} md={12}>
            <Card
              title={t('statistics.fuelDistribution', 'Yakit Dagilimi')}
              style={{ borderRadius: tokens.borderRadius.lg }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fuelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {fuelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title={t('statistics.transmissionDistribution', 'Sanziman Dagilimi')}
              style={{ borderRadius: tokens.borderRadius.lg }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={transmissionDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {transmissionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'brands',
      label: (
        <span>
          <BarChartOutlined /> {t('statistics.tabs.brands', 'Markalar')}
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          {/* Brand Average Prices */}
          <Col xs={24} lg={14}>
            <Card
              title={t('statistics.priceComparison.avgByBrand')}
              style={{ borderRadius: tokens.borderRadius.lg }}
            >
              <ResponsiveContainer width="100%" height={Math.max(400, brandAverages.length * 35)}>
                <BarChart data={brandAverages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={tokens.colors.gray[200]} />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => formatPriceShort(value)}
                  />
                  <YAxis type="category" dataKey="brand" width={90} />
                  <Tooltip
                    formatter={(value: number) => [formatPrice(value), 'Ortalama']}
                    labelStyle={{ color: tokens.colors.gray[700] }}
                  />
                  <Bar dataKey="average" fill={tokens.colors.accent} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Brand Model Counts */}
          <Col xs={24} lg={10}>
            <Card
              title={t('statistics.modelCount', 'Model Sayisi')}
              style={{ borderRadius: tokens.borderRadius.lg, marginBottom: tokens.spacing.lg }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={brandModelCounts.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={tokens.colors.gray[200]} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="brand" width={90} />
                  <Tooltip formatter={(value: number) => [`${value} model`, 'Sayi']} />
                  <Bar dataKey="count" fill={tokens.colors.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Price Range by Brand */}
            <Card
              title={t('statistics.priceComparison.priceRange')}
              style={{ borderRadius: tokens.borderRadius.lg }}
              bodyStyle={{ maxHeight: 300, overflow: 'auto' }}
            >
              {brandAverages.sort((a, b) => a.brand.localeCompare(b.brand, 'tr')).map((item) => (
                <div
                  key={item.brand}
                  style={{
                    padding: `${tokens.spacing.sm} 0`,
                    borderBottom: `1px solid ${tokens.colors.gray[100]}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>{item.brand}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.count} model</Text>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: tokens.spacing.xs,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <span style={{ color: tokens.colors.success }}>{formatPriceShort(item.min)}</span>
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Ort: {formatPriceShort(item.average)}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <span style={{ color: tokens.colors.error }}>{formatPriceShort(item.max)}</span>
                    </Text>
                  </div>
                </div>
              ))}
            </Card>
          </Col>

          {/* Brand Price Positioning Scatter */}
          <Col span={24}>
            <Card
              title={t('statistics.brandPricePositioning', 'Marka Fiyat Konumlandirmasi')}
              style={{ borderRadius: tokens.borderRadius.lg }}
            >
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={brandPriceScatter}>
                  <CartesianGrid strokeDasharray="3 3" stroke={tokens.colors.gray[200]} />
                  <XAxis dataKey="brand" angle={-45} textAnchor="end" height={80} interval={0} fontSize={11} />
                  <YAxis tickFormatter={(v) => formatPriceShort(v)} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'y') return [formatPrice(value), 'Ortalama'];
                      if (name === 'min') return [formatPrice(value), 'Minimum'];
                      if (name === 'max') return [formatPrice(value), 'Maksimum'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="max" fill={tokens.colors.error + '20'} stroke="none" name="max" />
                  <Area type="monotone" dataKey="min" fill={tokens.colors.background} stroke="none" name="min" />
                  <Line type="monotone" dataKey="y" stroke={tokens.colors.accent} strokeWidth={2} dot={{ fill: tokens.colors.accent }} name="Ortalama" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'rankings',
      label: (
        <span>
          <UnorderedListOutlined /> {t('statistics.tabs.rankings', 'Siralamalur')}
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          {/* Top 10 Cheapest */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span style={{ color: tokens.colors.success }}>
                  <FallOutlined /> {t('statistics.topCheapest', 'En Uygun 10 Arac')}
                </span>
              }
              style={{ borderRadius: tokens.borderRadius.lg }}
            >
              <Table
                columns={topListColumns}
                dataSource={topCheapest}
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
                onRow={(record) => ({
                  onClick: () => navigate(`/fiyat-listesi?brand=${record.brand.toLowerCase()}&q=${record.model}`),
                  style: { cursor: 'pointer' },
                })}
              />
            </Card>
          </Col>

          {/* Top 10 Expensive */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span style={{ color: tokens.colors.error }}>
                  <RiseOutlined /> {t('statistics.topExpensive', 'En Pahali 10 Arac')}
                </span>
              }
              style={{ borderRadius: tokens.borderRadius.lg }}
            >
              <Table
                columns={topListColumns}
                dataSource={topExpensive}
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
                onRow={(record) => ({
                  onClick: () => navigate(`/fiyat-listesi?brand=${record.brand.toLowerCase()}&q=${record.model}`),
                  style: { cursor: 'pointer' },
                })}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'fuel',
      label: (
        <span>
          <PieChartOutlined /> {t('statistics.tabs.fuelAnalysis', 'Yakit Analizi')}
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          {/* Brand x Fuel Stacked Bar */}
          <Col span={24}>
            <Card
              title={t('statistics.brandFuelBreakdown', 'Marka Bazli Yakit Dagilimi')}
              style={{ borderRadius: tokens.borderRadius.lg }}
            >
              <ResponsiveContainer width="100%" height={Math.max(400, brandFuelBreakdown.length * 30)}>
                <BarChart data={brandFuelBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={tokens.colors.gray[200]} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="brand" width={90} />
                  <Tooltip />
                  <Legend />
                  {Object.keys(FUEL_COLORS).map((fuel) => (
                    <Bar
                      key={fuel}
                      dataKey={fuel}
                      stackId="fuel"
                      fill={FUEL_COLORS[fuel]}
                      name={fuel}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Fuel Average Prices */}
          <Col xs={24} md={12}>
            <Card
              title={t('statistics.fuelAvgPrices', 'Yakit Tipine Gore Ortalama Fiyat')}
              style={{ borderRadius: tokens.borderRadius.lg }}
            >
              {(() => {
                const fuelPrices: { [key: string]: { sum: number; count: number } } = {};
                allRows.forEach((row) => {
                  if (row.fuel) {
                    const normalizedFuel = normalizeFuelType(row.fuel);
                    if (!fuelPrices[normalizedFuel]) fuelPrices[normalizedFuel] = { sum: 0, count: 0 };
                    fuelPrices[normalizedFuel].sum += row.priceNumeric;
                    fuelPrices[normalizedFuel].count += 1;
                  }
                });
                const fuelAvgData = Object.entries(fuelPrices)
                  .map(([fuel, data]) => ({
                    fuel,
                    avg: Math.round(data.sum / data.count),
                    count: data.count,
                    color: FUEL_COLORS[fuel] || tokens.colors.gray[400],
                  }))
                  .sort((a, b) => a.avg - b.avg);

                return (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={fuelAvgData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={tokens.colors.gray[200]} />
                      <XAxis type="number" tickFormatter={(v) => formatPriceShort(v)} />
                      <YAxis type="category" dataKey="fuel" width={100} />
                      <Tooltip formatter={(value: number) => [formatPrice(value), 'Ortalama']} />
                      <Bar dataKey="avg" fill={tokens.colors.accent} radius={[0, 4, 4, 0]}>
                        {fuelAvgData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </Card>
          </Col>

          {/* Transmission Average Prices */}
          <Col xs={24} md={12}>
            <Card
              title={t('statistics.transmissionAvgPrices', 'Sanziman Tipine Gore Ortalama Fiyat')}
              style={{ borderRadius: tokens.borderRadius.lg }}
            >
              {(() => {
                const transPrices: { [key: string]: { sum: number; count: number } } = {};
                allRows.forEach((row) => {
                  if (row.transmission) {
                    if (!transPrices[row.transmission]) transPrices[row.transmission] = { sum: 0, count: 0 };
                    transPrices[row.transmission].sum += row.priceNumeric;
                    transPrices[row.transmission].count += 1;
                  }
                });
                const transAvgData = Object.entries(transPrices)
                  .map(([trans, data]) => ({
                    transmission: trans,
                    avg: Math.round(data.sum / data.count),
                    count: data.count,
                    color: TRANSMISSION_COLORS[trans] || tokens.colors.gray[400],
                  }))
                  .sort((a, b) => a.avg - b.avg);

                return (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={transAvgData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={tokens.colors.gray[200]} />
                      <XAxis type="number" tickFormatter={(v) => formatPriceShort(v)} />
                      <YAxis type="category" dataKey="transmission" width={100} />
                      <Tooltip formatter={(value: number) => [formatPrice(value), 'Ortalama']} />
                      <Bar dataKey="avg" fill={tokens.colors.primary} radius={[0, 4, 4, 0]}>
                        {transAvgData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

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

      {/* Tabs */}
      <motion.div variants={staggerItem}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          style={{ background: tokens.colors.surface, padding: tokens.spacing.lg, borderRadius: tokens.borderRadius.lg }}
        />
      </motion.div>
    </motion.div>
  );
}
