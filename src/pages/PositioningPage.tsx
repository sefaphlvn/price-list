// Positioning Page - Similarity matching, price percentile, and price bands
import { useTranslation } from 'react-i18next';
import { Typography, Card, Row, Col, Empty, Input, Select } from 'antd';
import { RadarChartOutlined, SearchOutlined } from '@ant-design/icons';

import { tokens } from '../theme/tokens';

const { Title, Paragraph } = Typography;
const { Search } = Input;

export default function PositioningPage() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <RadarChartOutlined style={{ color: tokens.colors.primary }} />
          {t('positioning.title', 'Fiyat Konumlandirma')}
        </Title>
        <Paragraph type="secondary" style={{ marginTop: tokens.spacing.xs }}>
          {t('positioning.subtitle', 'Aracin segment icindeki pozisyonunu gorun')}
        </Paragraph>
      </div>

      <Card style={{ marginBottom: tokens.spacing.lg }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Search
              placeholder={t('positioning.searchVehicle', 'Arac ara...')}
              prefix={<SearchOutlined />}
              size="large"
              allowClear
            />
          </Col>
          <Col xs={24} md={12}>
            <Select
              style={{ width: '100%' }}
              size="large"
              placeholder={t('positioning.selectVehicle', 'Arac secin')}
              showSearch
              options={[]}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('positioning.similarVehicles', 'Benzer Araclar')}>
            <Empty
              description={t('positioning.selectFirst', 'Analiz icin bir arac secin')}
              style={{ padding: tokens.spacing.xl }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('positioning.pricePercentile', 'Fiyat Yuzdeligi')}>
            <Empty
              description={t('positioning.selectFirst', 'Analiz icin bir arac secin')}
              style={{ padding: tokens.spacing.xl }}
            />
          </Card>
        </Col>
        <Col xs={24}>
          <Card title={t('positioning.priceBands', 'Fiyat Bantlari')}>
            <Empty
              description={t('positioning.selectFirst', 'Analiz icin bir arac secin')}
              style={{ padding: tokens.spacing.xl }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
