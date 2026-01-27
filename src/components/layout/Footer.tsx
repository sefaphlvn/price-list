// Footer Component
import { useTranslation } from 'react-i18next';
import { Typography, Space } from 'antd';
import { GithubOutlined } from '@ant-design/icons';

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
          gap: tokens.spacing.md,
          textAlign: 'center',
        }}
      >
        <Text type="secondary" style={{ fontSize: 13 }}>
          {t('footer.dataSource')}
        </Text>

        <Space split={<span style={{ color: tokens.colors.gray[300] }}>|</span>}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            © {currentYear} Price List
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('footer.copyright')}
          </Text>
          <Link
            href="https://github.com"
            target="_blank"
            style={{ color: tokens.colors.gray[500], fontSize: 12 }}
          >
            <GithubOutlined style={{ marginRight: 4 }} />
            GitHub
          </Link>
        </Space>
      </div>
    </footer>
  );
}
