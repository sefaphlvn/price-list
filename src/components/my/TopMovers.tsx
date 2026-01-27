// Top Movers Component
// Shows vehicles with biggest price increases and decreases

import { useTranslation } from 'react-i18next';
import { Card, Typography, Row, Col, List, Tag, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, FireOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

import { tokens } from '../../theme/tokens';
import { PriceChange } from '../../store';

const { Title, Text } = Typography;

interface TopMoversProps {
  priceChanges: PriceChange[];
}

export default function TopMovers({ priceChanges }: TopMoversProps) {
  const { t } = useTranslation();

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Sort by absolute change percent for top movers
  const sortedByIncrease = [...priceChanges]
    .filter(c => c.diff > 0)
    .sort((a, b) => b.diffPercent - a.diffPercent)
    .slice(0, 3);

  const sortedByDecrease = [...priceChanges]
    .filter(c => c.diff < 0)
    .sort((a, b) => a.diffPercent - b.diffPercent)
    .slice(0, 3);

  const renderMoverItem = (change: PriceChange, isIncrease: boolean) => {
    const vehicle = change.vehicle;
    const icon = isIncrease ? <ArrowUpOutlined /> : <ArrowDownOutlined />;

    return (
      <List.Item style={{ padding: '8px 0', borderBottom: `1px solid ${tokens.colors.gray[100]}` }}>
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Text strong style={{ display: 'block' }}>
                {vehicle.brand} {vehicle.model}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {vehicle.trim}
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Tag color={isIncrease ? 'red' : 'green'} style={{ marginBottom: 4 }}>
                {icon} {change.diffPercent > 0 ? '+' : ''}{change.diffPercent.toFixed(1)}%
              </Tag>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatPrice(change.diff)}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </List.Item>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md }}>
          <FireOutlined style={{ fontSize: 20, color: tokens.colors.warning }} />
          <Title level={4} style={{ marginBottom: 0 }}>
            {t('my.topMovers', 'Top Movers')}
          </Title>
        </div>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: tokens.spacing.sm }}>
              <Space>
                <ArrowUpOutlined style={{ color: tokens.colors.error }} />
                <Text strong style={{ color: tokens.colors.error }}>
                  {t('my.topGainers', 'Top Gainers')}
                </Text>
              </Space>
            </div>
            {sortedByIncrease.length > 0 ? (
              <List
                dataSource={sortedByIncrease}
                renderItem={(item) => renderMoverItem(item, true)}
                size="small"
              />
            ) : (
              <Text type="secondary">{t('my.noIncrease', 'No price increases')}</Text>
            )}
          </Col>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: tokens.spacing.sm }}>
              <Space>
                <ArrowDownOutlined style={{ color: tokens.colors.success }} />
                <Text strong style={{ color: tokens.colors.success }}>
                  {t('my.topLosers', 'Top Losers')}
                </Text>
              </Space>
            </div>
            {sortedByDecrease.length > 0 ? (
              <List
                dataSource={sortedByDecrease}
                renderItem={(item) => renderMoverItem(item, false)}
                size="small"
              />
            ) : (
              <Text type="secondary">{t('my.noDecrease', 'No price decreases')}</Text>
            )}
          </Col>
        </Row>
      </Card>
    </motion.div>
  );
}
