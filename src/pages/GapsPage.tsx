// Gaps Page - Segment heatmap, opportunity scores, and segment editor
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Card, Tabs, Empty, Row, Col, Statistic, Spin, Alert, Table, Tag, Select, Space, Tooltip } from 'antd';
import { AimOutlined, FireOutlined, AppstoreOutlined, BulbOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { tokens } from '../theme/tokens';
import { useGapsData, GapCell, SegmentSummary } from '../hooks/useIntelData';

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
}

function SegmentHeatmap({ data, segments, priceRanges, selectedFuel, selectedTransmission }: HeatmapProps) {
  const { t } = useTranslation();

  const filteredData = useMemo(() => {
    return data.filter(
      cell =>
        (selectedFuel === 'all' || cell.fuel === selectedFuel) &&
        (selectedTransmission === 'all' || cell.transmission === selectedTransmission)
    );
  }, [data, selectedFuel, selectedTransmission]);

  const maxCount = useMemo(() => {
    return Math.max(...filteredData.map(c => c.vehicleCount), 1);
  }, [filteredData]);

  const getCellData = (segment: string, priceRange: string): GapCell | undefined => {
    return filteredData.find(c => c.segment === segment && c.priceRange === priceRange);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
        <thead>
          <tr>
            <th style={{ padding: 8, borderBottom: `2px solid ${tokens.colors.gray[200]}`, textAlign: 'left' }}>
              {t('gaps.segment', 'Segment')}
            </th>
            {priceRanges.map(range => (
              <th
                key={range}
                style={{
                  padding: 8,
                  borderBottom: `2px solid ${tokens.colors.gray[200]}`,
                  textAlign: 'center',
                  fontSize: 12,
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
              <td style={{ padding: 8, borderBottom: `1px solid ${tokens.colors.gray[100]}`, fontWeight: 500 }}>
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
                        padding: 8,
                        borderBottom: `1px solid ${tokens.colors.gray[100]}`,
                        textAlign: 'center',
                        backgroundColor: getHeatColor(count, maxCount),
                        cursor: 'pointer',
                        position: 'relative',
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

  const opportunityColumns: ColumnsType<GapCell> = [
    {
      title: t('gaps.segment', 'Segment'),
      dataIndex: 'segment',
      key: 'segment',
      width: 120,
    },
    {
      title: t('gaps.fuel', 'Yakit'),
      dataIndex: 'fuel',
      key: 'fuel',
      width: 100,
      render: (fuel: string) => <Tag>{fuel}</Tag>,
    },
    {
      title: t('gaps.transmission', 'Sanziman'),
      dataIndex: 'transmission',
      key: 'transmission',
      width: 100,
      render: (trans: string) => <Tag>{trans}</Tag>,
    },
    {
      title: t('gaps.priceRange', 'Fiyat Araliği'),
      dataIndex: 'priceRange',
      key: 'priceRange',
      width: 100,
    },
    {
      title: t('gaps.vehicleCount', 'Arac Sayisi'),
      dataIndex: 'vehicleCount',
      key: 'vehicleCount',
      width: 80,
      align: 'center',
    },
    {
      title: t('gaps.opportunityScore', 'Firsat Skoru'),
      dataIndex: 'opportunityScore',
      key: 'opportunityScore',
      width: 100,
      render: (score: number) => (
        <Tag color={score > 20 ? 'green' : score > 10 ? 'orange' : 'default'}>
          {score.toFixed(1)}
        </Tag>
      ),
      sorter: (a, b) => b.opportunityScore - a.opportunityScore,
      defaultSortOrder: 'descend',
    },
  ];

  const segmentColumns: ColumnsType<SegmentSummary> = [
    {
      title: t('gaps.segment', 'Segment'),
      dataIndex: 'segment',
      key: 'segment',
      width: 150,
    },
    {
      title: t('gaps.totalVehicles', 'Toplam Arac'),
      dataIndex: 'totalVehicles',
      key: 'totalVehicles',
      width: 100,
      align: 'center',
      sorter: (a, b) => b.totalVehicles - a.totalVehicles,
    },
    {
      title: t('gaps.avgPrice', 'Ort. Fiyat'),
      dataIndex: 'avgPrice',
      key: 'avgPrice',
      width: 120,
      render: (price: number) => formatPrice(price),
      sorter: (a, b) => a.avgPrice - b.avgPrice,
    },
    {
      title: t('gaps.priceRange', 'Fiyat Araliği'),
      key: 'range',
      width: 200,
      render: (_, record) => (
        <Text type="secondary">
          {formatPrice(record.minPrice)} - {formatPrice(record.maxPrice)}
        </Text>
      ),
    },
    {
      title: t('gaps.brands', 'Markalar'),
      dataIndex: 'brands',
      key: 'brands',
      render: (brands: string[]) => (
        <Space wrap size={[0, 4]}>
          {brands.slice(0, 4).map(b => (
            <Tag key={b}>{b}</Tag>
          ))}
          {brands.length > 4 && <Tag>+{brands.length - 4}</Tag>}
        </Space>
      ),
    },
  ];

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
          <Space style={{ marginBottom: tokens.spacing.md }}>
            <Select
              style={{ width: 150 }}
              value={selectedFuel}
              onChange={setSelectedFuel}
              options={[
                { value: 'all', label: t('common.all', 'Tumu') },
                { value: 'Petrol', label: 'Benzin' },
                { value: 'Diesel', label: 'Dizel' },
                { value: 'Hybrid', label: 'Hybrid' },
                { value: 'PHEV', label: 'PHEV' },
                { value: 'Electric', label: 'Elektrik' },
              ]}
              placeholder={t('gaps.selectFuel', 'Yakit sec')}
            />
            <Select
              style={{ width: 150 }}
              value={selectedTransmission}
              onChange={setSelectedTransmission}
              options={[
                { value: 'all', label: t('common.all', 'Tumu') },
                { value: 'Automatic', label: 'Otomatik' },
                { value: 'Manual', label: 'Manuel' },
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
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 600 }}
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
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
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
