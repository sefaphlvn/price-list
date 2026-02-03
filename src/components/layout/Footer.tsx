// Footer Component
import { useTranslation } from 'react-i18next';
import { Typography, Space, Divider } from 'antd';
import { MailOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Link as RouterLink } from 'react-router-dom';

import { tokens } from '../../theme/tokens';

const { Text, Link } = Typography;

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: tokens.colors.surface,
        borderTop: `1px solid ${tokens.colors.gray[200]}`,
        padding: `${tokens.spacing.xl} ${tokens.spacing.lg}`,
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: tokens.spacing.lg,
          textAlign: 'center',
        }}
      >
        {/* Disclaimer Section */}
        <div
          style={{
            maxWidth: 800,
            padding: tokens.spacing.md,
            background: tokens.colors.gray[50],
            borderRadius: tokens.borderRadius.md,
            borderLeft: `3px solid ${tokens.colors.gray[300]}`,
          }}
        >
          <Text style={{ fontSize: 12, color: tokens.colors.gray[600], lineHeight: 1.6 }}>
            <strong>{t('disclaimer.footerTitle')}</strong> {t('disclaimer.footerDesc')}
          </Text>
          <br />
          <Text style={{ fontSize: 11, color: tokens.colors.gray[500], lineHeight: 1.5 }}>
            {t('disclaimer.footerPrices')} <strong>{t('disclaimer.footerNonBinding')}</strong> {t('disclaimer.footerContact')}
          </Text>
        </div>

        <Divider style={{ margin: `${tokens.spacing.sm} 0`, borderColor: tokens.colors.gray[200] }} />

        {/* Links Row */}
        <Space size="large" wrap style={{ justifyContent: 'center' }}>
          <RouterLink to="/sss" style={{ color: tokens.colors.gray[600], fontSize: 12, textDecoration: 'none' }}>
            <QuestionCircleOutlined style={{ marginRight: 4 }} />
            {t('faq.title')}
          </RouterLink>
          <Link
            href="mailto:otofiyatlist@gmail.com"
            style={{ color: tokens.colors.gray[600], fontSize: 12 }}
          >
            <MailOutlined style={{ marginRight: 4 }} />
            otofiyatlist@gmail.com
          </Link>

        </Space>

        {/* Copyright Row */}
        <Space split={<span style={{ color: tokens.colors.gray[300] }}>|</span>}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            © {currentYear} OtoFiyatList
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {t('footer.copyright')}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {t('disclaimer.updateFrequency')}
          </Text>
        </Space>
      </div>
    </footer>
  );
}
