// Lifecycle Page - Model year transitions, entry price deltas, stale models
import { useTranslation } from 'react-i18next';
import { Typography, Card, Tabs, Empty, Row, Col, Statistic, Spin, Alert, Table, Tag, Space } from 'antd';
import {
  ClockCircleOutlined,
  SwapOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
  CarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { tokens } from '../theme/tokens';
import { useLifecycleData, ModelYearTransition, EntryPriceDelta, StaleModel, ModelInfo } from '../hooks/useIntelData';

const { Title, Paragraph, Text } = Typography;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function LifecyclePage() {
  const { t } = useTranslation();
  const { data, loading, error } = useLifecycleData();

  const transitionColumns: ColumnsType<ModelYearTransition> = [
    {
      title: t('common.brand', 'Marka'),
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
    },
    {
      title: t('common.model', 'Model'),
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: t('lifecycle.yearChange', 'Yil Gecisi'),
      key: 'years',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tag>{record.oldYear}</Tag>
          <SwapOutlined />
          <Tag color="blue">{record.newYear}</Tag>
        </Space>
      ),
    },
    {
      title: t('lifecycle.oldEntry', 'Eski Giris'),
      dataIndex: 'oldEntryPrice',
      key: 'oldEntryPrice',
      width: 120,
      render: (price: number) => <Text type="secondary">{formatPrice(price)}</Text>,
    },
    {
      title: t('lifecycle.newEntry', 'Yeni Giris'),
      dataIndex: 'newEntryPrice',
      key: 'newEntryPrice',
      width: 120,
      render: (price: number) => <Text strong>{formatPrice(price)}</Text>,
    },
    {
      title: t('lifecycle.delta', 'Degisim'),
      key: 'delta',
      width: 120,
      render: (_, record) => {
        const isIncrease = record.priceDelta > 0;
        return (
          <Space>
            {isIncrease ? (
              <RiseOutlined style={{ color: tokens.colors.error }} />
            ) : (
              <FallOutlined style={{ color: tokens.colors.success }} />
            )}
            <Tag color={isIncrease ? 'red' : 'green'}>
              {isIncrease ? '+' : ''}{record.priceDeltaPercent.toFixed(1)}%
            </Tag>
          </Space>
        );
      },
      sorter: (a, b) => b.priceDeltaPercent - a.priceDeltaPercent,
      defaultSortOrder: 'descend',
    },
    {
      title: t('lifecycle.trims', 'Donanim'),
      dataIndex: 'trimCount',
      key: 'trimCount',
      width: 80,
      align: 'center',
    },
  ];

  const entryDeltaColumns: ColumnsType<EntryPriceDelta> = [
    {
      title: t('common.brand', 'Marka'),
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
    },
    {
      title: t('common.model', 'Model'),
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: t('lifecycle.previousEntry', 'Onceki Giris'),
      dataIndex: 'previousEntryPrice',
      key: 'previousEntryPrice',
      width: 120,
      render: (price: number) => <Text type="secondary">{formatPrice(price)}</Text>,
    },
    {
      title: t('lifecycle.currentEntry', 'Guncel Giris'),
      dataIndex: 'currentEntryPrice',
      key: 'currentEntryPrice',
      width: 120,
      render: (price: number) => <Text strong>{formatPrice(price)}</Text>,
    },
    {
      title: t('lifecycle.delta', 'Degisim'),
      key: 'delta',
      width: 120,
      render: (_, record) => {
        const isIncrease = record.delta > 0;
        return (
          <Tag color={isIncrease ? 'red' : 'green'}>
            {isIncrease ? '+' : ''}{record.deltaPercent.toFixed(1)}%
          </Tag>
        );
      },
      sorter: (a, b) => Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent),
      defaultSortOrder: 'descend',
    },
    {
      title: t('lifecycle.period', 'Donem'),
      key: 'period',
      width: 150,
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.previousDate} → {record.currentDate}
        </Text>
      ),
    },
  ];

  const staleColumns: ColumnsType<StaleModel> = [
    {
      title: t('common.brand', 'Marka'),
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
    },
    {
      title: t('common.model', 'Model'),
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: t('lifecycle.lastUpdate', 'Son Guncelleme'),
      dataIndex: 'lastUpdateDate',
      key: 'lastUpdateDate',
      width: 120,
    },
    {
      title: t('lifecycle.daysSince', 'Gun'),
      dataIndex: 'daysSinceUpdate',
      key: 'daysSinceUpdate',
      width: 80,
      render: (days: number) => (
        <Tag color={days > 30 ? 'red' : days > 14 ? 'orange' : 'default'}>
          {days} gun
        </Tag>
      ),
      sorter: (a, b) => b.daysSinceUpdate - a.daysSinceUpdate,
      defaultSortOrder: 'descend',
    },
    {
      title: t('lifecycle.entryPrice', 'Giris Fiyati'),
      dataIndex: 'currentEntryPrice',
      key: 'currentEntryPrice',
      width: 120,
      render: (price: number) => formatPrice(price),
    },
    {
      title: t('lifecycle.trims', 'Donanim'),
      dataIndex: 'trimCount',
      key: 'trimCount',
      width: 80,
      align: 'center',
    },
  ];

  const allModelsColumns: ColumnsType<ModelInfo> = [
    {
      title: t('common.brand', 'Marka'),
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
      filters: data?.allModels
        ? [...new Set(data.allModels.map(m => m.brand))].map(b => ({ text: b, value: b }))
        : [],
      onFilter: (value, record) => record.brand === value,
    },
    {
      title: t('common.model', 'Model'),
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: t('lifecycle.entryPrice', 'Giris Fiyati'),
      dataIndex: 'entryPrice',
      key: 'entryPrice',
      width: 120,
      render: (price: number) => formatPrice(price),
      sorter: (a, b) => a.entryPrice - b.entryPrice,
    },
    {
      title: t('lifecycle.topPrice', 'Tepe Fiyat'),
      dataIndex: 'topPrice',
      key: 'topPrice',
      width: 120,
      render: (price: number) => formatPrice(price),
    },
    {
      title: t('lifecycle.trims', 'Donanim'),
      dataIndex: 'trimCount',
      key: 'trimCount',
      width: 80,
      align: 'center',
      sorter: (a, b) => b.trimCount - a.trimCount,
    },
    {
      title: t('lifecycle.fuelTypes', 'Yakit'),
      dataIndex: 'fuelTypes',
      key: 'fuelTypes',
      render: (fuels: string[]) => (
        <Space wrap size={[0, 4]}>
          {fuels.map(f => (
            <Tag key={f} style={{ fontSize: 11 }}>{f}</Tag>
          ))}
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

  const summary = data?.summary || {
    totalModels: 0,
    totalTransitions: 0,
    totalStaleModels: 0,
    avgEntryPriceDelta: 0,
  };

  const tabItems = [
    {
      key: 'transitions',
      label: (
        <Space>
          <SwapOutlined />
          {t('lifecycle.yearTransitions', 'Yil Gecisleri')} ({data?.modelYearTransitions?.length || 0})
        </Space>
      ),
      children: data?.modelYearTransitions && data.modelYearTransitions.length > 0 ? (
        <Table
          columns={transitionColumns}
          dataSource={data.modelYearTransitions}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      ) : (
        <Empty
          description={t('lifecycle.noTransitions', 'Model yili gecisi bulunamadi')}
          style={{ padding: tokens.spacing.xl }}
        />
      ),
    },
    {
      key: 'entryDeltas',
      label: (
        <Space>
          <RiseOutlined />
          {t('lifecycle.entryPriceChanges', 'Giris Fiyat Degisimleri')} ({data?.entryPriceDeltas?.length || 0})
        </Space>
      ),
      children: data?.entryPriceDeltas && data.entryPriceDeltas.length > 0 ? (
        <Table
          columns={entryDeltaColumns}
          dataSource={data.entryPriceDeltas}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 700 }}
        />
      ) : (
        <Empty
          description={t('lifecycle.noEntryDeltas', 'Giris fiyati degisimi bulunamadi')}
          style={{ padding: tokens.spacing.xl }}
        />
      ),
    },
    {
      key: 'stale',
      label: (
        <Space>
          <WarningOutlined />
          {t('lifecycle.staleModels', 'Eski Modeller')} ({data?.staleModels?.length || 0})
        </Space>
      ),
      children: data?.staleModels && data.staleModels.length > 0 ? (
        <Table
          columns={staleColumns}
          dataSource={data.staleModels}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 600 }}
        />
      ) : (
        <Empty
          description={t('lifecycle.noStaleModels', 'Eski model bulunamadi')}
          style={{ padding: tokens.spacing.xl }}
        />
      ),
    },
    {
      key: 'allModels',
      label: (
        <Space>
          <CarOutlined />
          {t('lifecycle.allModels', 'Tum Modeller')} ({data?.allModels?.length || 0})
        </Space>
      ),
      children: data?.allModels && data.allModels.length > 0 ? (
        <Table
          columns={allModelsColumns}
          dataSource={data.allModels}
          rowKey={(record) => `${record.brandId}-${record.model}`}
          size="small"
          pagination={{ pageSize: 15, showSizeChanger: true }}
          scroll={{ x: 700 }}
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
          <ClockCircleOutlined style={{ color: tokens.colors.primary }} />
          {t('lifecycle.title', 'Yasam Dongusu')}
        </Title>
        <Paragraph type="secondary" style={{ marginTop: tokens.spacing.xs }}>
          {t('lifecycle.subtitle', 'Model yili gecislerini ve fiyat degisimlerini takip edin')}
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
              title={t('lifecycle.totalModels', 'Toplam Model')}
              value={summary.totalModels}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('lifecycle.yearTransitions', 'Yil Gecisleri')}
              value={summary.totalTransitions}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('lifecycle.staleModels', 'Eski Modeller')}
              value={summary.totalStaleModels}
              valueStyle={{ color: summary.totalStaleModels > 0 ? tokens.colors.warning : undefined }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('lifecycle.avgEntryDelta', 'Ort. Giris Degisimi')}
              value={summary.avgEntryPriceDelta}
              precision={1}
              suffix="%"
              valueStyle={{ color: summary.avgEntryPriceDelta > 0 ? tokens.colors.error : tokens.colors.success }}
              prefix={summary.avgEntryPriceDelta > 0 ? <RiseOutlined /> : <FallOutlined />}
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
