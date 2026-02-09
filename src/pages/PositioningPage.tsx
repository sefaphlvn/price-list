/**
 * Positioning Page - Vehicle price positioning analysis
 * Shows similar vehicles, price percentile, and price bands within segment
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Card,
  Row,
  Col,
  Empty,
  Select,
  Spin,
  Alert,
  Table,
  Progress,
  Statistic,
  Tag,
  Space,
  Tooltip,
} from 'antd';
import {
  RadarChartOutlined,
  CarOutlined,
  PercentageOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Fuse from 'fuse.js';

import { tokens } from '../theme/tokens';
import { ChartInfoTooltip, chartDescriptions } from '../components/common/ChartInfoTooltip';
import { useIsMobile } from '../hooks/useMediaQuery';
import { DATA_URLS } from '../utils/fetchData';

const { Title, Paragraph, Text } = Typography;

interface Vehicle {
  model: string;
  trim: string;
  engine: string;
  transmission: string;
  fuel: string;
  priceRaw: string;
  priceNumeric: number;
  brand: string;
}

interface LatestData {
  generatedAt: string;
  totalVehicles: number;
  brands: {
    [brandId: string]: {
      name: string;
      date: string;
      vehicles: Vehicle[];
    };
  };
}

interface VehicleWithId extends Vehicle {
  id: string;
  segment: string;
}

interface SimilarVehicle extends VehicleWithId {
  similarityScore: number;
  priceDiff: number;
  priceDiffPercent: number;
}

// Segment detection (same logic as gaps.ts)
function detectSegment(model: string): string {
  const modelLower = model.toLowerCase();

  // SUV patterns
  if (
    /suv|crossover|4x4|off-?road/i.test(modelLower) ||
    /tiguan|touareg|t-roc|t-cross|taigo/i.test(modelLower) ||
    /karoq|kodiaq|kamiq|elroq|enyaq/i.test(modelLower) ||
    /captur|kadjar|austral|koleos|arkana|symbioz/i.test(modelLower) ||
    /tucson|kona|santa|bayon|ioniq 5/i.test(modelLower) ||
    /c-hr|rav4|land cruiser|yaris cross|corolla cross/i.test(modelLower)
  ) {
    if (/touareg|kodiaq|koleos|santa fe|land cruiser|enyaq/i.test(modelLower)) {
      return 'SUV-Large';
    }
    if (/tiguan|karoq|tucson|rav4|kadjar|austral|arkana/i.test(modelLower)) {
      return 'SUV-Medium';
    }
    return 'SUV-Compact';
  }

  // Sedan patterns
  if (
    /sedan|saloon/i.test(modelLower) ||
    /passat|arteon|jetta/i.test(modelLower) ||
    /superb|octavia/i.test(modelLower) ||
    /talisman|megane.*sedan/i.test(modelLower) ||
    /elantra|sonata|i30/i.test(modelLower) ||
    /camry|corolla(?!.*cross)/i.test(modelLower)
  ) {
    if (/passat|arteon|superb|talisman|sonata|camry/i.test(modelLower)) {
      return 'Sedan-D';
    }
    return 'Sedan-C';
  }

  // Hatchback patterns
  if (
    /hatch|golf|polo|id\.\d/i.test(modelLower) ||
    /fabia|scala|elroq/i.test(modelLower) ||
    /clio|megane(?!.*sedan)|zoe/i.test(modelLower) ||
    /i20|i30|ioniq/i.test(modelLower) ||
    /yaris(?!.*cross)|corolla(?!.*cross).*hb|auris/i.test(modelLower)
  ) {
    if (/golf|scala|megane|i30|corolla/i.test(modelLower)) {
      return 'Hatchback-C';
    }
    return 'Hatchback-B';
  }

  // MPV/Van patterns
  if (
    /mpv|van|touran|caddy|multivan|caravelle|transporter/i.test(modelLower) ||
    /sharan|alhambra/i.test(modelLower) ||
    /scenic|kangoo|trafic|master/i.test(modelLower) ||
    /staria/i.test(modelLower)
  ) {
    return 'MPV';
  }

  // Electric specific
  if (
    /id\.\d|e-|electric|ev|bev/i.test(modelLower) ||
    /enyaq|elroq/i.test(modelLower) ||
    /zoe|megane e-tech/i.test(modelLower) ||
    /ioniq 5|ioniq 6|kona electric/i.test(modelLower)
  ) {
    return 'Electric';
  }

  // Pickup
  if (/pickup|pick-up|amarok|hilux/i.test(modelLower)) {
    return 'Pickup';
  }

  return 'Other';
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function createVehicleId(vehicle: Vehicle): string {
  return `${vehicle.brand}-${vehicle.model}-${vehicle.trim}-${vehicle.engine}`.replace(/\s+/g, '-').toLowerCase();
}

export default function PositioningPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<VehicleWithId[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(DATA_URLS.latest, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Veri yuklenemedi');
        }

        const data: LatestData = await response.json();

        // Flatten all vehicles with IDs and segments
        const allVehicles: VehicleWithId[] = [];
        for (const [, brandData] of Object.entries(data.brands)) {
          for (const vehicle of brandData.vehicles) {
            allVehicles.push({
              ...vehicle,
              id: createVehicleId(vehicle),
              segment: detectSegment(vehicle.model),
            });
          }
        }

        setVehicles(allVehicles);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => controller.abort();
  }, []);

  // Selected vehicle
  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return vehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [selectedVehicleId, vehicles]);

  // Fuse.js search instance
  const fuse = useMemo(() => {
    return new Fuse(vehicles, {
      keys: [
        { name: 'brand', weight: 0.3 },
        { name: 'model', weight: 0.3 },
        { name: 'trim', weight: 0.2 },
        { name: 'engine', weight: 0.1 },
        { name: 'fuel', weight: 0.1 },
      ],
      threshold: 0.4,
      includeScore: true,
    });
  }, [vehicles]);

  // Similar vehicles (same segment, similar specs)
  const similarVehicles = useMemo((): SimilarVehicle[] => {
    if (!selectedVehicle) return [];

    // Search for similar vehicles
    const searchQuery = `${selectedVehicle.model} ${selectedVehicle.fuel}`;
    const results = fuse.search(searchQuery, { limit: 30 });

    // Filter by same segment and different vehicle
    const sameSegment = results
      .filter(
        (r) =>
          r.item.segment === selectedVehicle.segment &&
          r.item.id !== selectedVehicle.id
      )
      .map((r) => {
        const priceDiff = r.item.priceNumeric - selectedVehicle.priceNumeric;
        const priceDiffPercent =
          selectedVehicle.priceNumeric > 0
            ? (priceDiff / selectedVehicle.priceNumeric) * 100
            : 0;

        return {
          ...r.item,
          similarityScore: Math.round((1 - (r.score || 0)) * 100),
          priceDiff,
          priceDiffPercent,
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 10);

    return sameSegment;
  }, [selectedVehicle, fuse]);

  // Price percentile calculation within segment
  const pricePercentile = useMemo(() => {
    if (!selectedVehicle) return null;

    const segmentVehicles = vehicles.filter(
      (v) => v.segment === selectedVehicle.segment
    );
    const prices = segmentVehicles.map((v) => v.priceNumeric).sort((a, b) => a - b);

    if (prices.length === 0) return null;

    const position = prices.filter((p) => p <= selectedVehicle.priceNumeric).length;
    const percentile = Math.round((position / prices.length) * 100);

    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    const medianPrice = prices[Math.floor(prices.length / 2)];
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    return {
      percentile,
      position,
      total: prices.length,
      minPrice,
      maxPrice,
      medianPrice,
      avgPrice,
      segment: selectedVehicle.segment,
    };
  }, [selectedVehicle, vehicles]);

  // Price bands data for chart
  const priceBandsData = useMemo(() => {
    if (!selectedVehicle || !pricePercentile) return [];

    const segmentVehicles = vehicles.filter(
      (v) => v.segment === selectedVehicle.segment
    );

    // Create price bands (5 bands)
    const { minPrice, maxPrice } = pricePercentile;
    const bandSize = (maxPrice - minPrice) / 5;

    if (bandSize === 0) return [];

    const bands = [];
    for (let i = 0; i < 5; i++) {
      const bandMin = minPrice + i * bandSize;
      const bandMax = minPrice + (i + 1) * bandSize;
      const count = segmentVehicles.filter(
        (v) => v.priceNumeric >= bandMin && v.priceNumeric < (i === 4 ? bandMax + 1 : bandMax)
      ).length;

      const isSelectedBand =
        selectedVehicle.priceNumeric >= bandMin &&
        selectedVehicle.priceNumeric < (i === 4 ? bandMax + 1 : bandMax);

      bands.push({
        name: `${formatPrice(bandMin).replace('₺', '')} - ${formatPrice(bandMax).replace('₺', '')}`,
        count,
        isSelected: isSelectedBand,
      });
    }

    return bands;
  }, [selectedVehicle, vehicles, pricePercentile]);

  // Vehicle select options
  const vehicleOptions = useMemo(() => {
    const options = vehicles.map((v) => ({
      value: v.id,
      label: `${v.brand} ${v.model} ${v.trim} - ${v.priceRaw}`,
      searchText: `${v.brand} ${v.model} ${v.trim} ${v.engine} ${v.fuel}`.toLowerCase(),
    }));

    return options.sort((a, b) => a.label.localeCompare(b.label, 'tr'));
  }, [vehicles]);

  // Filter function for Select
  const filterOption = useCallback(
    (input: string, option?: { searchText?: string }) => {
      if (!option?.searchText) return false;
      return option.searchText.includes(input.toLowerCase());
    },
    []
  );

  // Similar vehicles table columns - responsive
  const columns = useMemo(() => [
    {
      title: t('positioning.vehicle', 'Arac'),
      key: 'vehicle',
      width: isMobile ? 150 : undefined,
      render: (_: unknown, record: SimilarVehicle) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ whiteSpace: isMobile ? 'nowrap' : 'normal' }}>
            {record.brand} {record.model}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, whiteSpace: isMobile ? 'nowrap' : 'normal' }}>
            {record.trim} - {record.engine}
          </Text>
        </Space>
      ),
    },
    {
      title: t('positioning.price', 'Fiyat'),
      dataIndex: 'priceRaw',
      key: 'price',
      width: isMobile ? 110 : 140,
    },
    {
      title: t('positioning.diff', 'Fark'),
      key: 'diff',
      width: isMobile ? 80 : 120,
      render: (_: unknown, record: SimilarVehicle) => {
        const isHigher = record.priceDiff > 0;
        return (
          <Space size={isMobile ? 2 : 4}>
            {isHigher ? (
              <ArrowUpOutlined style={{ color: tokens.colors.error }} />
            ) : (
              <ArrowDownOutlined style={{ color: tokens.colors.success }} />
            )}
            <Text type={isHigher ? 'danger' : 'success'}>
              {record.priceDiffPercent >= 0 ? '+' : ''}
              {record.priceDiffPercent.toFixed(1)}%
            </Text>
          </Space>
        );
      },
    },
    ...(!isMobile ? [{
      title: t('positioning.similarity', 'Benzerlik'),
      key: 'similarity',
      width: 100,
      render: (_: unknown, record: SimilarVehicle) => (
        <Progress
          percent={record.similarityScore}
          size="small"
          status={record.similarityScore > 70 ? 'success' : 'normal'}
        />
      ),
    }] : []),
  ], [isMobile, t]);

  if (loading) {
    return (
      <div style={{ padding: tokens.spacing.lg, textAlign: 'center' }}>
        <Spin size="large" tip={t('common.loading', 'Yukleniyor...')} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <Alert
          message={t('common.error', 'Hata')}
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      {/* Header */}
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <Title
          level={2}
          style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <RadarChartOutlined style={{ color: tokens.colors.primary }} />
          {t('positioning.title', 'Fiyat Konumlandirma')}
        </Title>
        <Paragraph type="secondary" style={{ marginTop: tokens.spacing.xs }}>
          {t('positioning.subtitle', 'Aracin segment icindeki pozisyonunu gorun')}
        </Paragraph>
      </div>

      {/* Vehicle Selection */}
      <Card style={{ marginBottom: tokens.spacing.lg }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={16}>
            <Select
              style={{ width: '100%' }}
              size="large"
              placeholder={t('positioning.selectVehicle', 'Arac secin')}
              showSearch
              allowClear
              options={vehicleOptions}
              value={selectedVehicleId}
              onChange={setSelectedVehicleId}
              filterOption={filterOption}
              optionFilterProp="label"
            />
          </Col>
          <Col xs={24} md={8}>
            {selectedVehicle && (
              <Tag color="blue" icon={<CarOutlined />} style={{ fontSize: 14, padding: '4px 8px' }}>
                {selectedVehicle.segment}
              </Tag>
            )}
          </Col>
        </Row>
      </Card>

      {!selectedVehicle ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" align="center">
                <CarOutlined style={{ fontSize: 48, color: '#999' }} />
                <Text>{t('positioning.selectFirst', 'Analiz icin bir arac secin')}</Text>
              </Space>
            }
          />
        </Card>
      ) : (
        <>
          {/* Selected Vehicle Info */}
          <Card style={{ marginBottom: tokens.spacing.lg }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={t('positioning.selectedVehicle', 'Secilen Arac')}
                  value={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={t('positioning.trim', 'Donanim')}
                  value={selectedVehicle.trim}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={t('positioning.price', 'Fiyat')}
                  value={selectedVehicle.priceRaw}
                  valueStyle={{ fontSize: 16, color: tokens.colors.primary }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={t('positioning.segment', 'Segment')}
                  value={selectedVehicle.segment}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]}>
            {/* Price Percentile */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <PercentageOutlined />
                    {t('positioning.pricePercentile', 'Fiyat Yuzdeligi')}
                  </Space>
                }
                extra={<ChartInfoTooltip {...chartDescriptions.pricePercentile} />}
              >
                {pricePercentile && (
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div style={{ textAlign: 'center' }}>
                      <Progress
                        type="dashboard"
                        percent={pricePercentile.percentile}
                        format={(percent) => (
                          <div>
                            <div style={{ fontSize: 28, fontWeight: 'bold' }}>{percent}%</div>
                            <div style={{ fontSize: 12, color: '#999' }}>
                              {t('positioning.percentileLabel', 'Yuzdelik')}
                            </div>
                          </div>
                        )}
                        strokeColor={{
                          '0%': tokens.colors.success,
                          '50%': tokens.colors.warning,
                          '100%': tokens.colors.error,
                        }}
                      />
                    </div>

                    <Row gutter={[16, 8]}>
                      <Col span={12}>
                        <Tooltip title={t('positioning.minPriceTooltip', 'Segmentteki en dusuk fiyat')}>
                          <Statistic
                            title={t('positioning.minPrice', 'Min Fiyat')}
                            value={formatPrice(pricePercentile.minPrice)}
                            valueStyle={{ fontSize: 14 }}
                          />
                        </Tooltip>
                      </Col>
                      <Col span={12}>
                        <Tooltip title={t('positioning.maxPriceTooltip', 'Segmentteki en yuksek fiyat')}>
                          <Statistic
                            title={t('positioning.maxPrice', 'Max Fiyat')}
                            value={formatPrice(pricePercentile.maxPrice)}
                            valueStyle={{ fontSize: 14 }}
                          />
                        </Tooltip>
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title={t('positioning.medianPrice', 'Medyan')}
                          value={formatPrice(pricePercentile.medianPrice)}
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title={t('positioning.avgPrice', 'Ortalama')}
                          value={formatPrice(pricePercentile.avgPrice)}
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                    </Row>

                    <Alert
                      message={
                        pricePercentile.percentile <= 25
                          ? t('positioning.budgetFriendly', 'Butce dostu secim')
                          : pricePercentile.percentile <= 50
                            ? t('positioning.midRange', 'Orta segment')
                            : pricePercentile.percentile <= 75
                              ? t('positioning.upperMid', 'Ust orta segment')
                              : t('positioning.premium', 'Premium segment')
                      }
                      type={
                        pricePercentile.percentile <= 25
                          ? 'success'
                          : pricePercentile.percentile <= 75
                            ? 'info'
                            : 'warning'
                      }
                      showIcon
                    />
                  </Space>
                )}
              </Card>
            </Col>

            {/* Similar Vehicles */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <CarOutlined />
                    {t('positioning.similarVehicles', 'Benzer Araclar')}
                  </Space>
                }
                extra={<ChartInfoTooltip {...chartDescriptions.similarVehicles} />}
              >
                {similarVehicles.length > 0 ? (
                  <Table
                    columns={columns}
                    dataSource={similarVehicles}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    scroll={{ x: isMobile ? 340 : undefined, y: 300 }}
                  />
                ) : (
                  <Empty
                    description={t('positioning.noSimilar', 'Benzer arac bulunamadi')}
                  />
                )}
              </Card>
            </Col>

            {/* Price Bands Chart */}
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <BarChartOutlined />
                    {t('positioning.priceBands', 'Fiyat Bantlari')}
                  </Space>
                }
                extra={<ChartInfoTooltip {...chartDescriptions.priceBands} />}
              >
                {priceBandsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                    <BarChart data={priceBandsData} margin={{ top: 20, right: isMobile ? 10 : 30, left: isMobile ? 10 : 20, bottom: isMobile ? 70 : 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={isMobile ? 70 : 80}
                        fontSize={isMobile ? 9 : 11}
                      />
                      <YAxis
                        fontSize={isMobile ? 10 : 12}
                        label={isMobile ? undefined : {
                          value: t('positioning.vehicleCount', 'Arac Sayisi'),
                          angle: -90,
                          position: 'insideLeft',
                        }}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [value, t('positioning.vehicles', 'Arac')]}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {priceBandsData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isSelected ? tokens.colors.primary : '#d9d9d9'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description={t('positioning.noData', 'Veri yok')} />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
