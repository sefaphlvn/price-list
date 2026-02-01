// QuickCompareFAB - Floating Action Button for quick access to comparison list
// Shows in bottom-right corner, displays compare count, opens mini-drawer

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FloatButton, Drawer, List, Button, Badge, Space, Typography, Empty } from 'antd';
import {
  SwapOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  CloseOutlined,
} from '@ant-design/icons';

import { useAppStore, VehicleIdentifier } from '../../store';
import { tokens } from '../../theme/tokens';
import { useIsMobile } from '../../hooks/useMediaQuery';

const { Text } = Typography;

export default function QuickCompareFAB() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { compareList, removeFromCompare, clearCompare } = useAppStore();

  // Don't show on comparison page
  if (location.pathname === '/karsilastirma') {
    return null;
  }

  // Don't show if compare list is empty
  if (compareList.length === 0) {
    return null;
  }

  const handleNavigate = () => {
    setDrawerOpen(false);
    navigate('/karsilastirma');
  };

  const handleRemove = (id: string) => {
    removeFromCompare(id);
  };

  const handleClear = () => {
    clearCompare();
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <FloatButton
        icon={<SwapOutlined />}
        badge={{ count: compareList.length, color: tokens.colors.primary }}
        onClick={() => setDrawerOpen(true)}
        style={{
          right: isMobile ? 16 : 24,
          bottom: isMobile ? 80 : 24,
          width: isMobile ? 48 : 56,
          height: isMobile ? 48 : 56,
        }}
        tooltip={t('quickCompare.title', 'Karşılaştırma Listesi')}
      />

      {/* Mini Drawer */}
      <Drawer
        title={
          <Space>
            <SwapOutlined />
            {t('quickCompare.title', 'Karşılaştırma Listesi')}
            <Badge count={compareList.length} style={{ backgroundColor: tokens.colors.primary }} />
          </Space>
        }
        placement={isMobile ? 'bottom' : 'right'}
        width={isMobile ? '100%' : 360}
        height={isMobile ? '60vh' : undefined}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setDrawerOpen(false)}
          />
        }
        footer={
          compareList.length > 0 && (
            <Space style={{ width: '100%' }} direction="vertical">
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                block
                size="large"
                onClick={handleNavigate}
              >
                {t('quickCompare.goToCompare', 'Karşılaştırmaya Git')}
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                block
                onClick={handleClear}
              >
                {t('quickCompare.clearAll', 'Listeyi Temizle')}
              </Button>
            </Space>
          )
        }
      >
        {compareList.length === 0 ? (
          <Empty
            description={t('quickCompare.empty', 'Karşılaştırma listesi boş')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={compareList}
            renderItem={(vehicle: VehicleIdentifier) => (
              <List.Item
                key={vehicle.id}
                actions={[
                  <Button
                    key="remove"
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(vehicle.id)}
                  />,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Text strong style={{ fontSize: 13 }}>
                      {vehicle.brand} {vehicle.model}
                    </Text>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {vehicle.trim} • {vehicle.engine}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </>
  );
}
