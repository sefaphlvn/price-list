// Insights Page - Price Intelligence Module
// Shows deal scores, outliers, and price predictions

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Spin, Alert, Tabs, Card, Row, Col } from 'antd';
import {
  TrophyOutlined,
  FallOutlined,
  RiseOutlined,
  BulbOutlined,
} from '@ant-design/icons';

import { tokens } from '../theme/tokens';
import DealScoreList from '../components/insights/DealScoreList';
import TodaysDeals from '../components/insights/TodaysDeals';
import OverpricedSection from '../components/insights/OverpricedSection';

const { Title, Text } = Typography;

interface VehicleWithScore {
  id: string;
  brand: string;
  brandId: string;
  model: string;
  trim: string;
  engine: string;
  fuel: string;
  transmission: string;
  price: number;
  priceFormatted: string;
  dealScore: number;
  zScore: number;
  percentile: number;
  segmentAvg: number;
  isOutlier: boolean;
  outlierType: 'cheap' | 'expensive' | null;
}

interface InsightsData {
  generatedAt: string;
  date: string;
  topDeals: VehicleWithScore[];
  cheapOutliers: VehicleWithScore[];
  expensiveOutliers: VehicleWithScore[];
  allVehicles: VehicleWithScore[];
}

export default function InsightsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const response = await fetch('./data/insights/latest.json');
        if (!response.ok) {
          throw new Error('Failed to load insights data');
        }
        const data: InsightsData = await response.json();
        setInsights(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <Alert
          message={t('errors.fetchError')}
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'deals',
      label: (
        <span>
          <TrophyOutlined /> {t('insights.bestDeals', 'Best Deals')}
        </span>
      ),
      children: <DealScoreList vehicles={insights.topDeals} />,
    },
    {
      key: 'cheap',
      label: (
        <span>
          <FallOutlined /> {t('insights.todaysDeals', "Today's Deals")}
        </span>
      ),
      children: <TodaysDeals vehicles={insights.cheapOutliers} />,
    },
    {
      key: 'expensive',
      label: (
        <span>
          <RiseOutlined /> {t('insights.overpriced', 'Overpriced')}
        </span>
      ),
      children: <OverpricedSection vehicles={insights.expensiveOutliers} />,
    },
  ];

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      {/* Header */}
      <div style={{ marginBottom: tokens.spacing.xl }}>
        <Title level={2} style={{ marginBottom: tokens.spacing.xs }}>
          <BulbOutlined style={{ marginRight: tokens.spacing.sm }} />
          {t('insights.title', 'Price Intelligence')}
        </Title>
        <Text type="secondary">
          {t('insights.subtitle', 'AI-powered price analysis and deal recommendations')}
        </Text>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing.xl }}>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <TrophyOutlined
                style={{ fontSize: 32, color: tokens.colors.accent, marginBottom: 8 }}
              />
              <Title level={3} style={{ marginBottom: 0 }}>
                {insights.topDeals.length}
              </Title>
              <Text type="secondary">{t('insights.bestDeals', 'Best Deals')}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <FallOutlined
                style={{ fontSize: 32, color: tokens.colors.success, marginBottom: 8 }}
              />
              <Title level={3} style={{ marginBottom: 0 }}>
                {insights.cheapOutliers.length}
              </Title>
              <Text type="secondary">{t('insights.todaysDeals', "Today's Deals")}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <RiseOutlined
                style={{ fontSize: 32, color: tokens.colors.error, marginBottom: 8 }}
              />
              <Title level={3} style={{ marginBottom: 0 }}>
                {insights.expensiveOutliers.length}
              </Title>
              <Text type="secondary">{t('insights.overpriced', 'Overpriced')}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs items={tabItems} defaultActiveKey="deals" />
      </Card>

      {/* Data Info */}
      <div style={{ marginTop: tokens.spacing.lg, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('insights.dataDate', 'Data date')}: {insights.date} |{' '}
          {t('insights.totalAnalyzed', 'Total analyzed')}: {insights.allVehicles.length}{' '}
          {t('common.records', 'vehicles')}
        </Text>
      </div>
    </div>
  );
}
