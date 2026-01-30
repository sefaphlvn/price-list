// Architecture Page - Trim ladder and cross-brand comparison
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Card, Tabs, Empty, Select, Row, Col, Statistic, Tag, List, Space, Spin, Alert } from 'antd';
import {
  ApartmentOutlined,
  RiseOutlined,
  CarOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { tokens } from '../theme/tokens';
import { useArchitectureData, TrimLadder, SegmentComparison, TrimStep } from '../hooks/useIntelData';

const { Title, Text, Paragraph } = Typography;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];

interface TrimLadderChartProps {
  ladder: TrimLadder;
}

function TrimLadderChart({ ladder }: TrimLadderChartProps) {
  const { t } = useTranslation();

  const chartData = ladder.trims.map((trim: TrimStep, index: number) => ({
    name: trim.trim.length > 15 ? trim.trim.substring(0, 15) + '...' : trim.trim,
    fullName: trim.trim,
    price: trim.price,
    stepFromBase: trim.stepFromBase,
    stepPercent: trim.stepPercent,
    engine: trim.engine,
    fuel: trim.fuel,
    transmission: trim.transmission,
    index,
  }));

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing.lg }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('architecture.basePrice', 'Giriş Fiyatı')}
              value={formatPrice(ladder.basePrice)}
              valueStyle={{ fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('architecture.topPrice', 'Tepe Fiyatı')}
              value={formatPrice(ladder.topPrice)}
              valueStyle={{ fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('architecture.priceSpread', 'Fiyat Aralığı')}
              value={formatPrice(ladder.priceSpread)}
              valueStyle={{ fontSize: 16, color: tokens.colors.primary }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('architecture.spreadPercent', 'Aralık %')}
              value={ladder.priceSpreadPercent}
              suffix="%"
              valueStyle={{ fontSize: 16 }}
            />
          </Card>
        </Col>
      </Row>

      <ResponsiveContainer width="100%" height={Math.max(300, ladder.trims.length * 50)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={(value) => formatPrice(value)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => formatPrice(value)}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                const data = payload[0].payload;
                return `${data.fullName} (${data.engine}, ${data.fuel}, ${data.transmission})`;
              }
              return label;
            }}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="price" name={t('common.price', 'Fiyat')}>
            {chartData.map((_, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <List
        size="small"
        dataSource={ladder.trims}
        style={{ marginTop: tokens.spacing.lg }}
        renderItem={(trim: TrimStep, index: number) => (
          <List.Item>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <Text strong style={{ color: COLORS[index % COLORS.length] }}>#{index + 1}</Text>
                <Text>{trim.trim}</Text>
                <Tag>{trim.engine}</Tag>
                <Tag>{trim.fuel}</Tag>
                <Tag>{trim.transmission}</Tag>
              </Space>
              <Space>
                <Text strong>{formatPrice(trim.price)}</Text>
                {index > 0 && isFinite(trim.stepPercent) && (
                  <Tag color="blue">+{formatPrice(trim.stepFromBase)} (+{trim.stepPercent.toFixed(1)}%)</Tag>
                )}
              </Space>
            </Space>
          </List.Item>
        )}
      />
    </div>
  );
}

interface CrossBrandComparisonProps {
  comparison: SegmentComparison;
}

function CrossBrandComparison({ comparison }: CrossBrandComparisonProps) {
  const { t } = useTranslation();

  const chartData = comparison.models.map((model, index) => ({
    name: `${model.brand} ${model.model}`.length > 20
      ? `${model.brand} ${model.model}`.substring(0, 20) + '...'
      : `${model.brand} ${model.model}`,
    fullName: `${model.brand} ${model.model}`,
    basePrice: model.basePrice,
    topPrice: model.topPrice,
    trimCount: model.trimCount,
    index,
  }));

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing.lg }}>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title={t('architecture.modelCount', 'Model Sayısı')}
              value={comparison.models.length}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title={t('architecture.avgBasePrice', 'Ort. Giriş')}
              value={formatPrice(comparison.avgBasePrice)}
              valueStyle={{ fontSize: 14 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title={t('architecture.avgTopPrice', 'Ort. Tepe')}
              value={formatPrice(comparison.avgTopPrice)}
              valueStyle={{ fontSize: 14 }}
            />
          </Card>
        </Col>
      </Row>

      <ResponsiveContainer width="100%" height={Math.max(300, comparison.models.length * 40)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={(value) => formatPrice(value)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatPrice(value), name === 'basePrice' ? 'Giriş' : 'Tepe']}
            labelFormatter={(label: string) => label}
          />
          <Bar dataKey="basePrice" name={t('architecture.basePrice', 'Giriş')} fill={tokens.colors.success} />
          <Bar dataKey="topPrice" name={t('architecture.topPrice', 'Tepe')} fill={tokens.colors.primary} />
        </BarChart>
      </ResponsiveContainer>

      <List
        size="small"
        dataSource={comparison.models}
        style={{ marginTop: tokens.spacing.lg }}
        renderItem={(model, index) => (
          <List.Item>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <Text strong>#{index + 1}</Text>
                <Text>{model.brand} {model.model}</Text>
                <Tag>{model.trimCount} {t('architecture.trims', 'donanım')}</Tag>
              </Space>
              <Space>
                <Tag color="green">{formatPrice(model.basePrice)}</Tag>
                <Text>→</Text>
                <Tag color="blue">{formatPrice(model.topPrice)}</Tag>
              </Space>
            </Space>
          </List.Item>
        )}
      />
    </div>
  );
}

export default function ArchitecturePage() {
  const { t } = useTranslation();
  const { data, loading, error } = useArchitectureData();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const brands = useMemo(() => {
    if (!data?.ladders) return [];
    const brandSet = new Set(data.ladders.map((l: TrimLadder) => l.brand));
    return Array.from(brandSet).sort((a, b) => a.localeCompare(b, 'tr')).map((brand) => ({
      value: brand,
      label: brand,
    }));
  }, [data]);

  const models = useMemo(() => {
    if (!data?.ladders || !selectedBrand) return [];
    return data.ladders
      .filter((l: TrimLadder) => l.brand === selectedBrand)
      .map((l: TrimLadder) => ({
        value: l.id,
        label: l.model,
      }))
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));
  }, [data, selectedBrand]);

  const segments = useMemo(() => {
    if (!data?.crossBrandComparison) return [];
    return data.crossBrandComparison.map((s: SegmentComparison) => ({
      value: s.segment,
      label: `${s.segment} (${s.models.length} model)`,
    }));
  }, [data]);

  const selectedLadder = useMemo(() => {
    if (!data?.ladders || !selectedModel) return null;
    return data.ladders.find((l: TrimLadder) => l.id === selectedModel) || null;
  }, [data, selectedModel]);

  const selectedComparison = useMemo(() => {
    if (!data?.crossBrandComparison || !selectedSegment) return null;
    return data.crossBrandComparison.find((s: SegmentComparison) => s.segment === selectedSegment) || null;
  }, [data, selectedSegment]);

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
    avgTrimsPerModel: 0,
    avgPriceSpread: 0,
    avgPriceSpreadPercent: 0,
  };

  const tabItems = [
    {
      key: 'ladder',
      label: t('architecture.trimLadder', 'Donanim Merdiveni'),
      children: selectedLadder ? (
        <TrimLadderChart ladder={selectedLadder} />
      ) : (
        <Empty
          description={t('architecture.selectModelForLadder', 'Donanım merdivenini görmek için yukarıdan marka ve model seçin')}
          style={{ padding: tokens.spacing.xl }}
        />
      ),
    },
    {
      key: 'crossBrand',
      label: t('architecture.crossBrand', 'Markalar Arası'),
      children: selectedComparison ? (
        <CrossBrandComparison comparison={selectedComparison} />
      ) : (
        <Empty
          description={t('architecture.selectSegmentForComparison', 'Markalar arası karşılaştırma için segment seçin')}
          style={{ padding: tokens.spacing.xl }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ApartmentOutlined style={{ color: tokens.colors.primary }} />
          {t('architecture.title', 'Fiyat Mimarisi')}
        </Title>
        <Paragraph type="secondary" style={{ marginTop: tokens.spacing.xs }}>
          {t('architecture.subtitle', 'Donanim merdiveni ve markalar arasi karsilastirma')}
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
              title={t('architecture.totalModels', 'Toplam Model')}
              value={summary.totalModels}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('architecture.avgTrims', 'Ort. Donanım')}
              value={summary.avgTrimsPerModel}
              suffix={t('architecture.perModel', '/ model')}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('architecture.avgSpread', 'Ort. Aralık')}
              value={formatPrice(summary.avgPriceSpread)}
              valueStyle={{ fontSize: 14 }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('architecture.avgSpreadPercent', 'Ort. Aralık %')}
              value={summary.avgPriceSpreadPercent}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: tokens.spacing.lg }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Select
              style={{ width: '100%' }}
              placeholder={t('architecture.selectBrand', 'Marka seçin')}
              options={brands}
              value={selectedBrand}
              onChange={(value) => {
                setSelectedBrand(value);
                setSelectedModel(null);
              }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              style={{ width: '100%' }}
              placeholder={t('architecture.selectModel', 'Model seçin')}
              options={models}
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={!selectedBrand}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              style={{ width: '100%' }}
              placeholder={t('architecture.selectSegment', 'Segment seçin')}
              options={segments}
              value={selectedSegment}
              onChange={setSelectedSegment}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
