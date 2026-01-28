// Price List Page - Vehicle price listing from historical data
// Features: URL state sync, tracking, trend modal, virtualization
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Table,
  Input,
  Select,
  Button,
  Alert,
  Spin,
  Space,
  Typography,
  DatePicker,
  Tooltip,
  message,
} from 'antd';
import {
  DownloadOutlined,
  CopyOutlined,
  SearchOutlined,
  ReloadOutlined,
  HeartOutlined,
  HeartFilled,
  SwapOutlined,
  CheckOutlined,
  CalendarOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LineChartOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import { PriceListRow, IndexData, StoredData } from '../types';
import { BRANDS } from '../config/brands';
import { exportToCSV, exportToXLSX, copyAsMarkdown } from '../utils/export';
import {
  useAppStore,
  createVehicleIdentifier,
  createVehicleId,
  TrackedVehicle,
} from '../store';
import { staggerContainer, staggerItem, tableRowVariants } from '../theme/animations';
import { tokens } from '../theme/tokens';
import {
  parseQueryToState,
  stateToQuery,
  getShareableUrl,
  copyUrlToClipboard,
  PriceListUrlState,
} from '../utils/urlState';
import PriceTrendModal from '../components/pricelist/PriceTrendModal';

const { Title, Text } = Typography;
const { Search } = Input;

interface FetchState {
  loading: boolean;
  error: string | null;
  data: {
    rows: PriceListRow[];
    lastUpdated?: string;
    brand: string;
  } | null;
}

export default function PriceListPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    addFavorite,
    removeFavorite,
    isFavorite,
    addToCompare,
    removeFromCompare,
    isInCompare,
    canAddToCompare,
    addTrackedVehicle,
    removeTrackedVehicle,
    isTracked,
  } = useAppStore();

  // URL state initialization flag
  const urlInitialized = useRef(false);

  // Parse initial state from URL
  const initialUrlState = useMemo(() => {
    const search = location.search || '';
    return parseQueryToState(search);
  }, []);

  const [selectedBrand, setSelectedBrand] = useState<string>(
    initialUrlState.brand || BRANDS[0].id
  );
  const [fetchState, setFetchState] = useState<FetchState>({
    loading: true,
    error: null,
    data: null,
  });

  // Date selection
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(
    initialUrlState.date ? dayjs(initialUrlState.date) : null
  );
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Filters
  const [searchText, setSearchText] = useState(initialUrlState.q || '');
  const [modelFilter, setModelFilter] = useState<string | null>(initialUrlState.model || null);
  const [transmissionFilter, setTransmissionFilter] = useState<string | null>(
    initialUrlState.transmission || null
  );
  const [fuelFilter, setFuelFilter] = useState<string | null>(initialUrlState.fuel || null);

  // Sorting
  const [sortInfo, setSortInfo] = useState<{
    column: string;
    order: 'ascend' | 'descend';
  } | null>(
    initialUrlState.sort
      ? {
          column: initialUrlState.sort.split(':')[0],
          order: initialUrlState.sort.split(':')[1] === 'desc' ? 'descend' : 'ascend',
        }
      : { column: 'price', order: 'ascend' }
  );

  // Table state
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: initialUrlState.page || 1,
    pageSize: initialUrlState.pageSize || 100,
    showSizeChanger: true,
    pageSizeOptions: ['50', '100', '200', '500'],
    showTotal: (total) => `${t('common.total')} ${total} ${t('common.records')}`,
  });

  // Trend modal
  const [trendModalOpen, setTrendModalOpen] = useState(false);
  const [trendVehicle, setTrendVehicle] = useState<PriceListRow | null>(null);

  // Update URL when state changes (debounced)
  const updateUrl = useCallback(() => {
    if (!urlInitialized.current) return;

    const state: PriceListUrlState = {
      brand: selectedBrand !== BRANDS[0].id ? selectedBrand : undefined,
      q: searchText || undefined,
      model: modelFilter || undefined,
      transmission: transmissionFilter || undefined,
      fuel: fuelFilter || undefined,
      date: selectedDate?.format('YYYY-MM-DD'),
      sort: sortInfo ? `${sortInfo.column}:${sortInfo.order === 'descend' ? 'desc' : 'asc'}` : undefined,
      page: pagination.current,
      pageSize: pagination.pageSize,
    };

    const query = stateToQuery(state);
    const newPath = `/fiyat-listesi${query}`;

    if (location.pathname + location.search !== newPath) {
      navigate(newPath, { replace: true });
    }
  }, [
    selectedBrand,
    searchText,
    modelFilter,
    transmissionFilter,
    fuelFilter,
    selectedDate,
    sortInfo,
    pagination.current,
    pagination.pageSize,
    navigate,
    location.pathname,
    location.search,
  ]);

  // Debounced URL update
  useEffect(() => {
    const timer = setTimeout(updateUrl, 300);
    return () => clearTimeout(timer);
  }, [updateUrl]);

  // Load index data on mount
  useEffect(() => {
    const loadIndex = async () => {
      try {
        const response = await fetch('./data/index.json');
        if (!response.ok) {
          console.warn('Index fetch failed:', response.status, response.statusText);
          return;
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Index response is not JSON:', contentType);
          return;
        }

        const data: IndexData = await response.json();
        setIndexData(data);
      } catch (error) {
        console.warn('Failed to load index:', error);
      }
    };
    loadIndex();
  }, []);

  // Update available dates when brand or index changes
  useEffect(() => {
    if (indexData && indexData.brands[selectedBrand]) {
      const dates = indexData.brands[selectedBrand].availableDates;
      setAvailableDates(dates);

      // Set date from URL or auto-select latest (dates[0] is newest)
      if (initialUrlState.date && !urlInitialized.current) {
        const urlDate = dayjs(initialUrlState.date);
        if (dates.includes(urlDate.format('YYYY-MM-DD'))) {
          setSelectedDate(urlDate);
        } else if (dates.length > 0) {
          setSelectedDate(dayjs(dates[0]));
        }
      } else if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dayjs(dates[0]));
      }

      urlInitialized.current = true;
    } else {
      setAvailableDates([]);
      if (!initialUrlState.date) {
        setSelectedDate(null);
      }
    }
  }, [indexData, selectedBrand]);

  // Fetch data for selected brand and date
  const fetchData = async () => {
    if (!selectedDate) {
      setFetchState({ loading: false, error: t('errors.noData'), data: null });
      return;
    }

    setFetchState({ loading: true, error: null, data: null });

    try {
      const year = selectedDate.format('YYYY');
      const month = selectedDate.format('MM');
      const day = selectedDate.format('DD');
      const url = `./data/${year}/${month}/${selectedBrand}/${day}.json`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(t('errors.noData'));
      }

      const storedData: StoredData = await response.json();

      setFetchState({
        loading: false,
        error: null,
        data: {
          rows: storedData.rows,
          lastUpdated: storedData.collectedAt,
          brand: storedData.brand,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('errors.fetchError');
      setFetchState({ loading: false, error: errorMessage, data: null });
    }
  };

  // Load data when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchData();
    }
  }, [selectedDate, selectedBrand]);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!fetchState.data) return [];

    let result = fetchState.data.rows;

    // Global search
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (row) =>
          row.model.toLowerCase().includes(search) ||
          row.trim.toLowerCase().includes(search) ||
          row.engine.toLowerCase().includes(search) ||
          row.transmission.toLowerCase().includes(search)
      );
    }

    // Model filter
    if (modelFilter) {
      result = result.filter((row) => row.model === modelFilter);
    }

    // Transmission filter
    if (transmissionFilter) {
      result = result.filter((row) => row.transmission === transmissionFilter);
    }

    // Fuel filter
    if (fuelFilter) {
      result = result.filter((row) => row.fuel === fuelFilter);
    }

    return result;
  }, [fetchState.data, searchText, modelFilter, transmissionFilter, fuelFilter]);

  // Get unique values for filters
  const modelOptions = useMemo(() => {
    if (!fetchState.data) return [];
    const models = [...new Set(fetchState.data.rows.map((row) => row.model))];
    return models.filter(Boolean).sort();
  }, [fetchState.data]);

  const transmissionOptions = useMemo(() => {
    if (!fetchState.data) return [];
    const transmissions = [...new Set(fetchState.data.rows.map((row) => row.transmission))];
    return transmissions.filter(Boolean).sort();
  }, [fetchState.data]);

  const fuelOptions = useMemo(() => {
    if (!fetchState.data) return [];
    const fuels = [...new Set(fetchState.data.rows.map((row) => row.fuel))];
    return fuels.filter(Boolean).sort();
  }, [fetchState.data]);

  // Handle favorite toggle
  const handleFavoriteToggle = (row: PriceListRow) => {
    const vehicle = createVehicleIdentifier(row.brand, row.model, row.trim, row.engine);
    if (isFavorite(vehicle.id)) {
      removeFavorite(vehicle.id);
      message.info(t('common.remove'));
    } else {
      addFavorite(vehicle);
      message.success(t('priceList.addToFavorites'));
    }
  };

  // Handle compare toggle
  const handleCompareToggle = (row: PriceListRow) => {
    const vehicle = createVehicleIdentifier(row.brand, row.model, row.trim, row.engine);
    if (isInCompare(vehicle.id)) {
      removeFromCompare(vehicle.id);
      message.info(t('common.remove'));
    } else {
      if (addToCompare(vehicle)) {
        message.success(t('priceList.addToCompare'));
      } else {
        message.warning(t('comparison.compareList.maxReached'));
      }
    }
  };

  // Handle track toggle
  const handleTrackToggle = (row: PriceListRow) => {
    const id = createVehicleId(row.brand, row.model, row.trim, row.engine);
    if (isTracked(id)) {
      removeTrackedVehicle(id);
      message.info(t('priceList.untrack'));
    } else {
      const trackedVehicle: TrackedVehicle = {
        id,
        brand: row.brand,
        model: row.model,
        trim: row.trim,
        engine: row.engine,
        lastPrice: row.priceNumeric,
        lastPriceRaw: row.priceRaw,
        lastCheckDate: new Date().toISOString(),
      };
      addTrackedVehicle(trackedVehicle);
      message.success(t('priceList.track'));
    }
  };

  // Handle trend view
  const handleViewTrend = (row: PriceListRow) => {
    setTrendVehicle(row);
    setTrendModalOpen(true);
  };

  // Handle copy link
  const handleCopyLink = async () => {
    const state: PriceListUrlState = {
      brand: selectedBrand,
      q: searchText || undefined,
      model: modelFilter || undefined,
      transmission: transmissionFilter || undefined,
      fuel: fuelFilter || undefined,
      date: selectedDate?.format('YYYY-MM-DD'),
      sort: sortInfo ? `${sortInfo.column}:${sortInfo.order === 'descend' ? 'desc' : 'asc'}` : undefined,
      page: pagination.current,
      pageSize: pagination.pageSize,
    };

    const url = getShareableUrl(state);
    const success = await copyUrlToClipboard(url);

    if (success) {
      message.success(t('priceList.linkCopied'));
    } else {
      message.error(t('errors.fetchError'));
    }
  };

  // Handle table change (pagination, sort)
  const handleTableChange = (
    newPagination: TablePaginationConfig,
    _filters: any,
    sorter: SorterResult<PriceListRow> | SorterResult<PriceListRow>[]
  ) => {
    setPagination(newPagination);

    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    if (singleSorter.column) {
      setSortInfo({
        column: singleSorter.columnKey as string,
        order: singleSorter.order || 'ascend',
      });
    }
  };

  // Table columns
  const columns: ColumnsType<PriceListRow> = [
    {
      title: t('common.model'),
      dataIndex: 'model',
      key: 'model',
      width: 150,
      fixed: 'left',
      sorter: (a, b) => a.model.localeCompare(b.model, 'tr'),
      sortOrder: sortInfo?.column === 'model' ? sortInfo.order : undefined,
      render: (text) => (
        <Text strong style={{ color: tokens.colors.accent }}>
          {text}
        </Text>
      ),
    },
    {
      title: t('common.trim'),
      dataIndex: 'trim',
      key: 'trim',
      width: 200,
      sorter: (a, b) => a.trim.localeCompare(b.trim, 'tr'),
      sortOrder: sortInfo?.column === 'trim' ? sortInfo.order : undefined,
    },
    {
      title: t('common.engine'),
      dataIndex: 'engine',
      key: 'engine',
      width: 150,
      sorter: (a, b) => a.engine.localeCompare(b.engine, 'tr'),
      sortOrder: sortInfo?.column === 'engine' ? sortInfo.order : undefined,
    },
    {
      title: t('common.transmission'),
      dataIndex: 'transmission',
      key: 'transmission',
      width: 120,
      sorter: (a, b) => a.transmission.localeCompare(b.transmission, 'tr'),
      sortOrder: sortInfo?.column === 'transmission' ? sortInfo.order : undefined,
      render: (text) =>
        text ? (
          <span
            style={{
              background: tokens.colors.gray[100],
              padding: '2px 8px',
              borderRadius: tokens.borderRadius.sm,
              fontSize: '12px',
              color: tokens.colors.gray[700],
            }}
          >
            {text}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: t('common.fuel'),
      dataIndex: 'fuel',
      key: 'fuel',
      width: 130,
      sorter: (a, b) => a.fuel.localeCompare(b.fuel, 'tr'),
      sortOrder: sortInfo?.column === 'fuel' ? sortInfo.order : undefined,
      render: (text) => {
        const fuelColors: { [key: string]: string } = {
          Benzin: tokens.colors.fuel.benzin,
          Dizel: tokens.colors.fuel.dizel,
          Elektrik: tokens.colors.fuel.elektrik,
          Hybrid: tokens.colors.fuel.hybrid,
          'Plug-in Hybrid': tokens.colors.fuel.pluginHybrid,
          CNG: tokens.colors.fuel.cng,
        };
        return text ? (
          <span
            style={{
              background: fuelColors[text] || tokens.colors.gray[400],
              color: '#fff',
              padding: '4px 12px',
              borderRadius: tokens.borderRadius.full,
              fontSize: '12px',
              fontWeight: '500',
            }}
          >
            {text}
          </span>
        ) : (
          '-'
        );
      },
    },
    {
      title: t('common.price'),
      dataIndex: 'priceRaw',
      key: 'price',
      width: 180,
      sorter: (a, b) => a.priceNumeric - b.priceNumeric,
      sortOrder: sortInfo?.column === 'price' ? sortInfo.order : undefined,
      defaultSortOrder: 'ascend',
      render: (text) => (
        <Text strong style={{ color: tokens.colors.success, fontSize: '14px' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => {
        const vehicleId = createVehicleId(record.brand, record.model, record.trim, record.engine);
        const isFav = isFavorite(vehicleId);
        const isComp = isInCompare(vehicleId);
        const isTrack = isTracked(vehicleId);

        return (
          <Space size="small">
            <Tooltip title={isFav ? t('common.remove') : t('priceList.addToFavorites')}>
              <Button
                type="text"
                size="small"
                icon={isFav ? <HeartFilled style={{ color: tokens.colors.error }} /> : <HeartOutlined />}
                onClick={() => handleFavoriteToggle(record)}
              />
            </Tooltip>
            <Tooltip
              title={
                isComp
                  ? t('common.remove')
                  : canAddToCompare()
                  ? t('priceList.addToCompare')
                  : t('comparison.compareList.maxReached')
              }
            >
              <Button
                type="text"
                size="small"
                icon={
                  isComp ? (
                    <CheckOutlined style={{ color: tokens.colors.success }} />
                  ) : (
                    <SwapOutlined />
                  )
                }
                onClick={() => handleCompareToggle(record)}
                disabled={!isComp && !canAddToCompare()}
              />
            </Tooltip>
            <Tooltip title={isTrack ? t('priceList.untrack') : t('priceList.track')}>
              <Button
                type="text"
                size="small"
                icon={
                  isTrack ? (
                    <EyeInvisibleOutlined style={{ color: tokens.colors.accent }} />
                  ) : (
                    <EyeOutlined />
                  )
                }
                onClick={() => handleTrackToggle(record)}
              />
            </Tooltip>
            <Tooltip title={t('priceList.viewTrend')}>
              <Button
                type="text"
                size="small"
                icon={<LineChartOutlined />}
                onClick={() => handleViewTrend(record)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // Export handlers
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      message.warning(t('common.noData'));
      return;
    }
    exportToCSV(filteredData);
    message.success(t('priceList.export.csv'));
  };

  const handleExportXLSX = () => {
    if (filteredData.length === 0) {
      message.warning(t('common.noData'));
      return;
    }
    exportToXLSX(filteredData);
    message.success(t('priceList.export.excel'));
  };

  const handleCopyMarkdown = async () => {
    if (filteredData.length === 0) {
      message.warning(t('common.noData'));
      return;
    }
    const success = await copyAsMarkdown(filteredData);
    if (success) {
      message.success(t('priceList.export.markdown'));
    } else {
      message.error(t('errors.fetchError'));
    }
  };

  // Clear filters on brand change
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSearchText('');
    setModelFilter(null);
    setTransmissionFilter(null);
    setFuelFilter(null);
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
          {t('priceList.title')}
        </Title>
        <Text type="secondary">
          {fetchState.data
            ? `${filteredData.length} ${t('common.records')}`
            : t('common.loading')}
        </Text>
      </motion.div>

      {/* Controls */}
      <motion.div
        variants={staggerItem}
        style={{
          background: tokens.colors.surface,
          padding: tokens.spacing.lg,
          borderRadius: tokens.borderRadius.lg,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <Space wrap size="middle">
          <div>
            <Text strong style={{ marginRight: 8, color: tokens.colors.gray[600] }}>
              {t('common.brand')}:
            </Text>
            <Select
              value={selectedBrand}
              onChange={handleBrandChange}
              style={{ width: 180 }}
              size="large"
              options={BRANDS.map((b) => ({ label: b.name, value: b.id }))}
            />
          </div>
          <div>
            <Text strong style={{ marginRight: 8, color: tokens.colors.gray[600] }}>
              <CalendarOutlined /> {t('common.date')}:
            </Text>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              size="large"
              format="DD/MM/YYYY"
              placeholder={t('common.date')}
              disabledDate={(current) => {
                const dateStr = current.format('YYYY-MM-DD');
                return !availableDates.includes(dateStr);
              }}
              style={{ width: 150 }}
            />
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={fetchState.loading}
            size="large"
            type="primary"
            disabled={!selectedDate}
          >
            {t('common.refresh')}
          </Button>
          <Tooltip title={t('priceList.copyLink')}>
            <Button
              icon={<LinkOutlined />}
              onClick={handleCopyLink}
              size="large"
            >
              {t('priceList.copyLink')}
            </Button>
          </Tooltip>
        </Space>

        {fetchState.data?.lastUpdated && (
          <div style={{ marginTop: tokens.spacing.md }}>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              {t('priceList.dataDate')}: {dayjs(fetchState.data.lastUpdated).format('DD/MM/YYYY HH:mm')}
            </Text>
          </div>
        )}
      </motion.div>

      {/* Error */}
      {fetchState.error && (
        <motion.div variants={staggerItem}>
          <Alert
            message={t('common.error')}
            description={fetchState.error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: tokens.spacing.lg }}
            action={
              <Button size="small" onClick={fetchData}>
                {t('errors.tryAgain')}
              </Button>
            }
          />
        </motion.div>
      )}

      {/* Loading */}
      {fetchState.loading && (
        <motion.div
          variants={staggerItem}
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: tokens.spacing['2xl'],
          }}
        >
          <Spin size="large" />
        </motion.div>
      )}

      {/* Data loaded */}
      {!fetchState.loading && fetchState.data && (
        <>
          {/* Filters */}
          <motion.div
            variants={staggerItem}
            style={{
              background: tokens.colors.surface,
              padding: tokens.spacing.lg,
              borderRadius: tokens.borderRadius.lg,
              marginBottom: tokens.spacing.lg,
            }}
          >
            <Text strong style={{ display: 'block', marginBottom: tokens.spacing.sm }}>
              {t('priceList.filters.title')}
            </Text>
            <Space wrap size="middle">
              <Search
                placeholder={t('priceList.filters.searchPlaceholder')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                size="large"
                prefix={<SearchOutlined />}
                allowClear
              />
              <Select
                placeholder={t('priceList.filters.selectModel')}
                value={modelFilter}
                onChange={setModelFilter}
                style={{ width: 180 }}
                size="large"
                allowClear
                options={modelOptions.map((m) => ({ label: m, value: m }))}
              />
              <Select
                placeholder={t('priceList.filters.selectTransmission')}
                value={transmissionFilter}
                onChange={setTransmissionFilter}
                style={{ width: 150 }}
                size="large"
                allowClear
                options={transmissionOptions.map((tr) => ({ label: tr, value: tr }))}
              />
              <Select
                placeholder={t('priceList.filters.selectFuel')}
                value={fuelFilter}
                onChange={setFuelFilter}
                style={{ width: 150 }}
                size="large"
                allowClear
                options={fuelOptions.map((f) => ({ label: f, value: f }))}
              />
            </Space>
          </motion.div>

          {/* Export buttons */}
          <motion.div
            variants={staggerItem}
            style={{
              background: tokens.colors.surface,
              padding: tokens.spacing.lg,
              borderRadius: tokens.borderRadius.lg,
              marginBottom: tokens.spacing.lg,
              borderLeft: `4px solid ${tokens.colors.accent}`,
            }}
          >
            <Text strong style={{ display: 'block', marginBottom: tokens.spacing.sm }}>
              {t('priceList.export.title')}
            </Text>
            <Space wrap size="middle">
              <Button icon={<DownloadOutlined />} onClick={handleExportCSV} size="large">
                {t('priceList.export.csv')}
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportXLSX} size="large">
                {t('priceList.export.excel')}
              </Button>
              <Button icon={<CopyOutlined />} onClick={handleCopyMarkdown} size="large">
                {t('priceList.export.markdown')}
              </Button>
            </Space>
          </motion.div>

          {/* Table */}
          <motion.div
            variants={tableRowVariants}
            style={{
              background: '#fff',
              borderRadius: tokens.borderRadius.lg,
              overflow: 'hidden',
              boxShadow: tokens.shadows.sm,
            }}
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey={(record) => `${record.brand}-${record.model}-${record.trim}-${record.engine || 'std'}-${record.transmission || 'auto'}-${record.priceNumeric}`}
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 1200, y: 600 }}
              size="middle"
              virtual
            />
          </motion.div>
        </>
      )}

      {/* Trend Modal */}
      <PriceTrendModal
        open={trendModalOpen}
        onClose={() => setTrendModalOpen(false)}
        vehicle={trendVehicle}
      />
    </motion.div>
  );
}
