// PWA Install Prompt Component
// Shows a prompt to install the app on supported devices

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Space, Typography } from 'antd';
import { DownloadOutlined, CloseOutlined, MobileOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Text, Title } = Typography;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedDate = new Date(wasDismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setDismissed(true);
        return;
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // Don't show if already dismissed or no prompt available
  if (dismissed || !deferredPrompt) return null;

  return (
    <Modal
      open={showPrompt}
      onCancel={handleDismiss}
      footer={null}
      closable={false}
      centered
      width={400}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ textAlign: 'center', padding: '16px 0' }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #000 0%, #333 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <MobileOutlined style={{ fontSize: 36, color: '#fff' }} />
        </div>

        <Title level={4} style={{ marginBottom: 8 }}>
          {t('pwa.install', 'Install App')}
        </Title>

        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          {t('pwa.installDesc', 'Add to home screen for faster access and offline support.')}
        </Text>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            size="large"
            icon={<DownloadOutlined />}
            onClick={handleInstall}
            block
          >
            {t('pwa.installButton', 'Install')}
          </Button>
          <Button
            type="text"
            size="large"
            icon={<CloseOutlined />}
            onClick={handleDismiss}
            block
          >
            {t('pwa.notNow', 'Not Now')}
          </Button>
        </Space>
      </motion.div>
    </Modal>
  );
}
