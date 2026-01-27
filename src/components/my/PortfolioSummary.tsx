// Portfolio Summary Component
// Shows total value change across tracked vehicles

import { useTranslation } from 'react-i18next';
import { Card, Typography, Space, Statistic, Row, Col } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, WalletOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

import { tokens } from '../../theme/tokens';
import { PriceChange } from '../../store';

const { Title, Text } = Typography;

interface PortfolioSummaryProps {
  priceChanges: PriceChange[];
}

export default function PortfolioSummary({ priceChanges }: PortfolioSummaryProps) {
  const { t } = useTranslation();

  const totalChange = priceChanges.reduce((sum, change) => sum + change.diff, 0);
  const avgChangePercent = priceChanges.length > 0
    ? priceChanges.reduce((sum, change) => sum + change.diffPercent, 0) / priceChanges.length
    : 0;

  const increasedCount = priceChanges.filter(c => c.diff > 0).length;
  const decreasedCount = priceChanges.filter(c => c.diff < 0).length;

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const isPositive = totalChange > 0;
  const changeColor = isPositive ? tokens.colors.error : tokens.colors.success;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md }}>
          <WalletOutlined style={{ fontSize: 20, color: tokens.colors.primary }} />
          <Title level={4} style={{ marginBottom: 0 }}>
            {t('my.portfolioSummary', 'Portfolio Summary')}
          </Title>
        </div>

        <Row gutter={[24, 16]}>
          <Col xs={24} sm={8}>
            <Statistic
              title={t('my.totalChange', 'Total Change')}
              value={totalChange}
              precision={0}
              formatter={(value) => (
                <Space>
                  {isPositive ? (
                    <ArrowUpOutlined style={{ color: changeColor }} />
                  ) : (
                    <ArrowDownOutlined style={{ color: changeColor }} />
                  )}
                  <span style={{ color: changeColor }}>
                    {formatPrice(Math.abs(value as number))}
                  </span>
                </Space>
              )}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title={t('my.avgChange', 'Avg. Change')}
              value={avgChangePercent}
              precision={2}
              suffix="%"
              valueStyle={{ color: isPositive ? tokens.colors.error : tokens.colors.success }}
              prefix={isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            />
          </Col>
          <Col xs={24} sm={8}>
            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                {t('my.breakdown', 'Breakdown')}
              </Text>
              <Space size="large">
                <Space>
                  <ArrowUpOutlined style={{ color: tokens.colors.error }} />
                  <Text strong style={{ color: tokens.colors.error }}>{increasedCount}</Text>
                  <Text type="secondary">{t('tracking.increased', 'Increased')}</Text>
                </Space>
                <Space>
                  <ArrowDownOutlined style={{ color: tokens.colors.success }} />
                  <Text strong style={{ color: tokens.colors.success }}>{decreasedCount}</Text>
                  <Text type="secondary">{t('tracking.decreased', 'Decreased')}</Text>
                </Space>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>
    </motion.div>
  );
}
