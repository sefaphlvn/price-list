// Header Component - Navigation and language switcher
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Menu, Button, Drawer, Badge, Dropdown, Space, Typography, Switch } from 'antd';
import {
  HomeOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  SwapOutlined,
  MenuOutlined,
  HeartOutlined,
  BellOutlined,
  BulbOutlined,
  UserOutlined,
  ThunderboltOutlined,
  RadarChartOutlined,
  AimOutlined,
  TagOutlined,
  ApartmentOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  CalculatorOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

import { useAppStore } from '../../store';
import { tokens } from '../../theme/tokens';

const { Text } = Typography;

interface HeaderProps {
  onOpenTracking?: () => void;
}

export default function Header({ onOpenTracking }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    language,
    setLanguage,
    favorites,
    compareList,
    trackedVehicles,
    priceChanges,
    intelModeEnabled,
    setIntelModeEnabled,
    triggeredAlerts,
  } = useAppStore();

  // Intel Mode submenu items
  const intelSubMenuItems: MenuProps['items'] = [
    {
      key: '/market-pulse',
      icon: <ThunderboltOutlined />,
      label: t('nav.marketPulse', 'Piyasa Nabzi'),
    },
    {
      key: '/positioning',
      icon: <RadarChartOutlined />,
      label: t('nav.positioning', 'Konumlandirma'),
    },
    {
      key: '/gaps',
      icon: <AimOutlined />,
      label: t('nav.gaps', 'Bosluk Bulucu'),
    },
    {
      key: '/promos',
      icon: <TagOutlined />,
      label: t('nav.promos', 'Promosyonlar'),
    },
    {
      key: '/architecture',
      icon: <ApartmentOutlined />,
      label: t('nav.architecture', 'Fiyat Mimarisi'),
    },
    {
      key: '/lifecycle',
      icon: <ClockCircleOutlined />,
      label: t('nav.lifecycle', 'Yasam Dongusu'),
    },
    {
      key: '/alerts',
      icon: (
        <Badge count={triggeredAlerts.length} size="small" offset={[8, 0]}>
          <AlertOutlined />
        </Badge>
      ),
      label: t('nav.alerts', 'Uyarilar'),
    },
    {
      key: '/tco',
      icon: <CalculatorOutlined />,
      label: t('nav.tco', 'TCO Hesaplayici'),
    },
  ];

  const baseMenuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: t('nav.home'),
    },
    {
      key: '/fiyat-listesi',
      icon: <UnorderedListOutlined />,
      label: t('nav.priceList'),
    },
    {
      key: '/istatistikler',
      icon: <BarChartOutlined />,
      label: t('nav.statistics'),
    },
    {
      key: '/karsilastirma',
      icon: <SwapOutlined />,
      label: (
        <Badge count={compareList.length} size="small" offset={[12, 0]}>
          {t('nav.comparison')}
        </Badge>
      ),
    },
    {
      key: '/analizler',
      icon: <BulbOutlined />,
      label: t('nav.insights'),
    },
    {
      key: '/benim',
      icon: <UserOutlined />,
      label: t('nav.my'),
    },
  ];

  // Intel Mode as a dropdown submenu
  const intelMenuItem: MenuProps['items'] = intelModeEnabled
    ? [
        {
          key: 'intel-menu',
          icon: (
            <Badge count={triggeredAlerts.length} size="small" offset={[8, 0]}>
              <ThunderboltOutlined style={{ color: tokens.colors.primary }} />
            </Badge>
          ),
          label: t('intel.mode', 'Intel'),
          children: intelSubMenuItems,
        },
      ]
    : [];

  const menuItems: MenuProps['items'] = [...baseMenuItems, ...intelMenuItem];

  // Mobile menu - flat structure
  const mobileMenuItems: MenuProps['items'] = intelModeEnabled
    ? [
        ...baseMenuItems,
        { type: 'divider' },
        {
          key: 'intel-header',
          type: 'group',
          label: (
            <Space>
              <ThunderboltOutlined style={{ color: tokens.colors.primary }} />
              <span style={{ color: tokens.colors.primary, fontWeight: 600 }}>{t('intel.mode', 'Intel Modu')}</span>
            </Space>
          ),
          children: intelSubMenuItems,
        },
      ]
    : baseMenuItems;

  const languageItems: MenuProps['items'] = [
    {
      key: 'tr',
      label: (
        <Space>
          <span>🇹🇷</span>
          <span>Turkce</span>
        </Space>
      ),
    },
    {
      key: 'en',
      label: (
        <Space>
          <span>🇬🇧</span>
          <span>English</span>
        </Space>
      ),
    },
  ];

  const settingsItems: MenuProps['items'] = [
    {
      key: 'intel-mode',
      label: (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <ThunderboltOutlined style={{ color: intelModeEnabled ? tokens.colors.primary : undefined }} />
            <span>{t('intel.mode', 'Intel Modu')}</span>
          </Space>
          <Switch
            size="small"
            checked={intelModeEnabled}
            onChange={(checked) => setIntelModeEnabled(checked)}
          />
        </Space>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'language',
      label: t('common.language', 'Dil'),
      children: languageItems,
    },
  ];

  const handleMenuClick = (key: string) => {
    if (key !== 'intel-menu' && key !== 'intel-header') {
      navigate(key);
      setMobileMenuOpen(false);
    }
  };

  // Check if current path is an Intel page
  const isIntelPath = ['/market-pulse', '/positioning', '/gaps', '/promos', '/architecture', '/lifecycle', '/alerts'].includes(location.pathname);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: tokens.zIndex.sticky,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${tokens.colors.gray[200]}`,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: `0 ${tokens.spacing.lg}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing.sm,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: tokens.borderRadius.md,
                background: tokens.colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              OFL
            </div>
            <Text
              strong
              style={{
                fontSize: 18,
                color: tokens.colors.primary,
                display: 'none',
              }}
              className="logo-text"
            >
              OtoFiyatList
            </Text>
          </motion.div>
        </Link>

        {/* Desktop Menu */}
        <Menu
          mode="horizontal"
          selectedKeys={isIntelPath ? ['intel-menu', location.pathname] : [location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          style={{
            flex: 1,
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            display: 'none',
          }}
          className="desktop-menu"
        />

        {/* Right Section */}
        <Space size="middle">
          {/* Tracking Badge - show price changes count if any, otherwise tracked count */}
          {onOpenTracking && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Badge
                count={priceChanges.length > 0 ? priceChanges.length : trackedVehicles.length}
                size="small"
                color={priceChanges.length > 0 ? '#ef4444' : undefined}
              >
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                  onClick={onOpenTracking}
                  style={{ padding: '4px 8px' }}
                  title={t('tracking.title')}
                />
              </Badge>
            </motion.div>
          )}

          {/* Favorites Badge */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Badge count={favorites.length} size="small">
              <Button
                type="text"
                icon={<HeartOutlined style={{ fontSize: 18 }} />}
                onClick={() => navigate('/karsilastirma')}
                style={{ padding: '4px 8px' }}
              />
            </Badge>
          </motion.div>

          {/* Settings Dropdown */}
          <Dropdown
            menu={{
              items: settingsItems,
              onClick: ({ key, keyPath }) => {
                if (keyPath.includes('language')) {
                  setLanguage(key as 'tr' | 'en');
                  i18n.changeLanguage(key);
                }
              },
              selectedKeys: [language],
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button type="text" icon={<SettingOutlined style={{ fontSize: 18 }} />}>
              {intelModeEnabled && (
                <ThunderboltOutlined
                  style={{ marginLeft: 4, color: tokens.colors.primary, fontSize: 12 }}
                />
              )}
            </Button>
          </Dropdown>

          {/* Mobile Menu Button */}
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: 20 }} />}
            onClick={() => setMobileMenuOpen(true)}
            className="mobile-menu-btn"
            style={{ display: 'none' }}
          />
        </Space>

        {/* Mobile Drawer */}
        <Drawer
          title={t('nav.home')}
          placement="right"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          width={280}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={mobileMenuItems}
            onClick={({ key }) => handleMenuClick(key)}
            style={{ border: 'none' }}
          />
        </Drawer>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-menu {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
          .logo-text {
            display: inline !important;
          }
        }
        @media (max-width: 767px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-btn {
            display: inline-flex !important;
          }
        }
        .ant-menu-horizontal > .ant-menu-submenu .ant-menu-submenu-title {
          padding-inline: 12px;
        }
      `}</style>
    </motion.header>
  );
}
