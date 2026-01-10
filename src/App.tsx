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
    pageSize: 100,
    showSizeChanger: true,
    pageSizeOptions: ['50', '100', '200', '500'],
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
      sorter: (a, b) => a.model.localeCompare(b.model, 'tr'),
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>,
    },
    {
      title: 'Donanım',
      dataIndex: 'trim',
      key: 'trim',
      width: 200,
      sorter: (a, b) => a.trim.localeCompare(b.trim, 'tr'),
    },
    {
      title: 'Motor',
      dataIndex: 'engine',
      key: 'engine',
      width: 150,
      sorter: (a, b) => a.engine.localeCompare(b.engine, 'tr'),
    },
    {
      title: 'Şanzıman',
      dataIndex: 'transmission',
      key: 'transmission',
      width: 120,
      sorter: (a, b) => a.transmission.localeCompare(b.transmission, 'tr'),
      render: (text) => text ? <span style={{
        background: '#f0f5ff',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#1890ff'
      }}>{text}</span> : '-',
    },
    {
      title: 'Yakıt',
      dataIndex: 'fuel',
      key: 'fuel',
      width: 130,
      sorter: (a, b) => a.fuel.localeCompare(b.fuel, 'tr'),
      render: (text) => {
        const colors: { [key: string]: string } = {
          'Benzin': '#ff4d4f',
          'Dizel': '#52c41a',
          'Elektrik': '#1890ff',
          'Plug-in Hybrid': '#722ed1',
          'CNG': '#faad14',
        };
        return text ? <span style={{
          background: colors[text] || '#f0f0f0',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}>{text}</span> : '-';
      },
    },
    {
      title: 'Fiyat',
      dataIndex: 'priceRaw',
      key: 'price',
      width: 180,
      sorter: (a, b) => a.priceNumeric - b.priceNumeric,
      defaultSortOrder: 'ascend',
      render: (text) => <Text strong style={{
        color: '#52c41a',
        fontSize: '14px'
      }}>{text}</Text>,
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <Card
          style={{
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div style={{
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '24px',
              marginBottom: '8px'
            }}>
              <Title
                level={2}
                style={{
                  margin: 0,
                  marginBottom: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '32px',
                  fontWeight: '700'
                }}
              >
                🚗 Otomobil Fiyat Listesi
              </Title>
              <Space wrap size="middle">
                <div>
                  <Text strong style={{ marginRight: 8, color: '#666' }}>Marka:</Text>
                  <Select
                    value={selectedBrand}
                    onChange={setSelectedBrand}
                    style={{ width: 200 }}
                    size="large"
                    options={BRANDS.map((b) => ({ label: b.name, value: b.id }))}
                  />
                </div>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchData}
                  loading={fetchState.loading}
                  size="large"
                  type="primary"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                >
                  Yenile
                </Button>
              </Space>
              {fetchState.data?.lastUpdated && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    📅 Son güncelleme: {fetchState.data.lastUpdated}
                  </Text>
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
              <div style={{
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                padding: '20px',
                borderRadius: '12px',
                marginTop: '8px'
              }}>
                <Text strong style={{ display: 'block', marginBottom: '12px', color: '#333' }}>
                  🔍 Filtreler
                </Text>
                <Space wrap size="middle">
                  <Search
                    placeholder="Model, donanım, motor ara..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                    size="large"
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                  <Select
                    placeholder="Model Seç"
                    value={modelFilter}
                    onChange={setModelFilter}
                    style={{ width: 180 }}
                    size="large"
                    allowClear
                    options={modelOptions.map((m) => ({ label: m, value: m }))}
                  />
                  <Select
                    placeholder="Şanzıman"
                    value={transmissionFilter}
                    onChange={setTransmissionFilter}
                    style={{ width: 150 }}
                    size="large"
                    allowClear
                    options={transmissionOptions.map((t) => ({ label: t, value: t }))}
                  />
                </Space>
              </div>

              {/* Export buttons */}
              <div style={{
                background: 'rgba(102, 126, 234, 0.08)',
                padding: '16px 20px',
                borderRadius: '12px',
                borderLeft: '4px solid #667eea'
              }}>
                <Text strong style={{ display: 'block', marginBottom: '12px', color: '#667eea' }}>
                  📥 Dışa Aktar
                </Text>
                <Space wrap size="middle">
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExportCSV}
                    size="large"
                    style={{
                      borderRadius: '8px',
                      borderColor: '#667eea',
                      color: '#667eea'
                    }}
                  >
                    CSV İndir
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExportXLSX}
                    size="large"
                    style={{
                      borderRadius: '8px',
                      borderColor: '#52c41a',
                      color: '#52c41a'
                    }}
                  >
                    Excel İndir
                  </Button>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={handleCopyMarkdown}
                    size="large"
                    style={{
                      borderRadius: '8px',
                      borderColor: '#722ed1',
                      color: '#722ed1'
                    }}
                  >
                    Markdown Kopyala
                  </Button>
                </Space>
              </div>

              {/* Table */}
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <Table
                  columns={columns}
                  dataSource={filteredData}
                  rowKey={(record, index) => `${record.model}-${record.trim}-${index}`}
                  pagination={pagination}
                  onChange={(newPagination) => setPagination(newPagination)}
                  scroll={{ x: 1000 }}
                  size="middle"
                  style={{
                    borderRadius: '12px'
                  }}
                />
              </div>
            </>
          )}
        </Space>
      </Card>
      </div>
    </div>
  );
}

export default App;
