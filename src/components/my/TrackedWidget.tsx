// Tracked Widget Component
// Shows user's tracked vehicles and recent price changes

import { useTranslation } from 'react-i18next';
import { Card, Typography, List, Button, Empty, Space, Tag } from 'antd';
import {
  BellFilled,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { tokens } from '../../theme/tokens';
import { useAppStore, PriceChange } from '../../store';

const { Text } = Typography;

export default function TrackedWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trackedVehicles, priceChanges, removeTrackedVehicle } = useAppStore();

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getVehicleChange = (vehicleId: string): PriceChange | undefined => {
    return priceChanges.find(c => c.vehicle.id === vehicleId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
            <BellFilled style={{ color: tokens.colors.primary }} />
            <span>{t('my.tracked', 'Tracked')}</span>
            <Tag>{trackedVehicles.length}</Tag>
            {priceChanges.length > 0 && (
              <Tag color="red">{priceChanges.length} {t('my.changes', 'changes')}</Tag>
            )}
          </div>
        }
        extra={
          trackedVehicles.length > 0 && (
            <Button
              type="link"
              size="small"
              onClick={() => navigate('/fiyat-listesi')}
              icon={<RightOutlined />}
            >
              {t('common.viewAll', 'View All')}
            </Button>
          )
        }
        bodyStyle={{ padding: trackedVehicles.length > 0 ? undefined : tokens.spacing.xl }}
      >
        {trackedVehicles.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">{t('tracking.empty', 'No tracked vehicles')}</Text>
              </div>
            }
          >
            <Button
              type="primary"
              size="small"
              onClick={() => navigate('/fiyat-listesi')}
            >
              {t('my.browsePrices', 'Browse Price List')}
            </Button>
          </Empty>
        ) : (
          <List
            dataSource={trackedVehicles.slice(0, 5)}
            renderItem={(tracked) => {
              const change = getVehicleChange(tracked.id);

              return (
                <List.Item
                  style={{ padding: '8px 0' }}
                  actions={[
                    <Button
                      key="remove"
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeTrackedVehicle(tracked.id)}
                      title={t('priceList.untrack', 'Untrack')}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>
                          {tracked.brand} {tracked.model}
                        </Text>
                        {change && (
                          <Tag color={change.diff > 0 ? 'red' : 'green'}>
                            {change.diff > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                            {' '}{change.diffPercent > 0 ? '+' : ''}{change.diffPercent.toFixed(1)}%
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                          {tracked.trim} | {tracked.engine}
                        </Text>
                        {change && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {formatPrice(change.oldPrice)} → {formatPrice(change.newPrice)}
                          </Text>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}

        {trackedVehicles.length > 5 && (
          <div style={{ textAlign: 'center', marginTop: tokens.spacing.sm }}>
            <Button type="link" size="small" onClick={() => navigate('/fiyat-listesi')}>
              {t('my.viewMore', '+{{count}} more', { count: trackedVehicles.length - 5 })}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
