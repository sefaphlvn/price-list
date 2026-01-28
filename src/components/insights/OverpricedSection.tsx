// Overpriced Section Component
// Shows vehicles that are more expensive than expected (expensive outliers)

import { useTranslation } from 'react-i18next';
import { List, Card, Tag, Typography, Space, Tooltip, Alert } from 'antd';
import {
  RiseOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

import { tokens } from '../../theme/tokens';

const { Text, Title } = Typography;

interface VehicleWithScore {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  trim: string;
  engine: string;
  fuel: string;
  transmission: string;
  vehicleClass: string;
  priceBand: string;
  price: number;
  priceFormatted: string;
  dealScore: number;
  zScore: number;
  percentile: number;
  segmentAvg: number;
  segmentSize: number;
  isOutlier: boolean;
  outlierType: 'cheap' | 'expensive' | null;
}

interface OverpricedSectionProps {
  vehicles: VehicleWithScore[];
}

export default function OverpricedSection({ vehicles }: OverpricedSectionProps) {
  const { t } = useTranslation();

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getOverpriceAmount = (vehicle: VehicleWithScore): number => {
    return vehicle.price - vehicle.segmentAvg;
  };

  const getOverpricePercent = (vehicle: VehicleWithScore): number => {
    return Math.round((getOverpriceAmount(vehicle) / vehicle.segmentAvg) * 100);
  };

  if (vehicles.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: tokens.spacing.xl }}>
        <RiseOutlined style={{ fontSize: 48, color: tokens.colors.gray[300], marginBottom: 16 }} />
        <Title level={4} type="secondary">
          {t('insights.noOverpriced', 'No overpriced vehicles found')}
        </Title>
        <Text type="secondary">
          {t('insights.allFairlyPriced', 'All vehicles are fairly priced within their segments')}
        </Text>
      </div>
    );
  }

  return (
    <div>
      <Alert
        message={t('insights.overpricedWarning', 'Price Warning')}
        description={t(
          'insights.overpricedExplanation',
          'These vehicles are priced significantly above their segment average. Consider alternatives or negotiate the price.'
        )}
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        style={{ marginBottom: tokens.spacing.md }}
      />

      <List
        dataSource={vehicles}
        renderItem={(vehicle, index) => (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              style={{
                marginBottom: tokens.spacing.md,
                borderLeft: `4px solid ${tokens.colors.error}`,
              }}
              hoverable
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left: Vehicle Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
                    <RiseOutlined style={{ color: tokens.colors.error, fontSize: 18 }} />
                    <Title level={5} style={{ marginBottom: 0 }}>
                      {vehicle.brand} {vehicle.model}
                    </Title>
                    <Tag color="red">
                      +{getOverpricePercent(vehicle)}%
                    </Tag>
                  </div>

                  <Text type="secondary" style={{ display: 'block', marginBottom: tokens.spacing.sm }}>
                    {vehicle.trim} | {vehicle.engine} | {vehicle.fuel}
                  </Text>

                  <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 18, color: tokens.colors.error }}>
                      {formatPrice(vehicle.price)}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('insights.segmentAvg', 'Segment avg')}: {formatPrice(vehicle.segmentAvg)}
                    </Text>
                  </Space>
                </div>

                {/* Right: Overprice indicator */}
                <div style={{ textAlign: 'center', minWidth: 140 }}>
                  <Tooltip title={t('insights.overpriceTooltip', 'Amount above segment average')}>
                    <div
                      style={{
                        background: tokens.colors.error,
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: tokens.borderRadius.md,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, display: 'block' }}>
                        {t('insights.overpriced', 'Overpriced')}
                      </Text>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
                        +{formatPrice(getOverpriceAmount(vehicle))}
                      </Text>
                    </div>
                  </Tooltip>

                  <div style={{ marginTop: tokens.spacing.sm }}>
                    <Tooltip title={t('insights.zScoreExplanation', 'Statistical deviation from average')}>
                      <Space>
                        <InfoCircleOutlined style={{ color: tokens.colors.gray[400] }} />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Z-score: {vehicle.zScore.toFixed(2)}
                        </Text>
                      </Space>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      />
    </div>
  );
}
