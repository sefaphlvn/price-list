// FAQ Page - Frequently Asked Questions
import { useTranslation } from 'react-i18next';
import { Typography, Collapse, Card, Space } from 'antd';
import { QuestionCircleOutlined, MailOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

import { tokens } from '../theme/tokens';
import { staggerContainer, staggerItem } from '../theme/animations';

const { Title, Text, Paragraph, Link } = Typography;

export default function FAQPage() {
  const { t } = useTranslation();

  const faqItems = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
  ];

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="enter">
      {/* Header Section */}
      <motion.section
        variants={staggerItem}
        style={{
          padding: `${tokens.spacing['2xl']} ${tokens.spacing.lg}`,
          background: `linear-gradient(135deg, ${tokens.colors.primary} 0%, #1e3a5f 100%)`,
          color: '#fff',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <QuestionCircleOutlined style={{ fontSize: 48, marginBottom: tokens.spacing.md, opacity: 0.8 }} />
          <Title
            level={1}
            style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 700,
              marginBottom: tokens.spacing.sm,
              color: '#fff',
            }}
          >
            {t('faq.title')}
          </Title>
          <Paragraph style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 0 }}>
            {t('disclaimer.footerTitle')} {t('disclaimer.footerDesc')}
          </Paragraph>
        </div>
      </motion.section>

      {/* FAQ Content */}
      <motion.section
        variants={staggerItem}
        style={{
          padding: `${tokens.spacing.xl} ${tokens.spacing.lg}`,
          background: tokens.colors.background,
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Collapse
            accordion
            size="large"
            expandIconPosition="end"
            style={{
              background: 'transparent',
              border: 'none',
            }}
            items={faqItems.map((item, index) => ({
              key: String(index),
              label: (
                <Text strong style={{ fontSize: 15 }}>
                  {item.q}
                </Text>
              ),
              children: (
                <Paragraph style={{ fontSize: 14, color: tokens.colors.gray[600], marginBottom: 0, lineHeight: 1.7 }}>
                  {item.a}
                </Paragraph>
              ),
              style: {
                marginBottom: tokens.spacing.sm,
                background: tokens.colors.surface,
                borderRadius: tokens.borderRadius.md,
                border: `1px solid ${tokens.colors.gray[200]}`,
                overflow: 'hidden',
              },
            }))}
          />

          {/* Contact Card */}
          <Card
            style={{
              marginTop: tokens.spacing.xl,
              borderRadius: tokens.borderRadius.md,
              border: `1px solid ${tokens.colors.gray[200]}`,
            }}
          >
            <Space direction="vertical" size="small">
              <Text strong style={{ fontSize: 15 }}>
                {t('disclaimer.contact')}
              </Text>
              <Paragraph style={{ fontSize: 13, color: tokens.colors.gray[600], marginBottom: tokens.spacing.sm }}>
                {t('disclaimer.nonBindingNote')}
              </Paragraph>
              <Link href="mailto:destek@otofiyatlist.com" style={{ fontSize: 14 }}>
                <MailOutlined style={{ marginRight: 6 }} />
                destek@otofiyatlist.com
              </Link>
            </Space>
          </Card>

          {/* Footer Disclaimer */}
          <div
            style={{
              marginTop: tokens.spacing.xl,
              padding: tokens.spacing.md,
              background: tokens.colors.gray[50],
              borderRadius: tokens.borderRadius.md,
              borderLeft: `3px solid ${tokens.colors.gray[300]}`,
            }}
          >
            <Text style={{ fontSize: 11, color: tokens.colors.gray[500], lineHeight: 1.6 }}>
              {t('disclaimer.footerPrices')} <strong>{t('disclaimer.footerNonBinding')}</strong> {t('disclaimer.footerContact')}
            </Text>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
