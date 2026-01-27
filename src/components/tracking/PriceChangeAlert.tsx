// Price Change Alert - Banner shown when tracked vehicles have price changes
import { useTranslation } from 'react-i18next';
import { Alert, Button, Space } from 'antd';
import { BellOutlined } from '@ant-design/icons';

import { useAppStore } from '../../store';

interface PriceChangeAlertProps {
  onViewChanges: () => void;
}

export default function PriceChangeAlert({ onViewChanges }: PriceChangeAlertProps) {
  const { t } = useTranslation();
  const { priceChanges, clearPriceChanges } = useAppStore();

  if (priceChanges.length === 0) return null;

  const increasedCount = priceChanges.filter((c) => c.diff > 0).length;
  const decreasedCount = priceChanges.filter((c) => c.diff < 0).length;

  return (
    <Alert
      message={
        <Space>
          <BellOutlined />
          {t('tracking.vehiclesChanged', { count: priceChanges.length })}
          {increasedCount > 0 && (
            <span style={{ color: '#ef4444' }}>
              ({increasedCount} {t('tracking.increased')})
            </span>
          )}
          {decreasedCount > 0 && (
            <span style={{ color: '#10b981' }}>
              ({decreasedCount} {t('tracking.decreased')})
            </span>
          )}
        </Space>
      }
      type="info"
      showIcon
      closable
      onClose={clearPriceChanges}
      action={
        <Button size="small" type="primary" onClick={onViewChanges}>
          {t('common.viewAll')}
        </Button>
      }
      style={{ marginBottom: 16 }}
    />
  );
}
