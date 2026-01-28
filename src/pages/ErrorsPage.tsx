/**
 * Errors Page - Displays system errors from data collection and generation
 */
import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Typography,
  Tag,
  Space,
  Statistic,
  Empty,
  Spin,
  Alert,
  Badge,
  Tooltip,
  Button,
  Modal,
} from 'antd';
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  BugOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;

interface SystemError {
  id: string;
  timestamp: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  source: string;
  brand?: string;
  brandId?: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  recovered: boolean;
  recoveryMethod?: string;
}

interface ErrorLog {
  generatedAt: string;
  clearedAt: string;
  errors: SystemError[];
  summary: {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    bySource: Record<string, number>;
  };
}

const severityConfig = {
  error: { color: 'red', icon: <ExclamationCircleOutlined />, label: 'Hata' },
  warning: { color: 'orange', icon: <WarningOutlined />, label: 'Uyari' },
  info: { color: 'blue', icon: <InfoCircleOutlined />, label: 'Bilgi' },
};

const categoryLabels: Record<string, string> = {
  HTTP_ERROR: 'HTTP Hatasi',
  PARSE_ERROR: 'Parse Hatasi',
  VALIDATION_ERROR: 'Dogrulama Hatasi',
  FILE_ERROR: 'Dosya Hatasi',
  DATA_QUALITY_ERROR: 'Veri Kalitesi',
};

const sourceLabels: Record<string, string> = {
  collection: 'Veri Toplama',
  generation: 'Uretim',
  health: 'Saglik Kontrolu',
  frontend: 'Arayuz',
};

export default function ErrorsPage() {
  const [loading, setLoading] = useState(true);
  const [errorLog, setErrorLog] = useState<ErrorLog | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<SystemError | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const loadErrors = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('./data/errors.json');
      if (response.ok) {
        const data = await response.json();
        setErrorLog(data);
      } else if (response.status === 404) {
        // No errors file yet - that's OK
        setErrorLog({
          generatedAt: new Date().toISOString(),
          clearedAt: new Date().toISOString(),
          errors: [],
          summary: {
            total: 0,
            byCategory: {},
            bySeverity: {},
            bySource: {},
          },
        });
      } else {
        setFetchError('Hata loglari yuklenemedi');
      }
    } catch (error) {
      setFetchError('Hata loglari yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadErrors();
  }, []);

  const showDetails = (record: SystemError) => {
    setSelectedError(record);
    setDetailsModalVisible(true);
  };

  const columns: ColumnsType<SystemError> = [
    {
      title: 'Zaman',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => {
        const date = new Date(timestamp);
        return (
          <Tooltip title={date.toISOString()}>
            <Space size={4}>
              <ClockCircleOutlined style={{ color: '#999' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {date.toLocaleDateString('tr-TR')} {date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Space>
          </Tooltip>
        );
      },
      sorter: (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Seviye',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: 'error' | 'warning' | 'info') => {
        const config = severityConfig[severity];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
      filters: [
        { text: 'Hata', value: 'error' },
        { text: 'Uyari', value: 'warning' },
        { text: 'Bilgi', value: 'info' },
      ],
      onFilter: (value, record) => record.severity === value,
    },
    {
      title: 'Kategori',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: string) => (
        <Tag>{categoryLabels[category] || category}</Tag>
      ),
      filters: Object.entries(categoryLabels).map(([key, label]) => ({ text: label, value: key })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Kaynak',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: string) => (
        <Text type="secondary">{sourceLabels[source] || source}</Text>
      ),
      filters: Object.entries(sourceLabels).map(([key, label]) => ({ text: label, value: key })),
      onFilter: (value, record) => record.source === value,
    },
    {
      title: 'Kod',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (code: string) => (
        <Text code style={{ fontSize: 11 }}>{code}</Text>
      ),
    },
    {
      title: 'Mesaj',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string, record: SystemError) => (
        <Space direction="vertical" size={0}>
          <Text ellipsis={{ tooltip: message }}>{message}</Text>
          {record.recovered && (
            <Tag color="green" style={{ marginTop: 4 }}>
              <CheckCircleOutlined /> Kurtarildi
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Marka',
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
      render: (brand?: string) => brand || '-',
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => showDetails(record)}>
          Detay
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Hatalar yukleniyor..." />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Yukleme Hatasi"
          description={fetchError}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={loadErrors}>
              Tekrar Dene
            </Button>
          }
        />
      </div>
    );
  }

  const errors = errorLog?.errors || [];
  const summary = errorLog?.summary || { total: 0, byCategory: {}, bySeverity: {}, bySource: {} };

  return (
    <div style={{ padding: '24px 24px 80px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space align="center">
            <BugOutlined style={{ fontSize: 28, color: '#1890ff' }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Sistem Hatalari
              </Title>
              <Text type="secondary">
                Script ve veri isleme hatalari
              </Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={loadErrors}>
            Yenile
          </Button>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Toplam"
              value={summary.total}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Hatalar"
              value={summary.bySeverity?.error || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Uyarilar"
              value={summary.bySeverity?.warning || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Bilgi"
              value={summary.bySeverity?.info || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Category breakdown */}
      {Object.keys(summary.byCategory).length > 0 && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Text type="secondary">Kategoriler:</Text>
            {Object.entries(summary.byCategory).map(([cat, count]) => (
              <Badge key={cat} count={count} showZero>
                <Tag>{categoryLabels[cat] || cat}</Tag>
              </Badge>
            ))}
          </Space>
        </Card>
      )}

      {/* Last update info */}
      {errorLog && (
        <Alert
          message={
            <Space>
              <Text type="secondary">
                Son guncelleme: {new Date(errorLog.generatedAt).toLocaleString('tr-TR')}
              </Text>
              <Text type="secondary">|</Text>
              <Text type="secondary">
                Temizlenme: {new Date(errorLog.clearedAt).toLocaleString('tr-TR')}
              </Text>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Errors Table */}
      {errors.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" align="center">
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <Text>Hata bulunamadi</Text>
                <Text type="secondary">Sistem sorunsuz calisiyor</Text>
              </Space>
            }
          />
        </Card>
      ) : (
        <Card bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={errors}
            rowKey="id"
            size="small"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} hata`,
            }}
            scroll={{ x: 1000 }}
          />
        </Card>
      )}

      {/* Error Details Modal */}
      <Modal
        title={
          <Space>
            {selectedError && severityConfig[selectedError.severity]?.icon}
            <span>Hata Detaylari</span>
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedError && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">Kod:</Text>
                <br />
                <Text code>{selectedError.code}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Zaman:</Text>
                <br />
                <Text>{new Date(selectedError.timestamp).toLocaleString('tr-TR')}</Text>
              </Col>
            </Row>

            <div>
              <Text type="secondary">Mesaj:</Text>
              <Paragraph style={{ marginTop: 4 }}>{selectedError.message}</Paragraph>
            </div>

            {selectedError.brand && (
              <div>
                <Text type="secondary">Marka:</Text>
                <br />
                <Text>{selectedError.brand} ({selectedError.brandId})</Text>
              </div>
            )}

            {selectedError.recovered && (
              <Alert
                message="Bu hata kurtarildi"
                description={selectedError.recoveryMethod}
                type="success"
                showIcon
              />
            )}

            {selectedError.details && Object.keys(selectedError.details).length > 0 && (
              <div>
                <Text type="secondary">Detaylar:</Text>
                <pre style={{
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 4,
                  fontSize: 12,
                  overflow: 'auto',
                  maxHeight: 200,
                }}>
                  {JSON.stringify(selectedError.details, null, 2)}
                </pre>
              </div>
            )}

            {selectedError.stack && (
              <div>
                <Text type="secondary">Stack Trace:</Text>
                <pre style={{
                  background: '#fff1f0',
                  padding: 12,
                  borderRadius: 4,
                  fontSize: 11,
                  overflow: 'auto',
                  maxHeight: 200,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {selectedError.stack}
                </pre>
              </div>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
}
