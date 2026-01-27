// Tracked Vehicles Drawer - Shows price changes for tracked vehicles
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  List,
  Typography,
  Tag,
  Space,
  Button,
  Empty,
  Segmented,
  Popconfirm,
} from 'antd';
import {
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SyncOutlined,
} from '@ant-design/icons';

import { useAppStore, PriceChange, TrackedVehicle } from '../../store';
import { tokens } from '../../theme/tokens';

const { Text, Title } = Typography;

interface TrackedVehiclesDrawerProps {
  open: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'increased' | 'decreased';

export default function TrackedVehiclesDrawer({ open, onClose }: TrackedVehiclesDrawerProps) {
  const { t } = useTranslation();
  const {
    trackedVehicles,
    priceChanges,
    removeTrackedVehicle,
    clearTrackedVehicles,
    updateTrackedVehicle,
    clearPriceChanges,
  } = useAppStore();

  const [filter, setFilter] = useState<FilterType>('all');

  // Filter price changes
  const filteredChanges = useMemo(() => {
    if (filter === 'all') return priceChanges;
    if (filter === 'increased') return priceChanges.filter((c) => c.diff > 0);
    if (filter === 'decreased') return priceChanges.filter((c) => c.diff < 0);
    return priceChanges;
  }, [priceChanges, filter]);

  // Get vehicles without price changes
  const unchangedVehicles = useMemo(() => {
    const changedIds = new Set(priceChanges.map((c) => c.vehicle.id));
    return trackedVehicles.filter((v) => !changedIds.has(v.id));
  }, [trackedVehicles, priceChanges]);

  // Handle update all - marks all current prices as seen
  const handleUpdateAll = () => {
    priceChanges.forEach((change) => {
      updateTrackedVehicle(change.vehicle.id, change.newPrice, change.newPriceRaw);
    });
    clearPriceChanges();
  };

  // Handle remove tracked vehicle
  const handleRemove = (id: string) => {
    removeTrackedVehicle(id);
  };

  // Format price difference
  const formatDiff = (diff: number, diffPercent: number) => {
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toLocaleString('tr-TR')} TL (${sign}${diffPercent.toFixed(1)}%)`;
  };

  return (
    <Drawer
      title={
        <Space>
          <SyncOutlined />
          {t('tracking.title')}
        </Space>
      }
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
      extra={
        trackedVehicles.length > 0 && (
          <Space>
            {priceChanges.length > 0 && (
              <Button type="primary" size="small" onClick={handleUpdateAll}>
                {t('tracking.updateAll')}
              </Button>
            )}
            <Popconfirm
              title={t('common.confirm')}
              onConfirm={clearTrackedVehicles}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button danger size="small">
                {t('tracking.clearAll')}
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    >
      {trackedVehicles.length === 0 ? (
        <Empty
          description={
            <div>
              <Text type="secondary">{t('tracking.empty')}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('tracking.addHint')}
              </Text>
            </div>
          }
        />
      ) : (
        <>
          {/* Price Changes Section */}
          {priceChanges.length > 0 && (
            <>
              <Title level={5} style={{ marginBottom: tokens.spacing.md }}>
                {t('tracking.priceChanges')} ({priceChanges.length})
              </Title>

              <Segmented
                value={filter}
                onChange={(v) => setFilter(v as FilterType)}
                options={[
                  { label: t('tracking.showAll'), value: 'all' },
                  { label: t('tracking.showIncreased'), value: 'increased' },
                  { label: t('tracking.showDecreased'), value: 'decreased' },
                ]}
                style={{ marginBottom: tokens.spacing.md }}
              />

              <List
                dataSource={filteredChanges}
                renderItem={(change: PriceChange) => (
                  <List.Item
                    style={{
                      background: change.diff > 0
                        ? 'rgba(239, 68, 68, 0.05)'
                        : 'rgba(16, 185, 129, 0.05)',
                      borderRadius: tokens.borderRadius.md,
                      marginBottom: tokens.spacing.sm,
                      padding: tokens.spacing.md,
                    }}
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(change.vehicle.id)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{change.vehicle.model}</Text>
                          <Tag>{change.vehicle.brand}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {change.vehicle.trim}
                          </Text>
                          <div style={{ marginTop: tokens.spacing.xs }}>
                            <Space>
                              <Text delete type="secondary">
                                {change.oldPriceRaw}
                              </Text>
                              <Text>→</Text>
                              <Text
                                strong
                                style={{
                                  color: change.diff > 0
                                    ? tokens.colors.error
                                    : tokens.colors.success,
                                }}
                              >
                                {change.newPriceRaw}
                              </Text>
                            </Space>
                          </div>
                          <div style={{ marginTop: tokens.spacing.xs }}>
                            <Tag
                              color={change.diff > 0 ? 'error' : 'success'}
                              icon={change.diff > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                            >
                              {formatDiff(change.diff, change.diffPercent)}
                            </Tag>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                style={{ marginBottom: tokens.spacing.xl }}
              />
            </>
          )}

          {/* Unchanged Vehicles Section */}
          {unchangedVehicles.length > 0 && (
            <>
              <Title level={5} style={{ marginBottom: tokens.spacing.md }}>
                {t('tracking.noChanges')} ({unchangedVehicles.length})
              </Title>

              <List
                dataSource={unchangedVehicles}
                renderItem={(vehicle: TrackedVehicle) => (
                  <List.Item
                    style={{
                      background: tokens.colors.surface,
                      borderRadius: tokens.borderRadius.md,
                      marginBottom: tokens.spacing.sm,
                      padding: tokens.spacing.md,
                    }}
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(vehicle.id)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{vehicle.model}</Text>
                          <Tag>{vehicle.brand}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {vehicle.trim}
                          </Text>
                          <div style={{ marginTop: tokens.spacing.xs }}>
                            <Text style={{ color: tokens.colors.success }}>
                              {vehicle.lastPriceRaw}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </>
          )}
        </>
      )}
    </Drawer>
  );
}
