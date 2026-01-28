// Home Page - Landing page with hero, stats, and brand cards
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Row, Col, Typography, Button, Card, Statistic, Space } from 'antd';
import {
  RightOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  CompressOutlined,
} from '@ant-design/icons';

import { BRANDS } from '../config/brands';
import { tokens } from '../theme/tokens';
import { staggerContainer, staggerItem, scaleVariants, cardHoverVariants } from '../theme/animations';

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

  // Fetch quick stats from index
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('./data/index.json');
        if (response.ok) {
          const data = await response.json();
          let total = 0;
          Object.values(data.brands).forEach((brand: any) => {
            total += brand.totalRecords || 0;
          });
          setStats((prev) => ({
            ...prev,
            totalVehicles: total || 250,
            lowestPrice: 800000,
            highestPrice: 8500000,
          }));
        }
      } catch {
        // Use default stats
        setStats({
          totalVehicles: 250,
          lowestPrice: 800000,
          highestPrice: 8500000,
          brandsUpdated: BRANDS.length,
        });
      }
    };
    loadStats();
  }, []);

  const features = [
    {
      icon: <ThunderboltOutlined style={{ fontSize: 32, color: tokens.colors.accent }} />,
      title: t('home.features.dailyUpdate.title'),
      description: t('home.features.dailyUpdate.description'),
    },
    {
      icon: <LineChartOutlined style={{ fontSize: 32, color: tokens.colors.accent }} />,
      title: t('home.features.priceTracking.title'),
      description: t('home.features.priceTracking.description'),
    },
    {
      icon: <CompressOutlined style={{ fontSize: 32, color: tokens.colors.accent }} />,
      title: t('home.features.comparison.title'),
      description: t('home.features.comparison.description'),
    },
  ];

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="enter">
      {/* Hero Section */}
      <motion.section
        variants={staggerItem}
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: `${tokens.spacing['2xl']} ${tokens.spacing.lg}`,
          background: tokens.colors.background,
        }}
      >
        {/* Hero Image */}
        <motion.div
          variants={scaleVariants}
          style={{
            width: '100%',
            maxWidth: 1200,
            marginBottom: tokens.spacing.xl,
          }}
        >
          <img
            src="/hero.webp"
            alt="Futuristic Cars"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '400px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1))',
            }}
          />
        </motion.div>

        <div style={{ maxWidth: 800 }}>
          <Title
            level={1}
            style={{
              fontSize: 'clamp(28px, 5vw, 52px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: tokens.spacing.md,
              color: tokens.colors.primary,
            }}
          >
            {t('home.title')}
          </Title>

          <Paragraph
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: tokens.colors.gray[500],
              marginBottom: tokens.spacing.xl,
              maxWidth: 600,
              margin: '0 auto',
            }}
          >
            {t('home.subtitle')}
          </Paragraph>

          <Space size="middle" wrap style={{ marginTop: tokens.spacing.lg }}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="primary"
                size="large"
                icon={<RightOutlined />}
                onClick={() => navigate('/fiyat-listesi')}
                style={{
                  height: 56,
                  paddingLeft: 32,
                  paddingRight: 32,
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: tokens.borderRadius.lg,
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
                style={{
                  height: 56,
                  paddingLeft: 32,
                  paddingRight: 32,
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: tokens.borderRadius.lg,
                  borderColor: tokens.colors.gray[300],
                }}
              >
                {t('home.cta.compare')}
              </Button>
            </motion.div>
          </Space>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        variants={staggerItem}
        style={{
          padding: `${tokens.spacing['2xl']} ${tokens.spacing.lg}`,
          background: tokens.colors.background,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[24, 24]}>
            <Col xs={12} sm={6}>
              <motion.div variants={scaleVariants}>
                <Card
                  bordered={false}
                  style={{
                    textAlign: 'center',
                    background: tokens.colors.surface,
                    borderRadius: tokens.borderRadius.lg,
                  }}
                >
                  <Statistic
                    title={t('home.stats.totalVehicles')}
                    value={stats.totalVehicles}
                    suffix="+"
                    valueStyle={{ color: tokens.colors.accent, fontWeight: 700 }}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col xs={12} sm={6}>
              <motion.div variants={scaleVariants}>
                <Card
                  bordered={false}
                  style={{
                    textAlign: 'center',
                    background: tokens.colors.surface,
                    borderRadius: tokens.borderRadius.lg,
                  }}
                >
                  <Statistic
                    title={t('home.stats.lowestPrice')}
                    value={stats.lowestPrice}
                    suffix=" TL"
                    valueStyle={{ color: tokens.colors.success, fontWeight: 700 }}
                    formatter={(value) =>
                      new Intl.NumberFormat('tr-TR').format(value as number)
                    }
                  />
                </Card>
              </motion.div>
            </Col>
            <Col xs={12} sm={6}>
              <motion.div variants={scaleVariants}>
                <Card
                  bordered={false}
                  style={{
                    textAlign: 'center',
                    background: tokens.colors.surface,
                    borderRadius: tokens.borderRadius.lg,
                  }}
                >
                  <Statistic
                    title={t('home.stats.highestPrice')}
                    value={stats.highestPrice}
                    suffix=" TL"
                    valueStyle={{ color: tokens.colors.warning, fontWeight: 700 }}
                    formatter={(value) =>
                      new Intl.NumberFormat('tr-TR').format(value as number)
                    }
                  />
                </Card>
              </motion.div>
            </Col>
            <Col xs={12} sm={6}>
              <motion.div variants={scaleVariants}>
                <Card
                  bordered={false}
                  style={{
                    textAlign: 'center',
                    background: tokens.colors.surface,
                    borderRadius: tokens.borderRadius.lg,
                  }}
                >
                  <Statistic
                    title={t('home.stats.brandsUpdated')}
                    value={stats.brandsUpdated}
                    valueStyle={{ color: tokens.colors.accent, fontWeight: 700 }}
                  />
                </Card>
              </motion.div>
            </Col>
          </Row>
        </div>
      </motion.section>

      {/* Brands Section */}
      <motion.section
        variants={staggerItem}
        style={{
          padding: `${tokens.spacing['3xl']} ${tokens.spacing.lg}`,
          background: tokens.colors.surface,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title
            level={2}
            style={{
              textAlign: 'center',
              marginBottom: tokens.spacing['2xl'],
              fontWeight: 600,
            }}
          >
            {t('home.brands.title')}
          </Title>

          <Row gutter={[24, 24]} justify="center">
            {BRANDS.map((brand) => (
              <Col xs={12} sm={8} md={4} key={brand.id}>
                <motion.div
                  variants={cardHoverVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Card
                    hoverable
                    onClick={() => navigate(`/fiyat-listesi?brand=${brand.id}`)}
                    style={{
                      textAlign: 'center',
                      borderRadius: tokens.borderRadius.lg,
                      border: `1px solid ${tokens.colors.gray[200]}`,
                      cursor: 'pointer',
                    }}
                    styles={{
                      body: { padding: tokens.spacing.lg },
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: tokens.colors.gray[100],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        marginBottom: tokens.spacing.md,
                        fontSize: 20,
                        fontWeight: 700,
                        color: tokens.colors.gray[700],
                      }}
                    >
                      {brandIcons[brand.id] || brand.name.slice(0, 2).toUpperCase()}
                    </div>
                    <Text strong>{brand.name}</Text>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        variants={staggerItem}
        style={{
          padding: `${tokens.spacing['3xl']} ${tokens.spacing.lg}`,
          background: tokens.colors.background,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title
            level={2}
            style={{
              textAlign: 'center',
              marginBottom: tokens.spacing['2xl'],
              fontWeight: 600,
            }}
          >
            {t('home.features.title')}
          </Title>

          <Row gutter={[48, 48]}>
            {features.map((feature, index) => (
              <Col xs={24} md={8} key={index}>
                <motion.div variants={staggerItem}>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: tokens.borderRadius.lg,
                        background: tokens.colors.accentLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        marginBottom: tokens.spacing.lg,
                      }}
                    >
                      {feature.icon}
                    </div>
                    <Title level={4} style={{ marginBottom: tokens.spacing.sm }}>
                      {feature.title}
                    </Title>
                    <Text type="secondary">{feature.description}</Text>
                  </div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>
      </motion.section>
    </motion.div>
  );
}
