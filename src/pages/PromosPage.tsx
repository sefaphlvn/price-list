// Promos Page - Implicit discounts and price drop tracker
import { useTranslation } from 'react-i18next';
import { Typography, Card, Tabs, Empty, Row, Col, Statistic, Alert, Spin, Table, Tag, Space, Progress } from 'antd';
import { TagOutlined, FallOutlined, LineChartOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

import { tokens } from '../theme/tokens';
import { usePromosData, PriceDrop, RecentDrop } from '../hooks/useIntelData';
import { useIsMobile } from '../hooks/useMediaQuery';

const { Title, Paragraph, Text } = Typography;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

interface PriceHistoryChartProps {
  data: { date: string; price: number }[];
}

function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  if (!data || data.length < 2) return null;

  const chartData = data.map(d => ({
    date: d.date.split('-').slice(1).join('/'),
    price: d.price,
  }));

  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Line
          type="monotone"
          dataKey="price"
          stroke={tokens.colors.primary}
          strokeWidth={2}
          dot={false}
        />
        <Tooltip
          formatter={(value: number) => formatPrice(value)}
          labelFormatter={(label: string) => label}
          contentStyle={{ fontSize: 10 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function PromosPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { data, loading, error } = usePromosData();

  const priceDropColumns: ColumnsType<PriceDrop> = [
    {
      title: t('common.brand', 'Marka'),
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
      filters: data?.priceDrops
        ? [...new Set(data.priceDrops.map(d => d.brand))].map(b => ({ text: b, value: b }))
        : [],
      onFilter: (value, record) => record.brand === value,
    },
    {
      title: t('common.model', 'Model'),
      key: 'model',
      width: 180,
      render: (_, record) => (
        <div>
          <Text strong>{record.model}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.trim}</Text>
        </div>
      ),
    },
    {
      title: t('promos.currentPrice', 'Guncel Fiyat'),
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 120,
      render: (price: number) => formatPrice(price),
      sorter: (a, b) => a.currentPrice - b.currentPrice,
    },
    {
      title: t('promos.peakPrice', 'Tepe Fiyat'),
      key: 'peak',
      width: 150,
      render: (_, record) => (
        <div>
          <Text delete type="secondary">{formatPrice(record.peakPrice)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{record.peakDate}</Text>
        </div>
      ),
    },
    {
      title: t('promos.drop', 'Dusus'),
      key: 'drop',
      width: 120,
      render: (_, record) => (
        <div>
          <Tag color="green">-{record.dropPercent.toFixed(1)}%</Tag>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>-{formatPrice(record.dropAmount)}</Text>
        </div>
      ),
      sorter: (a, b) => b.dropPercent - a.dropPercent,
      defaultSortOrder: 'descend',
    },
    {
      title: t('promos.campaign'),
      key: 'campaign',
      width: 100,
      render: (_, record) => {
        if (record.campaignDiscount && record.campaignDiscount > 0) {
          return (
            <div>
              <Tag color="cyan">-{record.campaignDiscount.toFixed(1)}%</Tag>
              {record.listPrice && record.campaignPrice && (
                <>
                  <br />
                  <Text type="secondary" style={{ fontSize: 10 }}>
                    {formatPrice(record.listPrice)} → {formatPrice(record.campaignPrice)}
                  </Text>
                </>
              )}
            </div>
          );
        }
        return <Text type="secondary">-</Text>;
      },
      sorter: (a, b) => (b.campaignDiscount || 0) - (a.campaignDiscount || 0),
    },
    {
      title: t('promos.days', 'Gun'),
      dataIndex: 'daysSincePeak',
      key: 'daysSincePeak',
      width: 60,
      align: 'center',
      sorter: (a, b) => a.daysSincePeak - b.daysSincePeak,
    },
    {
      title: t('promos.trend', 'Trend'),
      key: 'trend',
      width: 120,
      render: (_, record) => <PriceHistoryChart data={record.priceHistory} />,
    },
  ];

  const recentDropColumns: ColumnsType<RecentDrop> = [
    {
      title: t('common.brand', 'Marka'),
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
    },
    {
      title: t('common.model', 'Model'),
      key: 'model',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong>{record.model}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.trim}</Text>
        </div>
      ),
    },
    {
      title: t('promos.previousPrice', 'Onceki'),
      dataIndex: 'previousPrice',
      key: 'previousPrice',
      width: 120,
      render: (price: number) => <Text delete type="secondary">{formatPrice(price)}</Text>,
    },
    {
      title: t('promos.currentPrice', 'Guncel'),
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 120,
      render: (price: number) => <Text strong>{formatPrice(price)}</Text>,
    },
    {
      title: t('promos.drop', 'Dusus'),
      key: 'drop',
      width: 100,
      render: (_, record) => (
        <Tag color="green">-{record.dropPercent.toFixed(1)}%</Tag>
      ),
      sorter: (a, b) => b.dropPercent - a.dropPercent,
      defaultSortOrder: 'descend',
    },
    {
      title: t('promos.campaign'),
      key: 'campaign',
      width: 90,
      render: (_, record) => {
        if (record.campaignDiscount && record.campaignDiscount > 0) {
          return <Tag color="cyan">-{record.campaignDiscount.toFixed(1)}%</Tag>;
        }
        return <Text type="secondary">-</Text>;
      },
      sorter: (a, b) => (b.campaignDiscount || 0) - (a.campaignDiscount || 0),
    },
    {
      title: t('promos.date', 'Tarih'),
      dataIndex: 'date',
      key: 'date',
      width: 100,
    },
  ];

  const brandSummaryColumns: ColumnsType<{ brandId: string; brand: string; dropCount: number; avgDropPercent: number }> = [
    {
      title: t('common.brand', 'Marka'),
      dataIndex: 'brand',
      key: 'brand',
      width: 150,
    },
    {
      title: t('promos.dropCount', 'Indirimli Arac'),
      dataIndex: 'dropCount',
      key: 'dropCount',
      width: 120,
      sorter: (a, b) => b.dropCount - a.dropCount,
      defaultSortOrder: 'descend',
    },
    {
      title: t('promos.avgDrop', 'Ort. Indirim'),
      key: 'avgDropPercent',
      width: 150,
      render: (_, record) => (
        <Space>
          <Progress
            percent={Math.min(record.avgDropPercent * 2, 100)}
            size="small"
            showInfo={false}
            strokeColor={tokens.colors.success}
            style={{ width: 60 }}
          />
          <Text>{record.avgDropPercent.toFixed(1)}%</Text>
        </Space>
      ),
      sorter: (a, b) => b.avgDropPercent - a.avgDropPercent,
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

  const summary = data?.summary || {
    totalPriceDrops: 0,
    totalRecentDrops: 0,
    avgDropPercent: 0,
    maxDropPercent: 0,
    brandsWithDrops: 0,
  };

  const tabItems = [
    {
      key: 'active',
      label: (
        <Space>
          <TagOutlined />
          {t('promos.activePromos', 'Aktif Indirimler')} ({data?.priceDrops?.length || 0})
        </Space>
      ),
      children: data?.priceDrops && data.priceDrops.length > 0 ? (
        <Table
          columns={priceDropColumns}
          dataSource={data.priceDrops}
          rowKey="id"
          size="small"
          pagination={{ pageSize: isMobile ? 5 : 10, showSizeChanger: !isMobile }}
          scroll={{ x: isMobile ? 600 : 900 }}
        />
      ) : (
        <Empty
          description={t('promos.noActivePromos', 'Aktif indirim bulunamadi')}
          style={{ padding: tokens.spacing.xl }}
        />
      ),
    },
    {
      key: 'recent',
      label: (
        <Space>
          <FallOutlined />
          {t('promos.recentDrops', 'Son Dususler')} ({data?.recentDrops?.length || 0})
        </Space>
      ),
      children: data?.recentDrops && data.recentDrops.length > 0 ? (
        <Table
          columns={recentDropColumns}
          dataSource={data.recentDrops}
          rowKey="id"
          size="small"
          pagination={{ pageSize: isMobile ? 5 : 10 }}
          scroll={{ x: isMobile ? 500 : 700 }}
        />
      ) : (
        <Empty
          description={t('promos.noRecentDrops', 'Son fiyat dususu bulunamadi')}
          style={{ padding: tokens.spacing.xl }}
        />
      ),
    },
    {
      key: 'brands',
      label: (
        <Space>
          <LineChartOutlined />
          {t('promos.byBrand', 'Markalara Gore')}
        </Space>
      ),
      children: data?.brandSummary && data.brandSummary.length > 0 ? (
        <Table
          columns={brandSummaryColumns}
          dataSource={data.brandSummary}
          rowKey="brandId"
          size="small"
          pagination={false}
        />
      ) : (
        <Empty
          description={t('common.noData', 'Veri bulunamadi')}
          style={{ padding: tokens.spacing.xl }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TagOutlined style={{ color: tokens.colors.primary }} />
          {t('promos.title', 'Promosyonlar')}
        </Title>
        <Paragraph type="secondary" style={{ marginTop: tokens.spacing.xs }}>
          {t('promos.subtitle', 'Onimsiz indirimleri ve fiyat dususlerini takip edin')}
          {data?.date && (
            <Text type="secondary" style={{ marginLeft: 8 }}>
              ({data.date})
            </Text>
          )}
        </Paragraph>
      </div>

      <Alert
        message={t('promos.implicitNote', 'Onimsiz Indirim Tespiti')}
        description={t(
          'promos.implicitDesc',
          'Bu sayfa tarihsel fiyat verilerini analiz ederek son 90 gun icerisinde en yuksek fiyatindan %5 veya daha fazla dusen araclari tespit eder.'
        )}
        type="info"
        showIcon
        style={{ marginBottom: tokens.spacing.lg }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing.lg }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('promos.totalDiscounted', 'Indirimli Arac')}
              value={summary.totalPriceDrops}
              prefix={<TagOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('promos.avgDiscount', 'Ort. Indirim')}
              value={summary.avgDropPercent}
              precision={1}
              suffix="%"
              valueStyle={{ color: tokens.colors.success }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('promos.maxDiscount', 'Maks. Indirim')}
              value={summary.maxDropPercent}
              precision={1}
              suffix="%"
              valueStyle={{ color: tokens.colors.success }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('promos.recentDropsCount', 'Son Dususler')}
              value={summary.totalRecentDrops}
              prefix={<FallOutlined />}
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
