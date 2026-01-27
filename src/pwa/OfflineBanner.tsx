// Offline Banner Component
// Shows when the user is offline or when cached data is being used

import { useTranslation } from 'react-i18next';
import { Alert, Button, Space } from 'antd';
import { WifiOutlined, CloudSyncOutlined, ReloadOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

import { useOffline, useServiceWorker } from './useOffline';

export default function OfflineBanner() {
  const { t } = useTranslation();
  const { isOffline } = useOffline();
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Alert
            message={
              <Space>
                <WifiOutlined />
                {t('pwa.offline', 'Offline Mode')}
              </Space>
            }
            description={t(
              'pwa.offlineDesc',
              'No internet connection. Showing cached data.'
            )}
            type="warning"
            showIcon={false}
            style={{
              margin: 0,
              borderRadius: 0,
              borderLeft: 'none',
              borderRight: 'none',
              borderTop: 'none',
            }}
          />
        </motion.div>
      )}

      {isUpdateAvailable && !isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Alert
            message={
              <Space>
                <CloudSyncOutlined />
                {t('pwa.updateAvailable', 'Update Available')}
              </Space>
            }
            description={t(
              'pwa.updateAvailableDesc',
              'A new version is available. Refresh to update.'
            )}
            type="info"
            showIcon={false}
            action={
              <Button
                size="small"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={updateServiceWorker}
              >
                {t('pwa.refresh', 'Refresh')}
              </Button>
            }
            style={{
              margin: 0,
              borderRadius: 0,
              borderLeft: 'none',
              borderRight: 'none',
              borderTop: 'none',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
