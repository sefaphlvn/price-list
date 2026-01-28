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

import { useAppStore, VehicleIdentifier } from '../store';
import { BRANDS } from '../config/brands';
import { PriceListRow, IndexData, StoredData } from '../types';
import { tokens } from '../theme/tokens';
import { staggerContainer, staggerItem, cardHoverVariants } from '../theme/animations';

const { Title, Text } = Typography;

export default function ComparisonPage() {
  const { t } = useTranslation();
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

              // Match vehicles
              storedData.rows.forEach((row) => {
                const id = `${row.brand}-${row.model}-${row.trim}-${row.engine}`
                  .toLowerCase()
                  .replace(/\s+/g, '-');
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

  // Comparison table data with difference info
  const comparisonData = useMemo(() => {
    if (compareList.length === 0) return [];

    const features = [
      { key: 'brand', label: t('common.brand') },
      { key: 'trim', label: t('common.trim') },
      { key: 'engine', label: t('common.engine') },
      { key: 'fuel', label: t('common.fuel') },
      { key: 'transmission', label: t('common.transmission') },
      { key: 'price', label: t('common.price') },
    ];

    return features.map((feature) => {
      const row: any = {
        key: feature.key,
        feature: feature.label,
      };

      // Find best price
      let lowestPrice = Infinity;
      let bestId = '';

      compareList.forEach((vehicle) => {
        const vehicleRow = getVehicleRow(vehicle);
        if (feature.key === 'brand') {
          row[vehicle.id] = vehicle.brand;
        } else if (feature.key === 'trim') {
          row[vehicle.id] = vehicle.trim;
        } else if (feature.key === 'engine') {
          row[vehicle.id] = vehicle.engine;
        } else if (feature.key === 'fuel') {
          row[vehicle.id] = vehicleRow?.fuel || '-';
        } else if (feature.key === 'transmission') {
          row[vehicle.id] = vehicleRow?.transmission || '-';
        } else if (feature.key === 'price') {
          row[vehicle.id] = vehicleRow?.priceRaw || '-';
          if (vehicleRow && vehicleRow.priceNumeric < lowestPrice) {
            lowestPrice = vehicleRow.priceNumeric;
            bestId = vehicle.id;
          }
        }
      });

      if (feature.key === 'price' && bestId) {
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

  // Comparison table columns
  const comparisonColumns = [
    {
      title: t('comparison.table.feature'),
      dataIndex: 'feature',
      key: 'feature',
      width: 150,
      fixed: 'left' as const,
      render: (text: string, record: any) => (
        <Text strong style={{ opacity: record.allSame ? 0.5 : 1 }}>
          {text}
        </Text>
      ),
    },
    ...compareList.map((vehicle) => ({
      title: (
        <div style={{ textAlign: 'center' }}>
          <Text strong>{vehicle.model}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {vehicle.brand}
          </Text>
        </div>
      ),
      dataIndex: vehicle.id,
      key: vehicle.id,
      width: 180,
      render: (value: string, record: any) => {
        const isPrice = record.feature === t('common.price');
        const isBest = record.best === vehicle.id;
        const isSame = record.allSame;

        return (
          <div style={{ textAlign: 'center', opacity: isSame ? 0.5 : 1 }}>
            <Text
              style={{
                color: isPrice ? tokens.colors.success : undefined,
                fontWeight: isPrice ? 600 : 400,
              }}
            >
              {value || '-'}
            </Text>
            {isBest && !isSame && (
              <Tag color="green" style={{ marginLeft: 4 }}>
                {t('comparison.table.best')}
              </Tag>
            )}
          </div>
        );
      },
    })),
  ];

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
                  scroll={{ x: 'max-content' }}
                  size="middle"
                  loading={loading}
                  rowClassName={(record) => (record.allSame ? 'row-same-values' : '')}
                />
              )}
            </Card>
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );
}
