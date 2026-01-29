// Home Page - Modern compact landing page
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Row, Col, Typography, Button, Card, Space, Tag } from 'antd';
import {
  RightOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  CompressOutlined,
  CarOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import { BRANDS } from '../config/brands';
import { tokens } from '../theme/tokens';
import { staggerContainer, staggerItem, cardHoverVariants } from '../theme/animations';

const { Title, Text, Paragraph } = Typography;

// Brand logos/icons mapping
const brandIcons: { [key: string]: string } = {
  volkswagen: 'VW',
  skoda: 'ŠK',
  renault: 'RN',
  toyota: 'TY',
  hyundai: 'HY',
  fiat: 'FT',
  peugeot: 'PG',
  byd: 'BYD',
  opel: 'OP',
  citroen: 'CT',
  bmw: 'BMW',
  mercedes: 'MB',
  ford: 'FD',
  dacia: 'DC',
  nissan: 'NS',
  honda: 'HN',
  seat: 'ST',
  kia: 'KIA',
  volvo: 'VLV',
};

// Brand colors
const brandColors: { [key: string]: string } = {
  volkswagen: '#001e50',
  skoda: '#4ba82e',
  renault: '#ffcc00',
  toyota: '#eb0a1e',
  hyundai: '#002c5f',
  fiat: '#8b0000',
  peugeot: '#1a1a1a',
  byd: '#c41230',
  opel: '#f7ff14', // Opel yellow
  citroen: '#ac0f21', // Citroën red
  bmw: '#0066b1', // BMW blue
  mercedes: '#00172e', // Mercedes dark
  ford: '#003478', // Ford blue
  dacia: '#646b52', // Dacia khaki green
  nissan: '#c3002f', // Nissan red
  honda: '#cc0000', // Honda red
  seat: '#ed6a32', // SEAT orange/copper
  kia: '#05141f', // Kia dark blue/black
  volvo: '#003057', // Volvo navy blue
};

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVehicles: 0,
    lowestPrice: 0,
    highestPrice: 0,
    brandsUpdated: BRANDS.length,
  });

  // Fetch quick stats from precomputed stats
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadStats = async () => {
      try {
        const response = await fetch('./data/stats/precomputed.json', { signal });
        if (response.ok) {
          const data = await response.json();
          if (!signal.aborted) {
            setStats({
              totalVehicles: data.totalVehicles || 250,
              lowestPrice: data.overallStats?.minPrice || 800000,
              highestPrice: data.overallStats?.maxPrice || 8500000,
              brandsUpdated: BRANDS.length,
            });
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        // Fallback to index.json if precomputed stats not available
        try {
          const indexResponse = await fetch('./data/index.json', { signal });
          if (indexResponse.ok) {
            const indexData = await indexResponse.json();
            let total = 0;
            Object.values(indexData.brands).forEach((brand: any) => {
              total += brand.totalRecords || 0;
            });
            if (!signal.aborted) {
              setStats((prev) => ({
                ...prev,
                totalVehicles: total || 250,
              }));
            }
          }
        } catch {
          // Use default values
        }
      }
    };
    loadStats();

    return () => controller.abort();
  }, []);

  const features = [
    {
      icon: <ThunderboltOutlined style={{ fontSize: 24, color: tokens.colors.primary }} />,
      title: t('home.features.dailyUpdate.title'),
      description: t('home.features.dailyUpdate.description'),
    },
    {
      icon: <LineChartOutlined style={{ fontSize: 24, color: tokens.colors.primary }} />,
      title: t('home.features.priceTracking.title'),
      description: t('home.features.priceTracking.description'),
    },
    {
      icon: <CompressOutlined style={{ fontSize: 24, color: tokens.colors.primary }} />,
      title: t('home.features.comparison.title'),
      description: t('home.features.comparison.description'),
    },
  ];

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="enter">
      {/* Compact Header Section */}
      <motion.section
        variants={staggerItem}
        style={{
          padding: `${tokens.spacing['2xl']} ${tokens.spacing.lg}`,
          background: `linear-gradient(135deg, ${tokens.colors.primary} 0%, #1e3a5f 100%)`,
          color: '#fff',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[48, 24]} align="middle">
            <Col xs={24} lg={14}>
              <Tag
                color="rgba(255,255,255,0.2)"
                style={{
                  marginBottom: tokens.spacing.md,
                  border: 'none',
                  color: '#fff',
                  fontSize: 12,
                }}
              >
                <CarOutlined style={{ marginRight: 4 }} />
                {stats.brandsUpdated} {t('home.stats.brandsUpdated')}
              </Tag>

              <Title
                level={1}
                style={{
                  fontSize: 'clamp(28px, 4vw, 42px)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  marginBottom: tokens.spacing.sm,
                  color: '#fff',
                }}
              >
                {t('home.title')}
              </Title>

              <Paragraph
                style={{
                  fontSize: 'clamp(14px, 1.5vw, 18px)',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: tokens.spacing.lg,
                  maxWidth: 500,
                }}
              >
                {t('home.subtitle', { count: BRANDS.length })}
              </Paragraph>

              <Space size="middle" wrap>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SearchOutlined />}
                    onClick={() => navigate('/fiyat-listesi')}
                    style={{
                      height: 48,
                      paddingLeft: 24,
                      paddingRight: 24,
                      fontSize: 15,
                      fontWeight: 600,
                      borderRadius: tokens.borderRadius.md,
                      background: '#fff',
                      color: tokens.colors.primary,
                      border: 'none',
                    }}
                  >
                    {t('home.cta.viewPrices')}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="large"
                    icon={<SwapOutlined />}
                    onClick={() => navigate('/karsilastirma')}
                    ghost
                    style={{
                      height: 48,
                      paddingLeft: 24,
                      paddingRight: 24,
                      fontSize: 15,
                      fontWeight: 600,
                      borderRadius: tokens.borderRadius.md,
                      borderColor: 'rgba(255,255,255,0.4)',
                      color: '#fff',
                    }}
                  >
                    {t('home.cta.compare')}
                  </Button>
                </motion.div>
              </Space>
            </Col>

            {/* Stats in Header */}
            <Col xs={24} lg={10}>
              <Row gutter={[12, 12]}>
                {[
                  { label: t('home.stats.totalVehicles'), value: `${stats.totalVehicles}+`, color: '#fff' },
                  { label: t('home.stats.lowestPrice'), value: `${new Intl.NumberFormat('tr-TR').format(stats.lowestPrice)} ₺`, color: '#4ade80' },
                  { label: t('home.stats.highestPrice'), value: `${new Intl.NumberFormat('tr-TR').format(stats.highestPrice)} ₺`, color: '#fbbf24' },
                  { label: t('home.stats.brandsUpdated'), value: stats.brandsUpdated, color: '#fff' },
                ].map((stat, index) => (
                  <Col span={12} key={index}>
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: tokens.borderRadius.md,
                        padding: tokens.spacing.md,
                        backdropFilter: 'blur(10px)',
                        height: 80,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, display: 'block' }}>
                        {stat.label}
                      </Text>
                      <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, marginTop: 4 }}>
                        {stat.value}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </div>
      </motion.section>

      {/* Brands Section - Horizontal Scroll on Mobile */}
      <motion.section
        variants={staggerItem}
        style={{
          padding: `${tokens.spacing.xl} ${tokens.spacing.lg}`,
          background: tokens.colors.surface,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.lg }}>
            <Title level={4} style={{ margin: 0 }}>
              {t('home.brands.title')}
            </Title>
            <Button
              type="link"
              onClick={() => navigate('/fiyat-listesi')}
              style={{ padding: 0 }}
            >
              {t('common.viewAll')} <RightOutlined />
            </Button>
          </div>

          <Row gutter={[16, 16]} justify="start">
            {[...BRANDS].sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((brand) => (
              <Col xs={8} sm={6} md={4} lg={3} key={brand.id}>
                <motion.div
                  variants={cardHoverVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Card
                    hoverable
                    onClick={() => navigate(`/fiyat-listesi?b=${brand.id}`)}
                    style={{
                      textAlign: 'center',
                      borderRadius: tokens.borderRadius.md,
                      border: `1px solid ${tokens.colors.gray[200]}`,
                      cursor: 'pointer',
                    }}
                    styles={{
                      body: { padding: tokens.spacing.md },
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: brandColors[brand.id] || tokens.colors.gray[200],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        marginBottom: tokens.spacing.sm,
                        fontSize: 14,
                        fontWeight: 700,
                        color: brand.id === 'renault' || brand.id === 'opel' ? '#000' : '#fff',
                      }}
                    >
                      {brandIcons[brand.id] || brand.name.slice(0, 2).toUpperCase()}
                    </div>
                    <Text strong style={{ fontSize: 13 }}>{brand.name}</Text>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </motion.section>

      {/* Features Section - Compact Cards */}
      <motion.section
        variants={staggerItem}
        style={{
          padding: `${tokens.spacing.xl} ${tokens.spacing.lg}`,
          background: tokens.colors.background,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={4} style={{ marginBottom: tokens.spacing.lg }}>
            {t('home.features.title')}
          </Title>

          <Row gutter={[16, 16]}>
            {features.map((feature, index) => (
              <Col xs={24} md={8} key={index}>
                <motion.div variants={staggerItem}>
                  <Card
                    style={{
                      borderRadius: tokens.borderRadius.md,
                      border: `1px solid ${tokens.colors.gray[200]}`,
                      height: '100%',
                    }}
                    styles={{
                      body: { padding: tokens.spacing.lg },
                    }}
                  >
                    <Space align="start" size="middle">
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: tokens.borderRadius.md,
                          background: tokens.colors.accentLight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {feature.icon}
                      </div>
                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>
                          {feature.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {feature.description}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </motion.section>

      {/* Quick Actions */}
      <motion.section
        variants={staggerItem}
        style={{
          padding: `${tokens.spacing.xl} ${tokens.spacing.lg}`,
          background: tokens.colors.surface,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card
                hoverable
                onClick={() => navigate('/istatistikler')}
                style={{
                  borderRadius: tokens.borderRadius.md,
                  background: `linear-gradient(135deg, ${tokens.colors.primary} 0%, #1e3a5f 100%)`,
                  border: 'none',
                  cursor: 'pointer',
                }}
                styles={{
                  body: { padding: tokens.spacing.lg },
                }}
              >
                <Space>
                  <LineChartOutlined style={{ fontSize: 24, color: '#fff' }} />
                  <div>
                    <Text strong style={{ color: '#fff', display: 'block' }}>
                      {t('nav.statistics')}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                      {t('statistics.subtitle')}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                hoverable
                onClick={() => navigate('/analizler')}
                style={{
                  borderRadius: tokens.borderRadius.md,
                  background: `linear-gradient(135deg, ${tokens.colors.success} 0%, #15803d 100%)`,
                  border: 'none',
                  cursor: 'pointer',
                }}
                styles={{
                  body: { padding: tokens.spacing.lg },
                }}
              >
                <Space>
                  <ThunderboltOutlined style={{ fontSize: 24, color: '#fff' }} />
                  <div>
                    <Text strong style={{ color: '#fff', display: 'block' }}>
                      {t('nav.insights')}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                      {t('insights.subtitle')}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                hoverable
                onClick={() => navigate('/benim')}
                style={{
                  borderRadius: tokens.borderRadius.md,
                  background: `linear-gradient(135deg, ${tokens.colors.accent} 0%, #7c3aed 100%)`,
                  border: 'none',
                  cursor: 'pointer',
                }}
                styles={{
                  body: { padding: tokens.spacing.lg },
                }}
              >
                <Space>
                  <CarOutlined style={{ fontSize: 24, color: '#fff' }} />
                  <div>
                    <Text strong style={{ color: '#fff', display: 'block' }}>
                      {t('nav.my')}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                      {t('my.subtitle')}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </motion.section>
    </motion.div>
  );
}
