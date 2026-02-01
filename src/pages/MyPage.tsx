// My Page - Personal Dashboard
// Shows user's favorites, tracked vehicles, and portfolio summary

import { useTranslation } from 'react-i18next';
import { Typography, Row, Col, Card, Empty, Button } from 'antd';
import {
  UserOutlined,
  HeartOutlined,
  BellOutlined,
  SwapOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { tokens } from '../theme/tokens';
import { useAppStore } from '../store';
import { useIsMobile } from '../hooks/useMediaQuery';
import PortfolioSummary from '../components/my/PortfolioSummary';
import TopMovers from '../components/my/TopMovers';
import FavoritesWidget from '../components/my/FavoritesWidget';
import TrackedWidget from '../components/my/TrackedWidget';

const { Title, Text } = Typography;

export default function MyPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { favorites, trackedVehicles, compareList, priceChanges } = useAppStore();

  const hasData = favorites.length > 0 || trackedVehicles.length > 0;

  // Count increases and decreases
  const increasedCount = priceChanges.filter(c => c.diff > 0).length;
  const decreasedCount = priceChanges.filter(c => c.diff < 0).length;

  if (!hasData) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <div style={{ marginBottom: tokens.spacing.xl }}>
          <Title level={2} style={{ marginBottom: tokens.spacing.xs }}>
            <UserOutlined style={{ marginRight: tokens.spacing.sm }} />
            {t('my.title', 'My Dashboard')}
          </Title>
          <Text type="secondary">
            {t('my.subtitle', 'Your personalized vehicle tracking dashboard')}
          </Text>
        </div>

        <Card style={{ textAlign: 'center', padding: tokens.spacing.xl }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4} type="secondary" style={{ marginBottom: tokens.spacing.sm }}>
                  {t('my.emptyTitle', 'No vehicles tracked yet')}
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: tokens.spacing.md }}>
                  {t('my.emptyDesc', 'Add vehicles to your favorites or start tracking price changes to see your personalized dashboard.')}
                </Text>
              </div>
            }
          >
            <Button
              type="primary"
              icon={<HeartOutlined />}
              onClick={() => navigate('/fiyat-listesi')}
            >
              {t('my.browsePrices', 'Browse Price List')}
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      {/* Header */}
      <div style={{ marginBottom: tokens.spacing.xl }}>
        <Title level={2} style={{ marginBottom: tokens.spacing.xs }}>
          <UserOutlined style={{ marginRight: tokens.spacing.sm }} />
          {t('my.title', 'My Dashboard')}
        </Title>
        <Text type="secondary">
          {t('my.subtitle', 'Your personalized vehicle tracking dashboard')}
        </Text>
      </div>

      {/* Quick Stats */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: tokens.spacing.xl }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <HeartOutlined style={{ fontSize: isMobile ? 20 : 24, color: tokens.colors.error, marginBottom: 4 }} />
              <Title level={isMobile ? 4 : 3} style={{ marginBottom: 0 }}>
                {favorites.length}
              </Title>
              <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                {t('my.favorites', 'Favorites')}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <BellOutlined style={{ fontSize: isMobile ? 20 : 24, color: tokens.colors.primary, marginBottom: 4 }} />
              <Title level={isMobile ? 4 : 3} style={{ marginBottom: 0 }}>
                {trackedVehicles.length}
              </Title>
              <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                {t('my.tracked', 'Tracked')}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <SwapOutlined style={{ fontSize: isMobile ? 20 : 24, color: tokens.colors.accent, marginBottom: 4 }} />
              <Title level={isMobile ? 4 : 3} style={{ marginBottom: 0 }}>
                {compareList.length}
              </Title>
              <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                {t('my.inCompare', 'In Compare')}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              {increasedCount >= decreasedCount ? (
                <ArrowUpOutlined style={{ fontSize: isMobile ? 20 : 24, color: tokens.colors.error, marginBottom: 4 }} />
              ) : (
                <ArrowDownOutlined style={{ fontSize: isMobile ? 20 : 24, color: tokens.colors.success, marginBottom: 4 }} />
              )}
              <Title level={isMobile ? 4 : 3} style={{ marginBottom: 0 }}>
                {priceChanges.length}
              </Title>
              <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
                {t('my.priceChanges', 'Price Changes')}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Portfolio Summary - only if tracked vehicles have price changes */}
      {priceChanges.length > 0 && (
        <div style={{ marginBottom: tokens.spacing.xl }}>
          <PortfolioSummary priceChanges={priceChanges} />
        </div>
      )}

      {/* Top Movers - only if there are price changes */}
      {priceChanges.length > 0 && (
        <div style={{ marginBottom: tokens.spacing.xl }}>
          <TopMovers priceChanges={priceChanges} />
        </div>
      )}

      {/* Favorites & Tracked Widgets */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
        <Col xs={24} lg={12}>
          <FavoritesWidget />
        </Col>
        <Col xs={24} lg={12}>
          <TrackedWidget />
        </Col>
      </Row>
    </div>
  );
}
