import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Input,
  Select,
  Button,
  Alert,
  Spin,
  Space,
  Typography,
  Card,
  message,
} from 'antd';
import {
  DownloadOutlined,
  CopyOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

import { PriceListRow, FetchState } from './types';
import { BRANDS, getBrandById } from './config/brands';
import { fetchWithTimeout } from './utils/fetch';
import { parseData } from './utils/parse';
import { exportToCSV, exportToXLSX, copyAsMarkdown } from './utils/export';

const { Title, Text } = Typography;
const { Search } = Input;

function App() {
  const [selectedBrand, setSelectedBrand] = useState<string>(BRANDS[0].id);
  const [fetchState, setFetchState] = useState<FetchState>({
    loading: false,
    error: null,
    data: null,
  });

  // Filters
  const [searchText, setSearchText] = useState('');
  const [modelFilter, setModelFilter] = useState<string | null>(null);
  const [transmissionFilter, setTransmissionFilter] = useState<string | null>(null);

  // Table state
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total) => `Toplam ${total} kayıt`,
  });

  // Fetch data
  const fetchData = async () => {
    const brand = getBrandById(selectedBrand);
    if (!brand) return;

    setFetchState({ loading: true, error: null, data: null });

    try {
      const jsonData = await fetchWithTimeout(brand.url);
      const parsedData = parseData(jsonData, brand.name, brand.parser, brand.url);

      if (parsedData.rows.length === 0) {
        throw new Error('Veri bulunamadı');
      }

      setFetchState({ loading: false, error: null, data: parsedData });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Veri yüklenirken bir hata oluştu';
      setFetchState({ loading: false, error: errorMessage, data: null });
    }
  };

  // Load data on brand change
  useEffect(() => {
    fetchData();
    // Reset filters when brand changes
    setSearchText('');
    setModelFilter(null);
    setTransmissionFilter(null);
  }, [selectedBrand]);

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

    return result;
  }, [fetchState.data, searchText, modelFilter, transmissionFilter]);

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

  // Table columns
  const columns: ColumnsType<PriceListRow> = [
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: 'Donanım',
      dataIndex: 'trim',
      key: 'trim',
      width: 200,
    },
    {
      title: 'Motor',
      dataIndex: 'engine',
      key: 'engine',
      width: 150,
    },
    {
      title: 'Şanzıman',
      dataIndex: 'transmission',
      key: 'transmission',
      width: 120,
    },
    {
      title: 'Yakıt',
      dataIndex: 'fuel',
      key: 'fuel',
      width: 100,
    },
    {
      title: 'Fiyat',
      dataIndex: 'priceRaw',
      key: 'price',
      width: 150,
      sorter: (a, b) => a.priceNumeric - b.priceNumeric,
      defaultSortOrder: 'ascend',
    },
  ];

  // Export handlers
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      message.warning('Dışa aktarılacak veri yok');
      return;
    }
    exportToCSV(filteredData);
    message.success('CSV dosyası indirildi');
  };

  const handleExportXLSX = () => {
    if (filteredData.length === 0) {
      message.warning('Dışa aktarılacak veri yok');
      return;
    }
    exportToXLSX(filteredData);
    message.success('Excel dosyası indirildi');
  };

  const handleCopyMarkdown = async () => {
    if (filteredData.length === 0) {
      message.warning('Kopyalanacak veri yok');
      return;
    }
    const success = await copyAsMarkdown(filteredData);
    if (success) {
      message.success('Markdown tablosu panoya kopyalandı');
    } else {
      message.error('Kopyalama başarısız');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div>
            <Title level={2}>Fiyat Listesi Görüntüleyici</Title>
            <Space>
              <Text>Marka:</Text>
              <Select
                value={selectedBrand}
                onChange={setSelectedBrand}
                style={{ width: 200 }}
                options={BRANDS.map((b) => ({ label: b.name, value: b.id }))}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchData}
                loading={fetchState.loading}
              >
                Yenile
              </Button>
            </Space>
            {fetchState.data?.lastUpdated && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Son güncelleme: {fetchState.data.lastUpdated}</Text>
              </div>
            )}
          </div>

          {/* Error */}
          {fetchState.error && (
            <Alert
              message="Hata"
              description={fetchState.error}
              type="error"
              showIcon
              closable
            />
          )}

          {/* Loading */}
          {fetchState.loading && (
            <Spin tip="Veriler yükleniyor..." size="large">
              <div style={{ padding: '40px' }} />
            </Spin>
          )}

          {/* Data loaded */}
          {!fetchState.loading && fetchState.data && (
            <>
              {/* Filters */}
              <Space wrap>
                <Search
                  placeholder="Model, donanım, motor, şanzıman ara..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                  allowClear
                />
                <Select
                  placeholder="Model"
                  value={modelFilter}
                  onChange={setModelFilter}
                  style={{ width: 180 }}
                  allowClear
                  options={modelOptions.map((m) => ({ label: m, value: m }))}
                />
                <Select
                  placeholder="Şanzıman"
                  value={transmissionFilter}
                  onChange={setTransmissionFilter}
                  style={{ width: 150 }}
                  allowClear
                  options={transmissionOptions.map((t) => ({ label: t, value: t }))}
                />
              </Space>

              {/* Export buttons */}
              <Space wrap>
                <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
                  CSV İndir
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handleExportXLSX}>
                  Excel İndir
                </Button>
                <Button icon={<CopyOutlined />} onClick={handleCopyMarkdown}>
                  Markdown Kopyala
                </Button>
              </Space>

              {/* Table */}
              <Table
                columns={columns}
                dataSource={filteredData}
                rowKey={(record, index) => `${record.model}-${record.trim}-${index}`}
                pagination={pagination}
                onChange={(newPagination) => setPagination(newPagination)}
                scroll={{ x: 1000 }}
                size="small"
              />
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}

export default App;
