// Favorites Widget Component
// Shows user's favorite vehicles

import { useTranslation } from 'react-i18next';
import { Card, Typography, List, Button, Empty, Tag } from 'antd';
import {
  HeartFilled,
  DeleteOutlined,
  SwapOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { tokens } from '../../theme/tokens';
import { useAppStore, createVehicleIdentifier } from '../../store';

const { Text } = Typography;

export default function FavoritesWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { favorites, removeFavorite, addToCompare, isInCompare } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
            <HeartFilled style={{ color: tokens.colors.error }} />
            <span>{t('my.favorites', 'Favorites')}</span>
            <Tag>{favorites.length}</Tag>
          </div>
        }
        extra={
          favorites.length > 0 && (
            <Button
              type="link"
              size="small"
              onClick={() => navigate('/karsilastirma')}
              icon={<RightOutlined />}
            >
              {t('common.viewAll', 'View All')}
            </Button>
          )
        }
        bodyStyle={{ padding: favorites.length > 0 ? undefined : tokens.spacing.xl }}
      >
        {favorites.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">{t('comparison.favorites.empty', 'No favorites added yet')}</Text>
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
            dataSource={favorites.slice(0, 5)}
            renderItem={(favorite) => {
              const isComparing = isInCompare(favorite.id);
              const vehicleIdentifier = createVehicleIdentifier(
                favorite.brand,
                favorite.model,
                favorite.trim,
                favorite.engine
              );

              return (
                <List.Item
                  style={{ padding: '8px 0' }}
                  actions={[
                    <Button
                      key="compare"
                      type="text"
                      size="small"
                      icon={<SwapOutlined />}
                      disabled={isComparing}
                      onClick={() => addToCompare(vehicleIdentifier)}
                      title={t('priceList.addToCompare', 'Add to Compare')}
                    />,
                    <Button
                      key="remove"
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeFavorite(favorite.id)}
                      title={t('common.remove', 'Remove')}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Text strong>
                        {favorite.brand} {favorite.model}
                      </Text>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {favorite.trim} | {favorite.engine}
                      </Text>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}

        {favorites.length > 5 && (
          <div style={{ textAlign: 'center', marginTop: tokens.spacing.sm }}>
            <Button type="link" size="small" onClick={() => navigate('/karsilastirma')}>
              {t('my.viewMore', '+{{count}} more', { count: favorites.length - 5 })}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
