// Command Palette Component
// Global search and navigation with Cmd+K

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, List, Typography, Tag, Space, Empty } from 'antd';
import {
  SearchOutlined,
  CarOutlined,
  HomeOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  SwapOutlined,
  BulbOutlined,
  UserOutlined,
  HeartOutlined,
} from '@ant-design/icons';

import { tokens } from '../../theme/tokens';
import { useSearch, SearchItem, SearchResult, createSearchItem } from '../../hooks/useSearch';
import { useAppStore, createVehicleIdentifier } from '../../store';

const { Text } = Typography;

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Array<{
    brand: string;
    model: string;
    trim: string;
    engine: string;
    fuel: string;
    transmission: string;
    price: number;
    priceFormatted: string;
  }>;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export default function CommandPalette({ isOpen, onClose, vehicles }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<any>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { addFavorite, isFavorite, addToCompare, isInCompare } = useAppStore();

  // Convert vehicles to search items
  const searchItems: SearchItem[] = useMemo(() => {
    return vehicles.map((v) =>
      createSearchItem(v.brand, v.model, v.trim, v.engine, v.fuel, v.transmission, v.price, v.priceFormatted)
    );
  }, [vehicles]);

  const { query, setQuery, results, clearSearch } = useSearch(searchItems);

  // Quick actions
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'home',
        label: t('nav.home', 'Home'),
        icon: <HomeOutlined />,
        action: () => navigate('/'),
        shortcut: 'G H',
      },
      {
        id: 'prices',
        label: t('nav.priceList', 'Price List'),
        icon: <UnorderedListOutlined />,
        action: () => navigate('/fiyat-listesi'),
        shortcut: 'G P',
      },
      {
        id: 'stats',
        label: t('nav.statistics', 'Statistics'),
        icon: <BarChartOutlined />,
        action: () => navigate('/istatistikler'),
        shortcut: 'G S',
      },
      {
        id: 'compare',
        label: t('nav.comparison', 'Comparison'),
        icon: <SwapOutlined />,
        action: () => navigate('/karsilastirma'),
        shortcut: 'G C',
      },
      {
        id: 'insights',
        label: t('nav.insights', 'Insights'),
        icon: <BulbOutlined />,
        action: () => navigate('/analizler'),
        shortcut: 'G I',
      },
      {
        id: 'my',
        label: t('nav.my', 'My Dashboard'),
        icon: <UserOutlined />,
        action: () => navigate('/benim'),
        shortcut: 'G M',
      },
    ],
    [navigate, t]
  );

  // Combined results: quick actions (if no query) or search results
  const displayItems = useMemo(() => {
    if (!query.trim()) {
      return quickActions.map((action) => ({
        type: 'action' as const,
        data: action,
      }));
    }

    // Filter quick actions that match query
    const matchingActions = quickActions
      .filter((action) =>
        action.label.toLowerCase().includes(query.toLowerCase())
      )
      .map((action) => ({
        type: 'action' as const,
        data: action,
      }));

    // Vehicle search results
    const vehicleResults = results.map((result) => ({
      type: 'vehicle' as const,
      data: result,
    }));

    return [...matchingActions, ...vehicleResults];
  }, [query, quickActions, results]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      clearSearch();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, clearSearch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, displayItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = displayItems[selectedIndex];
        if (selected) {
          handleItemSelect(selected);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, displayItems, selectedIndex]);

  const handleItemSelect = (item: (typeof displayItems)[0]) => {
    if (item.type === 'action') {
      item.data.action();
      onClose();
    } else if (item.type === 'vehicle') {
      // Navigate to price list with filter
      const vehicle = item.data.item;
      navigate(`/fiyat-listesi?search=${encodeURIComponent(vehicle.brand + ' ' + vehicle.model)}`);
      onClose();
    }
  };

  const handleAddFavorite = (vehicle: SearchItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const identifier = createVehicleIdentifier(vehicle.brand, vehicle.model, vehicle.trim, vehicle.engine);
    addFavorite(identifier);
  };

  const handleAddToCompare = (vehicle: SearchItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const identifier = createVehicleIdentifier(vehicle.brand, vehicle.model, vehicle.trim, vehicle.engine);
    addToCompare(identifier);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={600}
      centered
      styles={{
        body: { padding: 0 },
        content: { borderRadius: tokens.borderRadius.lg, overflow: 'hidden' },
      }}
      maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div style={{ background: '#fff' }}>
        {/* Search Input */}
        <div style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.gray[200]}` }}>
          <Input
            ref={inputRef}
            prefix={<SearchOutlined style={{ color: tokens.colors.gray[400] }} />}
            placeholder={t('search.placeholder', 'Search vehicles or type a command...')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            size="large"
            variant="borderless"
            style={{ fontSize: 16 }}
            suffix={
              <Space>
                <Tag style={{ margin: 0, fontSize: 11 }}>ESC</Tag>
              </Space>
            }
          />
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {displayItems.length === 0 ? (
            <div style={{ padding: tokens.spacing.xl, textAlign: 'center' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('search.noResults', 'No results found')}
              />
            </div>
          ) : (
            <List
              dataSource={displayItems}
              renderItem={(item, index) => {
                const isSelected = index === selectedIndex;

                if (item.type === 'action') {
                  const action = item.data;
                  return (
                    <List.Item
                      onClick={() => handleItemSelect(item)}
                      style={{
                        padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? tokens.colors.gray[100] : 'transparent',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <span style={{ marginRight: tokens.spacing.md, fontSize: 18, color: tokens.colors.gray[500] }}>
                          {action.icon}
                        </span>
                        <Text>{action.label}</Text>
                        {action.shortcut && (
                          <Text type="secondary" style={{ marginLeft: 'auto', fontSize: 11 }}>
                            {action.shortcut}
                          </Text>
                        )}
                      </div>
                    </List.Item>
                  );
                }

                // Vehicle result
                const result = item.data as SearchResult;
                const vehicle = result.item;

                return (
                  <List.Item
                    onClick={() => handleItemSelect(item)}
                    style={{
                      padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? tokens.colors.gray[100] : 'transparent',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <CarOutlined style={{ marginRight: tokens.spacing.md, fontSize: 18, color: tokens.colors.primary }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                          <Text strong>
                            {vehicle.brand} {vehicle.model}
                          </Text>
                          <Tag color="blue" style={{ fontSize: 10 }}>{vehicle.fuel}</Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {vehicle.trim} | {vehicle.engine}
                        </Text>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: tokens.spacing.md }}>
                        <Text strong style={{ color: tokens.colors.primary }}>
                          {formatPrice(vehicle.price)}
                        </Text>
                        <div style={{ marginTop: 2 }}>
                          <Space size={4}>
                            <HeartOutlined
                              onClick={(e) => handleAddFavorite(vehicle, e)}
                              style={{
                                cursor: 'pointer',
                                color: isFavorite(vehicle.id) ? tokens.colors.error : tokens.colors.gray[400],
                              }}
                            />
                            <SwapOutlined
                              onClick={(e) => handleAddToCompare(vehicle, e)}
                              style={{
                                cursor: isInCompare(vehicle.id) ? 'not-allowed' : 'pointer',
                                color: isInCompare(vehicle.id) ? tokens.colors.gray[300] : tokens.colors.gray[400],
                              }}
                            />
                          </Space>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
            borderTop: `1px solid ${tokens.colors.gray[200]}`,
            background: tokens.colors.gray[50],
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space size="middle">
            <Space size={4}>
              <Tag style={{ margin: 0, fontSize: 10 }}>↑↓</Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>{t('search.navigate', 'Navigate')}</Text>
            </Space>
            <Space size={4}>
              <Tag style={{ margin: 0, fontSize: 10 }}>↵</Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>{t('search.select', 'Select')}</Text>
            </Space>
          </Space>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {displayItems.length} {t('common.records', 'results')}
          </Text>
        </div>
      </div>
    </Modal>
  );
}
