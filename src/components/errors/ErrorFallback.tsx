// Error Fallback Component
// Displayed when an error is caught by ErrorBoundary

import { useTranslation } from 'react-i18next';
import { Result, Button, Typography, Space } from 'antd';
import { ReloadOutlined, HomeOutlined, BugOutlined } from '@ant-design/icons';

import { tokens } from '../../theme/tokens';

const { Text, Paragraph } = Typography;

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
}

export default function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const { t } = useTranslation();

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing.lg,
        background: tokens.colors.background,
      }}
    >
      <Result
        status="error"
        title={t('errors.unexpectedError', 'Something went wrong')}
        subTitle={t('errors.errorDescription', 'An unexpected error occurred. Please try refreshing the page.')}
        extra={
          <Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 400 }}>
            <Space>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={onReset || handleReload}
              >
                {t('common.refresh', 'Refresh')}
              </Button>
              <Button icon={<HomeOutlined />} onClick={handleGoHome}>
                {t('nav.home', 'Home')}
              </Button>
            </Space>

            {error && process.env.NODE_ENV === 'development' && (
              <div
                style={{
                  background: tokens.colors.gray[100],
                  padding: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.md,
                  textAlign: 'left',
                }}
              >
                <Space align="start" style={{ marginBottom: tokens.spacing.sm }}>
                  <BugOutlined style={{ color: tokens.colors.error }} />
                  <Text strong type="danger">{error.name}</Text>
                </Space>
                <Paragraph
                  type="secondary"
                  style={{ marginBottom: 0, fontSize: 12, fontFamily: 'monospace' }}
                >
                  {error.message}
                </Paragraph>
              </div>
            )}
          </Space>
        }
      />
    </div>
  );
}
