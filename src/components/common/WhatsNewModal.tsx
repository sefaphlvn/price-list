// What's New Modal Component
// Shows changelog when new version is detected

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Typography, List, Tag, Space, Button, Divider } from 'antd';
import {
  GiftOutlined,
  RocketOutlined,
  BugOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

import { tokens } from '../../theme/tokens';
import { changelog, latestVersion, ChangelogEntry } from '../../data/changelog';

const { Title, Text, Paragraph } = Typography;

const LAST_SEEN_VERSION_KEY = 'otofiyatlist-last-seen-version';

export default function WhatsNewModal() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [unseenEntries, setUnseenEntries] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);

    if (!lastSeenVersion) {
      // First time user, show modal with latest entry only
      setUnseenEntries(changelog.slice(0, 1));
      setIsOpen(true);
    } else if (lastSeenVersion !== latestVersion) {
      // Find all entries since last seen version
      const lastSeenIndex = changelog.findIndex((entry) => entry.version === lastSeenVersion);
      if (lastSeenIndex > 0) {
        setUnseenEntries(changelog.slice(0, lastSeenIndex));
        setIsOpen(true);
      } else if (lastSeenIndex === -1) {
        // Version not found, show latest
        setUnseenEntries(changelog.slice(0, 1));
        setIsOpen(true);
      }
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, latestVersion);
    setIsOpen(false);
  };

  if (unseenEntries.length === 0) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      footer={
        <Button type="primary" onClick={handleClose}>
          {t('whatsNew.gotIt', 'Got it!')}
        </Button>
      }
      width={600}
      centered
      title={
        <Space>
          <GiftOutlined style={{ color: tokens.colors.accent }} />
          <span>{t('whatsNew.title', "What's New")}</span>
        </Space>
      }
    >
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {unseenEntries.map((entry, index) => (
          <div key={entry.version}>
            {index > 0 && <Divider />}

            <div style={{ marginBottom: tokens.spacing.md }}>
              <Space>
                <Tag color="blue">v{entry.version}</Tag>
                <Text type="secondary">{entry.date}</Text>
              </Space>
              <Title level={4} style={{ marginTop: tokens.spacing.xs, marginBottom: tokens.spacing.xs }}>
                {entry.title}
              </Title>
              <Paragraph type="secondary">{entry.description}</Paragraph>
            </div>

            {/* Features */}
            {entry.features && entry.features.length > 0 && (
              <div style={{ marginBottom: tokens.spacing.md }}>
                <Space style={{ marginBottom: tokens.spacing.xs }}>
                  <RocketOutlined style={{ color: tokens.colors.success }} />
                  <Text strong>{t('whatsNew.features', 'New Features')}</Text>
                </Space>
                <List
                  size="small"
                  dataSource={entry.features}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '4px 0', border: 'none' }}>
                      <Space>
                        <CheckCircleOutlined style={{ color: tokens.colors.success, fontSize: 12 }} />
                        <Text>{item}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Improvements */}
            {entry.improvements && entry.improvements.length > 0 && (
              <div style={{ marginBottom: tokens.spacing.md }}>
                <Space style={{ marginBottom: tokens.spacing.xs }}>
                  <RocketOutlined style={{ color: tokens.colors.primary }} />
                  <Text strong>{t('whatsNew.improvements', 'Improvements')}</Text>
                </Space>
                <List
                  size="small"
                  dataSource={entry.improvements}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '4px 0', border: 'none' }}>
                      <Space>
                        <CheckCircleOutlined style={{ color: tokens.colors.primary, fontSize: 12 }} />
                        <Text>{item}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Fixes */}
            {entry.fixes && entry.fixes.length > 0 && (
              <div>
                <Space style={{ marginBottom: tokens.spacing.xs }}>
                  <BugOutlined style={{ color: tokens.colors.warning }} />
                  <Text strong>{t('whatsNew.fixes', 'Bug Fixes')}</Text>
                </Space>
                <List
                  size="small"
                  dataSource={entry.fixes}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '4px 0', border: 'none' }}>
                      <Space>
                        <CheckCircleOutlined style={{ color: tokens.colors.warning, fontSize: 12 }} />
                        <Text>{item}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
