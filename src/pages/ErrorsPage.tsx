/**
 * Errors Page - Displays system errors from data collection and generation
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

// Helper function to get localized date/time based on language
const getLocaleDateOptions = (language: string) => ({
  locale: language === 'tr' ? 'tr-TR' : 'en-US',
});

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

const severityIcons = {
  error: <ExclamationCircleOutlined />,
  warning: <WarningOutlined />,
  info: <InfoCircleOutlined />,
};

const severityColors = {
  error: 'red',
  warning: 'orange',
  info: 'blue',
};

export default function ErrorsPage() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [errorLog, setErrorLog] = useState<ErrorLog | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<SystemError | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const { locale } = getLocaleDateOptions(i18n.language);

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
        setFetchError(t('errors.fetchError'));
      }
    } catch (error) {
      setFetchError(t('errors.fetchError'));
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

  const categoryKeys = ['HTTP_ERROR', 'PARSE_ERROR', 'VALIDATION_ERROR', 'FILE_ERROR', 'DATA_QUALITY_ERROR'];
  const sourceKeys = ['collection', 'generation', 'health', 'frontend'];

  const columns: ColumnsType<SystemError> = [
    {
      title: t('systemErrors.time'),
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
                {date.toLocaleDateString(locale)} {date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Space>
          </Tooltip>
        );
      },
      sorter: (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      defaultSortOrder: 'ascend',
    },
    {
      title: t('systemErrors.severity'),
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: 'error' | 'warning' | 'info') => (
        <Tag color={severityColors[severity]} icon={severityIcons[severity]}>
          {t(`systemErrors.severityLabels.${severity}`)}
        </Tag>
      ),
      filters: [
        { text: t('systemErrors.severityLabels.error'), value: 'error' },
        { text: t('systemErrors.severityLabels.warning'), value: 'warning' },
        { text: t('systemErrors.severityLabels.info'), value: 'info' },
      ],
      onFilter: (value, record) => record.severity === value,
    },
    {
      title: t('systemErrors.category'),
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: string) => (
        <Tag>{t(`systemErrors.categoryLabels.${category}`, category)}</Tag>
      ),
      filters: categoryKeys.map(key => ({ text: t(`systemErrors.categoryLabels.${key}`), value: key })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: t('systemErrors.source'),
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: string) => (
        <Text type="secondary">{t(`systemErrors.sourceLabels.${source}`, source)}</Text>
      ),
      filters: sourceKeys.map(key => ({ text: t(`systemErrors.sourceLabels.${key}`), value: key })),
      onFilter: (value, record) => record.source === value,
    },
    {
      title: t('systemErrors.code'),
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (code: string) => (
        <Text code style={{ fontSize: 11 }}>{code}</Text>
      ),
    },
    {
      title: t('systemErrors.message'),
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string, record: SystemError) => (
        <Space direction="vertical" size={0}>
          <Text ellipsis={{ tooltip: message }}>{message}</Text>
          {record.recovered && (
            <Tag color="green" style={{ marginTop: 4 }}>
              <CheckCircleOutlined /> {t('systemErrors.recovered')}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('systemErrors.brand'),
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
          {t('systemErrors.details')}
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip={t('common.loading')} />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message={t('common.error')}
          description={fetchError}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={loadErrors}>
              {t('errors.tryAgain')}
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
                {t('systemErrors.title')}
              </Title>
              <Text type="secondary">
                {t('systemErrors.subtitle')}
              </Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={loadErrors}>
            {t('systemErrors.refresh')}
          </Button>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('systemErrors.total')}
              value={summary.total}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('systemErrors.errors')}
              value={summary.bySeverity?.error || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('systemErrors.warnings')}
              value={summary.bySeverity?.warning || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={t('systemErrors.info')}
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
            <Text type="secondary">{t('systemErrors.categories')}:</Text>
            {Object.entries(summary.byCategory).map(([cat, count]) => (
              <Badge key={cat} count={count} showZero>
                <Tag>{t(`systemErrors.categoryLabels.${cat}`, cat)}</Tag>
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
                {t('systemErrors.lastUpdate')}: {new Date(errorLog.generatedAt).toLocaleString(locale)}
              </Text>
              <Text type="secondary">|</Text>
              <Text type="secondary">
                {t('systemErrors.cleared')}: {new Date(errorLog.clearedAt).toLocaleString(locale)}
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
                <Text>{t('systemErrors.noErrors')}</Text>
                <Text type="secondary">{t('systemErrors.systemRunning')}</Text>
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
              showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} ${t('systemErrors.errors').toLowerCase()}`,
            }}
            scroll={{ x: 1000 }}
          />
        </Card>
      )}

      {/* Error Details Modal */}
      <Modal
        title={
          <Space>
            {selectedError && severityIcons[selectedError.severity]}
            <span>{t('systemErrors.errorDetails')}</span>
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
                <Text type="secondary">{t('systemErrors.code')}:</Text>
                <br />
                <Text code>{selectedError.code}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">{t('systemErrors.time')}:</Text>
                <br />
                <Text>{new Date(selectedError.timestamp).toLocaleString(locale)}</Text>
              </Col>
            </Row>

            <div>
              <Text type="secondary">{t('systemErrors.message')}:</Text>
              <Paragraph style={{ marginTop: 4 }}>{selectedError.message}</Paragraph>
            </div>

            {selectedError.brand && (
              <div>
                <Text type="secondary">{t('systemErrors.brand')}:</Text>
                <br />
                <Text>{selectedError.brand} ({selectedError.brandId})</Text>
              </div>
            )}

            {selectedError.recovered && (
              <Alert
                message={t('systemErrors.recovered')}
                description={selectedError.recoveryMethod}
                type="success"
                showIcon
              />
            )}

            {selectedError.details && Object.keys(selectedError.details).length > 0 && (
              <div>
                <Text type="secondary">{t('systemErrors.details')}:</Text>
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
                <Text type="secondary">{t('systemErrors.stackTrace')}:</Text>
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
