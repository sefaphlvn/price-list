// Gaps Page - Segment heatmap, opportunity scores, and segment editor
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Card, Tabs, Empty, Row, Col, Statistic, Spin, Alert, Table, Tag, Select, Space, Tooltip } from 'antd';
import { AimOutlined, FireOutlined, AppstoreOutlined, BulbOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { tokens } from '../theme/tokens';
import { useGapsData, GapCell, SegmentSummary } from '../hooks/useIntelData';
import { useIsMobile } from '../hooks/useMediaQuery';

const { Title, Paragraph, Text } = Typography;

function formatPrice(price: number): string {
  if (price === 0) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Heatmap cell color based on vehicle count
function getHeatColor(count: number, maxCount: number): string {
  if (count === 0) return '#f5f5f5'; // Empty - light gray
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  // From light blue to dark blue
  const r = Math.round(240 - intensity * 200);
  const g = Math.round(248 - intensity * 150);
  const b = Math.round(255 - intensity * 50);
  return `rgb(${r}, ${g}, ${b})`;
}

interface HeatmapProps {
  data: GapCell[];
  segments: string[];
  priceRanges: string[];
  selectedFuel: string;
  selectedTransmission: string;
  isMobile: boolean;
}

// Aggregated cell data when "all" filters are selected
interface AggregatedCell {
  vehicleCount: number;
  brands: string[];
  avgPrice: number;
  hasGap: boolean;
  opportunityScore: number;
}

function SegmentHeatmap({ data, segments, priceRanges, selectedFuel, selectedTransmission, isMobile }: HeatmapProps) {
  const { t } = useTranslation();

  // Aggregate data by segment+priceRange when "all" is selected
  const aggregatedData = useMemo(() => {
    const aggregated = new Map<string, AggregatedCell>();

    for (const cell of data) {
      // Apply filters
      if (selectedFuel !== 'all' && cell.fuel !== selectedFuel) continue;
      if (selectedTransmission !== 'all' && cell.transmission !== selectedTransmission) continue;

      const key = `${cell.segment}-${cell.priceRange}`;
      const existing = aggregated.get(key);

      if (existing) {
        // Aggregate: sum counts, merge brands, recalculate avg
        const newCount = existing.vehicleCount + cell.vehicleCount;
        const newBrands = [...new Set([...existing.brands, ...cell.brands])];
        const existingAvg = existing.avgPrice || 0;
        const cellAvg = cell.avgPrice || 0;
        const newAvgPrice = newCount > 0
          ? Math.round((existingAvg * existing.vehicleCount + cellAvg * cell.vehicleCount) / newCount)
          : 0;
        aggregated.set(key, {
          vehicleCount: newCount,
          brands: newBrands,
          avgPrice: newAvgPrice,
          hasGap: newCount < 2,
          opportunityScore: Math.max(existing.opportunityScore || 0, cell.opportunityScore || 0),
        });
      } else {
        aggregated.set(key, {
          vehicleCount: cell.vehicleCount,
          brands: [...cell.brands],
          avgPrice: cell.avgPrice || 0,
          hasGap: cell.hasGap,
          opportunityScore: cell.opportunityScore || 0,
        });
      }
    }

    return aggregated;
  }, [data, selectedFuel, selectedTransmission]);

  const maxCount = useMemo(() => {
    let max = 1;
    for (const cell of aggregatedData.values()) {
      if (cell.vehicleCount > max) max = cell.vehicleCount;
    }
    return max;
  }, [aggregatedData]);

  const getCellData = (segment: string, priceRange: string): AggregatedCell | undefined => {
    return aggregatedData.get(`${segment}-${priceRange}`);
  };

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 500 : 600 }}>
        <thead>
          <tr>
            <th style={{ padding: isMobile ? 6 : 8, borderBottom: `2px solid ${tokens.colors.gray[200]}`, textAlign: 'left', fontSize: isMobile ? 11 : 14 }}>
              {t('gaps.segment', 'Segment')}
            </th>
            {priceRanges.map(range => (
              <th
                key={range}
                style={{
                  padding: isMobile ? 4 : 8,
                  borderBottom: `2px solid ${tokens.colors.gray[200]}`,
                  textAlign: 'center',
                  fontSize: isMobile ? 9 : 12,
                  whiteSpace: 'nowrap',
                }}
              >
                {range}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {segments.map(segment => (
            <tr key={segment}>
              <td style={{ padding: isMobile ? 6 : 8, borderBottom: `1px solid ${tokens.colors.gray[100]}`, fontWeight: 500, fontSize: isMobile ? 11 : 14, whiteSpace: 'nowrap' }}>
                {segment}
              </td>
              {priceRanges.map(range => {
                const cellData = getCellData(segment, range);
                const count = cellData?.vehicleCount || 0;
                const hasGap = cellData?.hasGap;
                const score = cellData?.opportunityScore || 0;

                return (
                  <Tooltip
                    key={`${segment}-${range}`}
                    title={
                      cellData ? (
                        <div>
                          <div>{t('gaps.vehicleCount', 'Arac Sayisi')}: {count}</div>
                          <div>{t('gaps.brands', 'Markalar')}: {cellData.brands.join(', ') || '-'}</div>
                          {score > 0 && <div>{t('gaps.opportunityScore', 'Firsat Skoru')}: {score.toFixed(1)}</div>}
                        </div>
                      ) : t('gaps.noData', 'Veri yok')
                    }
                  >
                    <td
                      style={{
                        padding: isMobile ? 4 : 8,
                        borderBottom: `1px solid ${tokens.colors.gray[100]}`,
                        textAlign: 'center',
                        backgroundColor: getHeatColor(count, maxCount),
                        cursor: 'pointer',
                        position: 'relative',
                        fontSize: isMobile ? 12 : 14,
                      }}
                    >
                      <Text strong={count > 0}>{count}</Text>
                      {hasGap && score > 10 && (
                        <FireOutlined
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            color: tokens.colors.warning,
                            fontSize: 10,
                          }}
                        />
                      )}
                    </td>
                  </Tooltip>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GapsPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { data, loading, error } = useGapsData();
  const [selectedFuel, setSelectedFuel] = useState<string>('all');
  const [selectedTransmission, setSelectedTransmission] = useState<string>('all');

  const segments = useMemo(() => {
    if (!data?.segments) return [];
    return data.segments.map(s => s.segment).filter(s => s !== 'Other');
  }, [data]);

  const priceRanges = useMemo(() => {
    if (!data?.priceRanges) return [];
    return data.priceRanges.map(r => r.label);
  }, [data]);

  const opportunityColumns: ColumnsType<GapCell> = useMemo(() => [
    {
      title: t('gaps.segment', 'Segment'),
      dataIndex: 'segment',
      key: 'segment',
      width: isMobile ? 90 : 120,
    },
    {
      title: t('gaps.fuel', 'Yakit'),
      dataIndex: 'fuel',
      key: 'fuel',
      width: isMobile ? 80 : 100,
      render: (fuel: string) => <Tag>{fuel}</Tag>,
    },
    ...(!isMobile ? [{
      title: t('gaps.transmission', 'Sanziman'),
      dataIndex: 'transmission',
      key: 'transmission',
      width: 100,
      render: (trans: string) => <Tag>{trans}</Tag>,
    }] : []),
    {
      title: t('gaps.priceRange', 'Fiyat Araliği'),
      dataIndex: 'priceRange',
      key: 'priceRange',
      width: isMobile ? 80 : 100,
    },
    {
      title: isMobile ? '#' : t('gaps.vehicleCount', 'Arac Sayisi'),
      dataIndex: 'vehicleCount',
      key: 'vehicleCount',
      width: isMobile ? 40 : 80,
      align: 'center' as const,
    },
    {
      title: isMobile ? 'Skor' : t('gaps.opportunityScore', 'Firsat Skoru'),
      dataIndex: 'opportunityScore',
      key: 'opportunityScore',
      width: isMobile ? 60 : 100,
      render: (score: number) => (
        <Tag color={score > 20 ? 'green' : score > 10 ? 'orange' : 'default'}>
          {score.toFixed(1)}
        </Tag>
      ),
      sorter: (a, b) => b.opportunityScore - a.opportunityScore,
      defaultSortOrder: 'descend' as const,
    },
  ], [isMobile, t]);

  const segmentColumns: ColumnsType<SegmentSummary> = useMemo(() => [
    {
      title: t('gaps.segment', 'Segment'),
      dataIndex: 'segment',
      key: 'segment',
      width: isMobile ? 100 : 150,
    },
    {
      title: isMobile ? '#' : t('gaps.totalVehicles', 'Toplam Arac'),
      dataIndex: 'totalVehicles',
      key: 'totalVehicles',
      width: isMobile ? 50 : 100,
      align: 'center' as const,
      sorter: (a, b) => b.totalVehicles - a.totalVehicles,
    },
    {
      title: t('gaps.avgPrice', 'Ort. Fiyat'),
      dataIndex: 'avgPrice',
      key: 'avgPrice',
      width: isMobile ? 100 : 120,
      render: (price: number) => formatPrice(price),
      sorter: (a, b) => a.avgPrice - b.avgPrice,
    },
    ...(!isMobile ? [{
      title: t('gaps.priceRange', 'Fiyat Araliği'),
      key: 'range',
      width: 200,
      render: (_: unknown, record: SegmentSummary) => (
        <Text type="secondary">
          {formatPrice(record.minPrice)} - {formatPrice(record.maxPrice)}
        </Text>
      ),
    }] : []),
    {
      title: t('gaps.brands', 'Markalar'),
      dataIndex: 'brands',
      key: 'brands',
      render: (brands: string[]) => (
        <Space wrap size={[0, 4]}>
          {brands.slice(0, isMobile ? 2 : 4).map(b => (
            <Tag key={b}>{b}</Tag>
          ))}
          {brands.length > (isMobile ? 2 : 4) && <Tag>+{brands.length - (isMobile ? 2 : 4)}</Tag>}
        </Space>
      ),
    },
  ], [isMobile, t]);

  if (loading) {
    return (
      <div style={{ padding: tokens.spacing.lg, textAlign: 'center' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: tokens.spacing.md }}>{t('common.loading', 'Yukleniyor...')}</Paragraph>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <Alert
          message={t('errors.fetchError', 'Veriler yuklenirken bir hata olustu')}
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const summary = data?.summary || { totalSegments: 0, totalGaps: 0, totalOpportunities: 0, avgOpportunityScore: 0 };

  const tabItems = [
    {
      key: 'heatmap',
      label: (
        <Space>
          <AppstoreOutlined />
          {t('gaps.heatmap', 'Isi Haritasi')}
        </Space>
      ),
      children: data?.heatmapData && data.heatmapData.length > 0 ? (
        <div>
          <Space wrap style={{ marginBottom: tokens.spacing.md }}>
            <Select
              style={{ width: isMobile ? 130 : 150 }}
              value={selectedFuel}
              onChange={setSelectedFuel}
              options={[
                { value: 'all', label: t('common.all', 'Tumu') },
                { value: 'Benzin', label: t('fuels.petrol', 'Benzin') },
                { value: 'Dizel', label: t('fuels.diesel', 'Dizel') },
                { value: 'Hibrit', label: t('fuels.hybrid', 'Hibrit') },
                { value: 'Hafif Hibrit', label: t('fuels.mhev', 'Hafif Hibrit') },
                { value: 'Plug-in Hibrit', label: t('fuels.phev', 'Plug-in Hibrit') },
                { value: 'Elektrik', label: t('fuels.electric', 'Elektrik') },
                { value: 'LPG', label: t('fuels.lpg', 'LPG') },
              ]}
              placeholder={t('gaps.selectFuel', 'Yakit sec')}
            />
            <Select
              style={{ width: isMobile ? 130 : 150 }}
              value={selectedTransmission}
              onChange={setSelectedTransmission}
              options={[
                { value: 'all', label: t('common.all', 'Tumu') },
                { value: 'Otomatik', label: t('transmission.automatic', 'Otomatik') },
                { value: 'Manuel', label: t('transmission.manual', 'Manuel') },
              ]}
              placeholder={t('gaps.selectTransmission', 'Sanziman sec')}
            />
          </Space>
          <SegmentHeatmap
            data={data.heatmapData}
            segments={segments}
            priceRanges={priceRanges}
            selectedFuel={selectedFuel}
            selectedTransmission={selectedTransmission}
            isMobile={isMobile}
          />
        </div>
      ) : (
        <Empty description={t('common.noData', 'Veri bulunamadi')} style={{ padding: tokens.spacing.xl }} />
      ),
    },
    {
      key: 'opportunities',
      label: (
        <Space>
          <BulbOutlined />
          {t('gaps.opportunities', 'Firsatlar')}
        </Space>
      ),
      children: data?.topOpportunities && data.topOpportunities.length > 0 ? (
        <Table
          columns={opportunityColumns}
          dataSource={data.topOpportunities}
          rowKey={(record) => `${record.segment}-${record.fuel}-${record.transmission}-${record.priceRange}`}
          size="small"
          pagination={{ pageSize: isMobile ? 8 : 10, showSizeChanger: !isMobile }}
          scroll={{ x: isMobile ? 400 : 600 }}
        />
      ) : (
        <Empty description={t('gaps.noOpportunities', 'Firsat bulunamadi')} style={{ padding: tokens.spacing.xl }} />
      ),
    },
    {
      key: 'segments',
      label: (
        <Space>
          <AppstoreOutlined />
          {t('gaps.segments', 'Segmentler')}
        </Space>
      ),
      children: data?.segments && data.segments.length > 0 ? (
        <Table
          columns={segmentColumns}
          dataSource={data.segments.filter(s => s.segment !== 'Other')}
          rowKey="segment"
          size="small"
          pagination={{ pageSize: isMobile ? 8 : 10, showSizeChanger: !isMobile }}
          scroll={{ x: isMobile ? 400 : 800 }}
        />
      ) : (
        <Empty description={t('common.noData', 'Veri bulunamadi')} style={{ padding: tokens.spacing.xl }} />
      ),
    },
  ];

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AimOutlined style={{ color: tokens.colors.primary }} />
          {t('gaps.title', 'Bosluk Bulucu')}
        </Title>
        <Paragraph type="secondary" style={{ marginTop: tokens.spacing.xs }}>
          {t('gaps.subtitle', 'Piyasa bosluklerini ve firsatlari kesfet')}
          {data?.date && (
            <Text type="secondary" style={{ marginLeft: 8 }}>
              ({data.date})
            </Text>
          )}
        </Paragraph>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing.lg }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('gaps.segments', 'Segmentler')}
              value={summary.totalSegments}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('gaps.totalGaps', 'Toplam Bosluk')}
              value={summary.totalGaps}
              prefix={<AimOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('gaps.highOpportunity', 'Firsatlar')}
              value={summary.totalOpportunities}
              valueStyle={{ color: tokens.colors.success }}
              prefix={<FireOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('gaps.avgScore', 'Ort. Skor')}
              value={summary.avgOpportunityScore}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
