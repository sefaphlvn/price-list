// Market Pulse Page - Price change feed, volatility metrics, and big moves
import { useTranslation } from 'react-i18next';
import { Typography, Card, Tabs, Empty, Row, Col, Statistic, List, Tag, Space, Spin, Alert } from 'antd';
import {
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';

import { tokens } from '../theme/tokens';
import { useEventsData, PriceEvent, VolatilityMetric } from '../hooks/useIntelData';

const { Title, Text, Paragraph } = Typography;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function EventCard({ event }: { event: PriceEvent }) {
  const { t } = useTranslation();

  const getEventIcon = () => {
    switch (event.type) {
      case 'new':
        return <PlusCircleOutlined style={{ color: tokens.colors.success }} />;
      case 'removed':
        return <MinusCircleOutlined style={{ color: tokens.colors.error }} />;
      case 'price_increase':
        return <ArrowUpOutlined style={{ color: tokens.colors.error }} />;
      case 'price_decrease':
        return <ArrowDownOutlined style={{ color: tokens.colors.success }} />;
      default:
        return <SwapOutlined />;
    }
  };

  const getEventTag = () => {
    switch (event.type) {
      case 'new':
        return <Tag color="green">{t('marketPulse.newVehicles', 'Yeni')}</Tag>;
      case 'removed':
        return <Tag color="red">{t('marketPulse.removedVehicles', 'Kaldirildi')}</Tag>;
      case 'price_increase':
        return <Tag color="volcano">+{event.priceChangePercent?.toFixed(1)}%</Tag>;
      case 'price_decrease':
        return <Tag color="cyan">{event.priceChangePercent?.toFixed(1)}%</Tag>;
      default:
        return null;
    }
  };

  return (
    <List.Item>
      <List.Item.Meta
        avatar={getEventIcon()}
        title={
          <Space>
            <Text strong>{event.brand} {event.model}</Text>
            {getEventTag()}
          </Space>
        }
        description={
          <Space direction="vertical" size={0}>
            <Text type="secondary">{event.trim} - {event.engine}</Text>
            {event.type === 'price_increase' || event.type === 'price_decrease' ? (
              <Text type="secondary">
                {event.oldPriceFormatted} → {event.newPriceFormatted}
                <Text style={{ marginLeft: 8, color: event.type === 'price_increase' ? tokens.colors.error : tokens.colors.success }}>
                  ({event.priceChange && event.priceChange > 0 ? '+' : ''}{formatPrice(event.priceChange || 0)})
                </Text>
              </Text>
            ) : (
              <Text type="secondary">{event.newPriceFormatted || event.oldPriceFormatted}</Text>
            )}
          </Space>
        }
      />
    </List.Item>
  );
}

function VolatilityTable({ data }: { data: VolatilityMetric[] }) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return <Empty description={t('common.noData', 'Veri bulunamadi')} />;
  }

  return (
    <List
      dataSource={data}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={item.name}
            description={
              <Space>
                <Tag>{item.changeCount} {t('marketPulse.priceChanges', 'degisim')}</Tag>
                <Tag color="green">{item.increaseCount} artis</Tag>
                <Tag color="red">{item.decreaseCount} dusus</Tag>
                <Text type="secondary">Ort: {item.avgChangePercent.toFixed(1)}%</Text>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
}

function BigMovesSection({ increases, decreases }: { increases: PriceEvent[]; decreases: PriceEvent[] }) {
  const { t } = useTranslation();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <ArrowUpOutlined style={{ color: tokens.colors.error }} />
              {t('marketPulse.topIncreases', 'En Cok Artanlar')}
            </Space>
          }
          size="small"
        >
          {increases.length > 0 ? (
            <List
              dataSource={increases.slice(0, 10)}
              size="small"
              renderItem={(event, index) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <Text strong>#{index + 1}</Text>
                      <Text>{event.brand} {event.model}</Text>
                    </Space>
                    <Tag color="volcano">+{event.priceChangePercent?.toFixed(1)}%</Tag>
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <Empty description={t('common.noData', 'Veri bulunamadi')} />
          )}
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <ArrowDownOutlined style={{ color: tokens.colors.success }} />
              {t('marketPulse.topDecreases', 'En Cok Dusenler')}
            </Space>
          }
          size="small"
        >
          {decreases.length > 0 ? (
            <List
              dataSource={decreases.slice(0, 10)}
              size="small"
              renderItem={(event, index) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <Text strong>#{index + 1}</Text>
                      <Text>{event.brand} {event.model}</Text>
                    </Space>
                    <Tag color="cyan">{event.priceChangePercent?.toFixed(1)}%</Tag>
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <Empty description={t('common.noData', 'Veri bulunamadi')} />
          )}
        </Card>
      </Col>
    </Row>
  );
}

export default function MarketPulsePage() {
  const { t } = useTranslation();
  const { data, loading, error } = useEventsData();

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
    totalEvents: 0,
    newVehicles: 0,
    removedVehicles: 0,
    priceIncreases: 0,
    priceDecreases: 0,
    avgPriceChange: 0,
    avgPriceChangePercent: 0,
  };

  const tabItems = [
    {
      key: 'changes',
      label: t('marketPulse.priceChanges', 'Fiyat Degisimleri'),
      children: data?.events && data.events.length > 0 ? (
        <List
          dataSource={data.events.slice(0, 50)}
          renderItem={(event) => <EventCard event={event} />}
          pagination={{ pageSize: 10 }}
        />
      ) : (
        <Empty
          description={t('common.noData', 'Veri bulunamadi')}
          style={{ padding: tokens.spacing.xl }}
        />
      ),
    },
    {
      key: 'volatility',
      label: t('marketPulse.volatility', 'Volatilite'),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={t('common.brand', 'Marka')} size="small">
              <VolatilityTable data={data?.volatility?.byBrand || []} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={t('common.model', 'Model')} size="small">
              <VolatilityTable data={data?.volatility?.byModel || []} />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'bigMoves',
      label: t('marketPulse.bigMoves', 'Buyuk Hareketler'),
      children: (
        <BigMovesSection
          increases={data?.bigMoves?.topIncreases || []}
          decreases={data?.bigMoves?.topDecreases || []}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThunderboltOutlined style={{ color: tokens.colors.primary }} />
          {t('marketPulse.title', 'Piyasa Nabzi')}
        </Title>
        <Paragraph type="secondary" style={{ marginTop: tokens.spacing.xs }}>
          {t('marketPulse.subtitle', 'Fiyat degisimlerini ve piyasa hareketlerini takip edin')}
          {data?.date && (
            <Text type="secondary" style={{ marginLeft: 8 }}>
              ({data.previousDate} → {data.date})
            </Text>
          )}
        </Paragraph>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing.lg }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('marketPulse.totalChanges', 'Toplam Degisim')}
              value={summary.totalEvents}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('marketPulse.increases', 'Artislar')}
              value={summary.priceIncreases}
              valueStyle={{ color: tokens.colors.error }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('marketPulse.decreases', 'Dususler')}
              value={summary.priceDecreases}
              valueStyle={{ color: tokens.colors.success }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('marketPulse.newVehicles', 'Yeni Araclar')}
              value={summary.newVehicles}
              prefix={<PlusCircleOutlined />}
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
