// Comparison Page - Favorites list and vehicle comparison
// Uses historical data (no live API calls)
// Features: Show only differences toggle, difference highlighting
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Row,
  Col,
  Typography,
  Card,
  Button,
  Empty,
  Table,
  Tag,
  Space,
  message,
  Popconfirm,
  Switch,
} from 'antd';
import {
  DeleteOutlined,
  HeartFilled,
  SwapOutlined,
  FilePdfOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useAppStore, VehicleIdentifier, createVehicleId } from '../store';
import { BRANDS } from '../config/brands';
import { PriceListRow, IndexData, StoredData } from '../types';
import { tokens } from '../theme/tokens';
import { staggerContainer, staggerItem, cardHoverVariants } from '../theme/animations';
import { useIsMobile } from '../hooks/useMediaQuery';

const { Title, Text } = Typography;

export default function ComparisonPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const {
    favorites,
    removeFavorite,
    clearFavorites,
    compareList,
    removeFromCompare,
    clearCompare,
    addToCompare,
  } = useAppStore();

  const [vehicleData, setVehicleData] = useState<Map<string, PriceListRow>>(new Map());
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  // Fetch vehicle details from historical data
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchVehicleDetails = async () => {
      const allIds = [...new Set([...favorites, ...compareList].map((v) => v.id))];
      if (allIds.length === 0) {
        setVehicleData(new Map());
        return;
      }

      setLoading(true);
      const dataMap = new Map<string, PriceListRow>();

      try {
        // First fetch the index to get latest dates
        const indexResponse = await fetch('./data/index.json', { signal });
        if (!indexResponse.ok) {
          setLoading(false);
          return;
        }

        const indexData: IndexData = await indexResponse.json();

        // Get unique brands needed
        const brandsNeeded = new Set(
          [...favorites, ...compareList].map((v) => v.brand.toLowerCase())
        );

        // Fetch data for needed brands
        await Promise.all(
          Array.from(brandsNeeded).map(async (brandName) => {
            // Find brand ID from name
            const brand = BRANDS.find(
              (b) => b.name.toLowerCase() === brandName || b.id.toLowerCase() === brandName
            );
            if (!brand) return;

            const brandId = brand.id;
            if (!indexData.brands[brandId]) return;

            try {
              const latestDate = indexData.brands[brandId].latestDate;
              const [year, month, day] = latestDate.split('-');
              const url = `./data/${year}/${month}/${brandId}/${day}.json`;

              const response = await fetch(url, { signal });
              if (!response.ok) return;

              const storedData: StoredData = await response.json();

              // Match vehicles using consistent ID creation
              storedData.rows.forEach((row) => {
                const id = createVehicleId(row.brand, row.model, row.trim, row.engine);
                if (allIds.includes(id)) {
                  dataMap.set(id, row);
                }
              });
            } catch (error) {
              if ((error as Error).name !== 'AbortError') {
                console.error(`Failed to fetch ${brand.name}:`, error);
              }
            }
          })
        );
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to fetch index:', error);
        }
      }

      if (!signal.aborted) {
        setVehicleData(dataMap);
        setLoading(false);
      }
    };

    fetchVehicleDetails();

    return () => controller.abort();
  }, [favorites, compareList]);

  // Get vehicle row by identifier
  const getVehicleRow = (vehicle: VehicleIdentifier): PriceListRow | undefined => {
    return vehicleData.get(vehicle.id);
  };

  // Handle add to compare from favorites
  const handleAddToCompare = (vehicle: VehicleIdentifier) => {
    if (addToCompare(vehicle)) {
      message.success(t('priceList.addToCompare'));
    } else {
      message.warning(t('comparison.compareList.maxReached'));
    }
  };

  // Check if all values in a row are the same
  const areAllValuesSame = (row: any): boolean => {
    const values = compareList.map((v) => row[v.id]).filter((val) => val && val !== '-');
    if (values.length < 2) return false;
    return values.every((val) => val === values[0]);
  };

  // Format helper functions
  const formatPrice = (value: number | undefined): string => {
    if (!value) return '-';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
  };

  const formatPower = (hp: number | undefined, kw: number | undefined): string => {
    if (hp && kw) return `${hp} HP (${kw} kW)`;
    if (hp) return `${hp} HP`;
    if (kw) return `${kw} kW`;
    return '-';
  };

  const formatBoolean = (value: boolean | undefined): string => {
    if (value === undefined) return '-';
    return value ? '✓' : '✗';
  };

  const formatRange = (range: number | undefined): string => {
    if (!range) return '-';
    return `${range} km`;
  };

  const formatBattery = (capacity: number | undefined): string => {
    if (!capacity) return '-';
    return `${capacity} kWh`;
  };

  const formatOtvRate = (rate: number | undefined): string => {
    if (!rate) return '-';
    return `%${rate}`;
  };

  // Comprehensive comparison data with categories
  const comparisonData = useMemo(() => {
    if (compareList.length === 0) return [];

    // Feature definitions with categories
    const features: Array<{
      key: string;
      label: string;
      category?: string;
      isCategory?: boolean;
      getValue: (v: VehicleIdentifier, row: PriceListRow | undefined) => string;
      getBestType?: 'lowest' | 'highest';
    }> = [
      // Basic Info Category
      { key: 'cat_basic', label: t('comparison.categories.basic', 'Temel Bilgiler'), isCategory: true, getValue: () => '' },
      { key: 'brand', label: t('common.brand'), category: 'basic', getValue: (v) => v.brand },
      { key: 'model', label: t('common.model'), category: 'basic', getValue: (v) => v.model },
      { key: 'trim', label: t('common.trim'), category: 'basic', getValue: (v) => v.trim },
      { key: 'engine', label: t('common.engine'), category: 'basic', getValue: (v) => v.engine },
      { key: 'modelYear', label: t('comparison.fields.modelYear', 'Model Yılı'), category: 'basic', getValue: (_, row) => row?.modelYear?.toString() || '-' },

      // Performance Category
      { key: 'cat_performance', label: t('comparison.categories.performance', 'Performans'), isCategory: true, getValue: () => '' },
      { key: 'power', label: t('comparison.fields.power', 'Motor Gücü'), category: 'performance', getValue: (_, row) => formatPower(row?.powerHP, row?.powerKW), getBestType: 'highest' },
      { key: 'engineDisplacement', label: t('comparison.fields.engineDisplacement', 'Motor Hacmi'), category: 'performance', getValue: (_, row) => row?.engineDisplacement || '-' },
      { key: 'engineType', label: t('comparison.fields.engineType', 'Motor Tipi'), category: 'performance', getValue: (_, row) => row?.engineType || '-' },

      // Powertrain Category
      { key: 'cat_powertrain', label: t('comparison.categories.powertrain', 'Güç Aktarımı'), isCategory: true, getValue: () => '' },
      { key: 'fuel', label: t('common.fuel'), category: 'powertrain', getValue: (_, row) => row?.fuel || '-' },
      { key: 'transmission', label: t('common.transmission'), category: 'powertrain', getValue: (_, row) => row?.transmission || '-' },
      { key: 'transmissionType', label: t('comparison.fields.transmissionType', 'Şanzıman Tipi'), category: 'powertrain', getValue: (_, row) => row?.transmissionType || '-' },
      { key: 'driveType', label: t('comparison.fields.driveType', 'Çekiş Tipi'), category: 'powertrain', getValue: (_, row) => row?.driveType || '-' },

      // Electrification Category
      { key: 'cat_electrification', label: t('comparison.categories.electrification', 'Elektrikli/Hibrit'), isCategory: true, getValue: () => '' },
      { key: 'isElectric', label: t('comparison.fields.isElectric', 'Elektrikli'), category: 'electrification', getValue: (_, row) => formatBoolean(row?.isElectric) },
      { key: 'isHybrid', label: t('comparison.fields.isHybrid', 'Hibrit'), category: 'electrification', getValue: (_, row) => formatBoolean(row?.isHybrid) },
      { key: 'isMildHybrid', label: t('comparison.fields.isMildHybrid', 'Hafif Hibrit'), category: 'electrification', getValue: (_, row) => formatBoolean(row?.isMildHybrid) },
      { key: 'isPlugInHybrid', label: t('comparison.fields.isPlugInHybrid', 'Plug-in Hibrit'), category: 'electrification', getValue: (_, row) => formatBoolean(row?.isPlugInHybrid) },
      { key: 'batteryCapacity', label: t('comparison.fields.batteryCapacity', 'Batarya Kapasitesi'), category: 'electrification', getValue: (_, row) => formatBattery(row?.batteryCapacity) },
      { key: 'wltpRange', label: t('comparison.fields.wltpRange', 'WLTP Menzil'), category: 'electrification', getValue: (_, row) => formatRange(row?.wltpRange), getBestType: 'highest' },
      { key: 'hasLongRange', label: t('comparison.fields.hasLongRange', 'Uzun Menzil'), category: 'electrification', getValue: (_, row) => formatBoolean(row?.hasLongRange) },

      // Price & Taxes Category
      { key: 'cat_price', label: t('comparison.categories.price', 'Fiyat ve Vergiler'), isCategory: true, getValue: () => '' },
      { key: 'price', label: t('common.price'), category: 'price', getValue: (_, row) => row?.priceRaw || '-', getBestType: 'lowest' },
      { key: 'netPrice', label: t('comparison.fields.netPrice', 'Net Fiyat'), category: 'price', getValue: (_, row) => formatPrice(row?.netPrice), getBestType: 'lowest' },
      { key: 'otvRate', label: t('comparison.fields.otvRate', 'ÖTV Oranı'), category: 'price', getValue: (_, row) => formatOtvRate(row?.otvRate), getBestType: 'lowest' },
      { key: 'otvAmount', label: t('comparison.fields.otvAmount', 'ÖTV Tutarı'), category: 'price', getValue: (_, row) => formatPrice(row?.otvAmount) },
      { key: 'kdvAmount', label: t('comparison.fields.kdvAmount', 'KDV Tutarı'), category: 'price', getValue: (_, row) => formatPrice(row?.kdvAmount) },
      { key: 'monthlyLease', label: t('comparison.fields.monthlyLease', 'Aylık Kiralama'), category: 'price', getValue: (_, row) => formatPrice(row?.monthlyLease), getBestType: 'lowest' },

      // Other Category
      { key: 'cat_other', label: t('comparison.categories.other', 'Diğer'), isCategory: true, getValue: () => '' },
      { key: 'origin', label: t('comparison.fields.origin', 'Menşei'), category: 'other', getValue: (_, row) => row?.origin || '-' },
      { key: 'emissionStandard', label: t('comparison.fields.emissionStandard', 'Emisyon Standardı'), category: 'other', getValue: (_, row) => row?.emissionStandard || '-' },
      { key: 'fuelConsumption', label: t('comparison.fields.fuelConsumption', 'Yakıt Tüketimi'), category: 'other', getValue: (_, row) => row?.fuelConsumption || '-' },
      { key: 'vehicleCategory', label: t('comparison.fields.vehicleCategory', 'Araç Kategorisi'), category: 'other', getValue: (_, row) => row?.vehicleCategory || '-' },
    ];

    return features.map((feature) => {
      const row: any = {
        key: feature.key,
        feature: feature.label,
        isCategory: feature.isCategory || false,
      };

      if (feature.isCategory) {
        // Category header row
        compareList.forEach((vehicle) => {
          row[vehicle.id] = '';
        });
        return row;
      }

      // Track numeric values for best calculation
      let bestValue: number | null = null;
      let bestId = '';

      compareList.forEach((vehicle) => {
        const vehicleRow = getVehicleRow(vehicle);
        const value = feature.getValue(vehicle, vehicleRow);
        row[vehicle.id] = value;

        // Calculate best for price/range comparisons
        if (feature.getBestType && vehicleRow) {
          let numericValue: number | undefined;
          if (feature.key === 'price') {
            numericValue = vehicleRow.priceNumeric;
          } else if (feature.key === 'netPrice') {
            numericValue = vehicleRow.netPrice;
          } else if (feature.key === 'otvRate') {
            numericValue = vehicleRow.otvRate;
          } else if (feature.key === 'wltpRange') {
            numericValue = vehicleRow.wltpRange;
          } else if (feature.key === 'monthlyLease') {
            numericValue = vehicleRow.monthlyLease;
          } else if (feature.key === 'power') {
            numericValue = vehicleRow.powerHP;
          }

          if (numericValue !== undefined && numericValue > 0) {
            if (bestValue === null) {
              bestValue = numericValue;
              bestId = vehicle.id;
            } else if (feature.getBestType === 'lowest' && numericValue < bestValue) {
              bestValue = numericValue;
              bestId = vehicle.id;
            } else if (feature.getBestType === 'highest' && numericValue > bestValue) {
              bestValue = numericValue;
              bestId = vehicle.id;
            }
          }
        }
      });

      if (bestId) {
        row.best = bestId;
      }

      // Check if all values are the same
      row.allSame = areAllValuesSame(row);

      return row;
    });
  }, [compareList, vehicleData, t]);

  // Filtered data based on showOnlyDifferences
  const filteredComparisonData = useMemo(() => {
    if (!showOnlyDifferences) return comparisonData;
    return comparisonData.filter((row) => !row.allSame);
  }, [comparisonData, showOnlyDifferences]);

  // Comparison table columns - responsive
  const comparisonColumns = useMemo(() => [
    {
      title: t('comparison.table.feature'),
      dataIndex: 'feature',
      key: 'feature',
      width: isMobile ? 120 : 180,
      fixed: isMobile ? undefined : ('left' as const),
      render: (text: string, record: any) => {
        if (record.isCategory) {
          return (
            <Text
              strong
              style={{
                fontSize: isMobile ? 12 : 14,
                color: tokens.colors.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {text}
            </Text>
          );
        }
        return (
          <Text style={{ opacity: record.allSame ? 0.5 : 1, fontSize: isMobile ? 11 : 13 }}>
            {text}
          </Text>
        );
      },
    },
    ...compareList.map((vehicle) => ({
      title: (
        <div style={{ textAlign: 'center' }}>
          <Text strong style={{ fontSize: isMobile ? 11 : 14 }}>{vehicle.model}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: isMobile ? 10 : 12 }}>
            {vehicle.brand}
          </Text>
        </div>
      ),
      dataIndex: vehicle.id,
      key: vehicle.id,
      width: isMobile ? 130 : 180,
      render: (value: string, record: any) => {
        // Category header - empty cell with background
        if (record.isCategory) {
          return <div style={{ height: '100%' }} />;
        }

        const isPriceField = record.key === 'price' || record.key === 'netPrice' || record.key === 'monthlyLease';
        const isBest = record.best === vehicle.id;
        const isSame = record.allSame;
        const isCheckmark = value === '✓';
        const isCross = value === '✗';

        return (
          <div style={{ textAlign: 'center', opacity: isSame ? 0.5 : 1 }}>
            <Text
              style={{
                color: isPriceField
                  ? tokens.colors.success
                  : isCheckmark
                    ? tokens.colors.success
                    : isCross
                      ? tokens.colors.gray[400]
                      : undefined,
                fontWeight: isPriceField || isBest ? 600 : 400,
                fontSize: isMobile ? 11 : 13,
              }}
            >
              {value || '-'}
            </Text>
            {isBest && !isSame && (
              <Tag
                color="green"
                style={{ marginLeft: 4, fontSize: isMobile ? 9 : 11, padding: isMobile ? '0 4px' : '0 6px' }}
              >
                {isMobile ? '✓' : t('comparison.table.best')}
              </Tag>
            )}
          </div>
        );
      },
    })),
  ], [compareList, isMobile, t]);

  // Generate PDF report
  const handleGeneratePdf = async () => {
    if (compareList.length === 0) {
      message.warning(t('comparison.compareList.empty'));
      return;
    }

    setGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(20);
      doc.text(t('comparison.pdf.title'), pageWidth / 2, 20, { align: 'center' });

      // Date
      doc.setFontSize(10);
      doc.text(new Date().toLocaleDateString('tr-TR'), pageWidth / 2, 28, { align: 'center' });

      // Use filtered data based on showOnlyDifferences toggle
      const dataForPdf = showOnlyDifferences ? filteredComparisonData : comparisonData;

      // Comparison table
      const headers = [t('comparison.table.feature'), ...compareList.map((v) => v.model)];
      const rows = dataForPdf.map((row) => [
        row.feature,
        ...compareList.map((v) => row[v.id] || '-'),
      ]);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 40,
        theme: 'striped',
        headStyles: {
          fillColor: [0, 102, 255],
          textColor: 255,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `${t('footer.copyright')} - ${new Date().getFullYear()}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save('vehicle-comparison.pdf');
      message.success(t('comparison.pdf.generate'));
    } catch (error) {
      console.error('PDF generation failed:', error);
      message.error(t('errors.fetchError'));
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="enter"
      style={{ padding: tokens.spacing.lg }}
    >
      {/* Page Header */}
      <motion.div variants={staggerItem} style={{ marginBottom: tokens.spacing.xl }}>
        <Title level={2} style={{ marginBottom: tokens.spacing.xs }}>
          {t('comparison.title')}
        </Title>
        <Text type="secondary">{t('comparison.subtitle')}</Text>
      </motion.div>

      <Row gutter={[24, 24]}>
        {/* Favorites List */}
        <Col xs={24} lg={8}>
          <motion.div variants={staggerItem}>
            <Card
              title={
                <Space>
                  <HeartFilled style={{ color: tokens.colors.error }} />
                  {t('comparison.favorites.title')} ({favorites.length})
                </Space>
              }
              extra={
                favorites.length > 0 && (
                  <Popconfirm
                    title={t('common.confirm')}
                    onConfirm={clearFavorites}
                    okText={t('common.confirm')}
                    cancelText={t('common.cancel')}
                  >
                    <Button type="text" danger icon={<ClearOutlined />} size="small">
                      {t('common.clear')}
                    </Button>
                  </Popconfirm>
                )
              }
              style={{ borderRadius: tokens.borderRadius.lg, height: '100%' }}
            >
              {favorites.length === 0 ? (
                <Empty
                  description={
                    <div>
                      <Text type="secondary">{t('comparison.favorites.empty')}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('comparison.favorites.addHint')}
                      </Text>
                    </div>
                  }
                />
              ) : (
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  {favorites.map((vehicle) => {
                    const row = getVehicleRow(vehicle);
                    const isInCompare = compareList.some((c) => c.id === vehicle.id);

                    return (
                      <motion.div
                        key={vehicle.id}
                        variants={cardHoverVariants}
                        initial="initial"
                        whileHover="hover"
                      >
                        <Card
                          size="small"
                          style={{
                            marginBottom: tokens.spacing.sm,
                            borderRadius: tokens.borderRadius.md,
                            border: `1px solid ${tokens.colors.gray[200]}`,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}
                          >
                            <div>
                              <Text strong>{vehicle.model}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {vehicle.brand} - {vehicle.trim}
                              </Text>
                              <br />
                              {row && (
                                <Text
                                  style={{
                                    color: tokens.colors.success,
                                    fontWeight: 600,
                                    fontSize: 14,
                                  }}
                                >
                                  {row.priceRaw}
                                </Text>
                              )}
                            </div>
                            <Space direction="vertical" size="small">
                              <Button
                                type={isInCompare ? 'primary' : 'default'}
                                size="small"
                                icon={<SwapOutlined />}
                                onClick={() =>
                                  isInCompare
                                    ? removeFromCompare(vehicle.id)
                                    : handleAddToCompare(vehicle)
                                }
                                disabled={!isInCompare && compareList.length >= 4}
                              >
                                {isInCompare ? t('common.remove') : t('common.compare')}
                              </Button>
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => removeFavorite(vehicle.id)}
                              />
                            </Space>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </Col>

        {/* Comparison Table */}
        <Col xs={24} lg={16}>
          <motion.div variants={staggerItem}>
            <Card
              title={
                <Space>
                  <SwapOutlined />
                  {t('comparison.compareList.title')} ({compareList.length}/4)
                </Space>
              }
              extra={
                <Space>
                  {compareList.length > 1 && (
                    <Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('comparison.showOnlyDifferences')}
                      </Text>
                      <Switch
                        checked={showOnlyDifferences}
                        onChange={setShowOnlyDifferences}
                        size="small"
                      />
                    </Space>
                  )}
                  {compareList.length > 0 && (
                    <>
                      <Button
                        type="primary"
                        icon={<FilePdfOutlined />}
                        onClick={handleGeneratePdf}
                        loading={generatingPdf}
                      >
                        {generatingPdf
                          ? t('comparison.pdf.generating')
                          : t('comparison.pdf.generate')}
                      </Button>
                      <Popconfirm
                        title={t('common.confirm')}
                        onConfirm={clearCompare}
                        okText={t('common.confirm')}
                        cancelText={t('common.cancel')}
                      >
                        <Button danger icon={<ClearOutlined />}>
                          {t('comparison.compareList.clearAll')}
                        </Button>
                      </Popconfirm>
                    </>
                  )}
                </Space>
              }
              style={{ borderRadius: tokens.borderRadius.lg }}
            >
              {compareList.length === 0 ? (
                <Empty
                  description={
                    <div>
                      <Text type="secondary">{t('comparison.compareList.empty')}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('comparison.compareList.maxReached').replace('4', '4')}
                      </Text>
                    </div>
                  }
                />
              ) : filteredComparisonData.length === 0 ? (
                <Empty description={t('comparison.allSame')} />
              ) : (
                <Table
                  columns={comparisonColumns}
                  dataSource={filteredComparisonData}
                  pagination={false}
                  scroll={{ x: isMobile ? 450 : 'max-content' }}
                  size={isMobile ? 'small' : 'middle'}
                  loading={loading}
                  rowClassName={(record) => {
                    if (record.isCategory) return 'comparison-category-row';
                    if (record.allSame) return 'row-same-values';
                    return '';
                  }}
                />
              )}
            </Card>
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );
}
