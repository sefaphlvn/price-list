// Brand Disclaimer Component
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Collapse, Tooltip, Space } from 'antd';
import { InfoCircleOutlined, DownOutlined } from '@ant-design/icons';

import { tokens } from '../../theme/tokens';

const { Text, Paragraph } = Typography;

interface BrandDisclaimerProps {
  brandName: string;
  lastUpdated?: string;
  variant?: 'compact' | 'expanded' | 'tooltip';
}

export default function BrandDisclaimer({ brandName, lastUpdated, variant = 'compact' }: BrandDisclaimerProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // Tooltip variant - just an info icon
  if (variant === 'tooltip') {
    return (
      <Tooltip
        title={t('disclaimer.tooltip', { brand: brandName })}
        placement="top"
        overlayStyle={{ maxWidth: 280 }}
      >
        <InfoCircleOutlined style={{ color: tokens.colors.gray[400], cursor: 'help', marginLeft: 4 }} />
      </Tooltip>
    );
  }

  // Compact variant - single paragraph
  if (variant === 'compact') {
    return (
      <div
        style={{
          background: tokens.colors.gray[50],
          borderLeft: `3px solid ${tokens.colors.gray[300]}`,
          padding: tokens.spacing.md,
          borderRadius: tokens.borderRadius.sm,
          marginBottom: tokens.spacing.md,
        }}
      >
        <Text style={{ fontSize: 12, color: tokens.colors.gray[600], lineHeight: 1.6 }}>
          <InfoCircleOutlined style={{ marginRight: 6 }} />
          {t('disclaimer.brandCompact', { brand: brandName })}
          {lastUpdated && (
            <span style={{ marginLeft: 8, color: tokens.colors.gray[500] }}>
              ({t('disclaimer.lastUpdated')}: {lastUpdated})
            </span>
          )}
        </Text>
      </div>
    );
  }

  // Expanded variant - collapsible with details
  return (
    <div
      style={{
        background: tokens.colors.gray[50],
        borderLeft: `3px solid ${tokens.colors.gray[300]}`,
        borderRadius: tokens.borderRadius.md,
        marginBottom: tokens.spacing.md,
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: tokens.spacing.md,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space>
          <InfoCircleOutlined style={{ color: tokens.colors.gray[500] }} />
          <Text strong style={{ fontSize: 13, color: tokens.colors.gray[700] }}>
            {t('disclaimer.brandTitle', { brand: brandName })}
          </Text>
        </Space>
        <DownOutlined
          style={{
            color: tokens.colors.gray[400],
            fontSize: 12,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </div>

      <Collapse
        activeKey={expanded ? ['1'] : []}
        ghost
        items={[
          {
            key: '1',
            showArrow: false,
            children: (
              <div style={{ padding: `0 ${tokens.spacing.md} ${tokens.spacing.md}` }}>
                <Paragraph style={{ fontSize: 12, color: tokens.colors.gray[600], marginBottom: tokens.spacing.sm }}>
                  {t('disclaimer.brandDesc', { brand: brandName })}
                </Paragraph>

                <Text strong style={{ fontSize: 12, color: tokens.colors.gray[700], display: 'block', marginBottom: 8 }}>
                  {t('disclaimer.factorsTitle')}
                </Text>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: tokens.colors.gray[600] }}>
                  <li>{t('disclaimer.factor1')}</li>
                  <li>{t('disclaimer.factor2')}</li>
                  <li>{t('disclaimer.factor3')}</li>
                  <li>{t('disclaimer.factor4')}</li>
                  <li>{t('disclaimer.factor5')}</li>
                </ul>

                <div style={{ marginTop: tokens.spacing.md, paddingTop: tokens.spacing.sm, borderTop: `1px solid ${tokens.colors.gray[200]}` }}>
                  <Text style={{ fontSize: 11, color: tokens.colors.gray[500] }}>
                    <strong>{t('disclaimer.source')}:</strong> {brandName} {t('disclaimer.officialWebsite')}
                    {lastUpdated && (
                      <>
                        {' | '}
                        <strong>{t('disclaimer.lastUpdated')}:</strong> {lastUpdated}
                      </>
                    )}
                  </Text>
                </div>

                <Paragraph style={{ fontSize: 11, color: tokens.colors.gray[500], marginTop: tokens.spacing.sm, marginBottom: 0 }}>
                  {t('disclaimer.nonBindingNote')}
                </Paragraph>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
