// Alerts Page - Rule-based alert builder and management
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Card,
  Tabs,
  Empty,
  Button,
  Row,
  Col,
  Statistic,
  List,
  Switch,
  Tag,
  Space,
  Form,
  Input,
  Select,
  InputNumber,
  Divider,
  message,
  Popconfirm,
} from 'antd';
import {
  AlertOutlined,
  PlusOutlined,
  BellOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';

import { useAppStore, AlertCondition, AlertRule } from '../store';
import { tokens } from '../theme/tokens';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

// Field and operator keys (labels come from i18n)
const FIELD_KEYS = ['brand', 'model', 'price', 'priceChange'];
const TEXT_OPERATOR_KEYS = ['eq', 'neq', 'contains'];
const NUMBER_OPERATOR_KEYS = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte'];

function getOperatorKeysForField(field: string) {
  if (field === 'price' || field === 'priceChange') {
    return NUMBER_OPERATOR_KEYS;
  }
  return TEXT_OPERATOR_KEYS;
}

function isNumericField(field: string) {
  return field === 'price' || field === 'priceChange';
}

interface ConditionFormValues {
  field: AlertCondition['field'];
  operator: AlertCondition['operator'];
  value: string | number;
}

interface RuleFormValues {
  name: string;
  conditions: ConditionFormValues[];
}

export default function AlertsPage() {
  const { t, i18n } = useTranslation();
  const { alertRules, triggeredAlerts, addAlertRule, updateAlertRule, removeAlertRule, clearTriggeredAlerts } = useAppStore();
  const [activeTab, setActiveTab] = useState('rules');
  const [form] = Form.useForm<RuleFormValues>();

  const enabledRules = alertRules.filter((r) => r.enabled).length;

  const handleCreateRule = useCallback((values: RuleFormValues) => {
    const newRule: AlertRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: values.name,
      enabled: true,
      conditions: values.conditions.map((c) => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
      })),
      createdAt: new Date().toISOString(),
    };

    addAlertRule(newRule);
    message.success(t('alertsV2.ruleCreated', 'Kural başarıyla oluşturuldu'));
    form.resetFields();
    setActiveTab('rules');
  }, [addAlertRule, form, t]);

  const handleDeleteRule = useCallback((id: string) => {
    removeAlertRule(id);
    message.success(t('alertsV2.ruleDeleted', 'Kural silindi'));
  }, [removeAlertRule, t]);

  const formatCondition = (condition: AlertCondition): string => {
    const fieldLabel = t(`alertsV2.fieldOptions.${condition.field}`, condition.field);
    const operatorLabel = t(`alertsV2.operators.${condition.operator}`, condition.operator);

    let valueStr = String(condition.value);
    if (condition.field === 'price') {
      valueStr = new Intl.NumberFormat(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(Number(condition.value));
    } else if (condition.field === 'priceChange') {
      valueStr = `${condition.value}%`;
    }

    return `${fieldLabel} ${operatorLabel} ${valueStr}`;
  };

  const tabItems = [
    {
      key: 'rules',
      label: (
        <Space>
          <AlertOutlined />
          {t('alertsV2.myRules', 'Kurallarım')} ({alertRules.length})
        </Space>
      ),
      children:
        alertRules.length > 0 ? (
          <List
            dataSource={alertRules}
            renderItem={(rule) => (
              <List.Item
                actions={[
                  <Switch
                    key="toggle"
                    checked={rule.enabled}
                    onChange={(checked) => updateAlertRule(rule.id, { enabled: checked })}
                    checkedChildren={t('alertsV2.active')}
                    unCheckedChildren={t('alertsV2.inactive')}
                  />,
                  <Popconfirm
                    key="delete"
                    title={t('alertsV2.confirmDelete', 'Bu kuralı silmek istediğinize emin misiniz?')}
                    onConfirm={() => handleDeleteRule(rule.id)}
                    okText={t('common.yes', 'Evet')}
                    cancelText={t('common.no', 'Hayır')}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                    >
                      {t('common.remove', 'Kaldır')}
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{rule.name}</Text>
                      {rule.enabled ? (
                        <Tag color="green">{t('alertsV2.active', 'Aktif')}</Tag>
                      ) : (
                        <Tag>{t('alertsV2.inactive', 'Pasif')}</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      {rule.conditions.map((condition, idx) => (
                        <Tag key={idx} style={{ marginBottom: 4 }}>
                          {formatCondition(condition)}
                        </Tag>
                      ))}
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {t('alertsV2.createdAt', 'Oluşturulma')}: {new Date(rule.createdAt).toLocaleDateString('tr-TR')}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description={t('alertsV2.noRules', 'Henüz kural oluşturulmamış')}
            style={{ padding: tokens.spacing.xl }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setActiveTab('create')}>
              {t('alertsV2.createRule', 'Kural Oluştur')}
            </Button>
          </Empty>
        ),
    },
    {
      key: 'create',
      label: (
        <Space>
          <PlusOutlined />
          {t('alertsV2.createRule', 'Kural Oluştur')}
        </Space>
      ),
      children: (
        <div style={{ maxWidth: 600 }}>
          <Paragraph type="secondary" style={{ marginBottom: tokens.spacing.md }}>
            {t('alertsV2.builderDesc', 'Fiyat değişikliklerini takip etmek için özel kurallar oluşturun. Koşullar sağlandığında bildirim alın.')}
          </Paragraph>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateRule}
            initialValues={{
              conditions: [{ field: 'brand', operator: 'eq', value: '' }],
            }}
          >
            <Form.Item
              name="name"
              label={t('alertsV2.ruleName', 'Kural Adı')}
              rules={[
                { required: true, message: t('alertsV2.ruleNameRequired', 'Kural adı gerekli') },
                { min: 3, message: t('alertsV2.ruleNameMin', 'En az 3 karakter') },
              ]}
            >
              <Input placeholder={t('alertsV2.ruleNamePlaceholder', 'Örn: Toyota fiyat artışı')} />
            </Form.Item>

            <Divider orientation="left">{t('alertsV2.conditions', 'Koşullar')}</Divider>

            <Form.List name="conditions">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      size="small"
                      style={{ marginBottom: tokens.spacing.sm, backgroundColor: tokens.colors.gray[50] }}
                    >
                      <Row gutter={[8, 8]} align="middle">
                        <Col xs={24} sm={7}>
                          <Form.Item
                            {...restField}
                            name={[name, 'field']}
                            rules={[{ required: true, message: t('alertsV2.selectField', 'Alan seçin') }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select placeholder={t('alertsV2.field', 'Alan')}>
                              {FIELD_KEYS.map((key) => (
                                <Option key={key} value={key}>
                                  {t(`alertsV2.fieldOptions.${key}`)}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={7}>
                          <Form.Item noStyle shouldUpdate={(prev, curr) =>
                            prev.conditions?.[name]?.field !== curr.conditions?.[name]?.field
                          }>
                            {({ getFieldValue }) => {
                              const field = getFieldValue(['conditions', name, 'field']) || 'brand';
                              const operatorKeys = getOperatorKeysForField(field);
                              return (
                                <Form.Item
                                  {...restField}
                                  name={[name, 'operator']}
                                  rules={[{ required: true, message: t('alertsV2.selectOperator', 'Operatör seçin') }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Select placeholder={t('alertsV2.operator', 'Operatör')}>
                                    {operatorKeys.map((key) => (
                                      <Option key={key} value={key}>
                                        {t(`alertsV2.operators.${key}`)}
                                      </Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              );
                            }}
                          </Form.Item>
                        </Col>
                        <Col xs={20} sm={8}>
                          <Form.Item noStyle shouldUpdate={(prev, curr) =>
                            prev.conditions?.[name]?.field !== curr.conditions?.[name]?.field
                          }>
                            {({ getFieldValue }) => {
                              const field = getFieldValue(['conditions', name, 'field']) || 'brand';
                              const isNumeric = isNumericField(field);
                              return (
                                <Form.Item
                                  {...restField}
                                  name={[name, 'value']}
                                  rules={[{ required: true, message: t('alertsV2.enterValue', 'Değer girin') }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  {isNumeric ? (
                                    <InputNumber
                                      style={{ width: '100%' }}
                                      placeholder={field === 'price' ? '1.500.000' : '5'}
                                      formatter={(value) =>
                                        field === 'price'
                                          ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                                          : `${value}`
                                      }
                                      parser={(value) =>
                                        field === 'price'
                                          ? Number(value?.replace(/\./g, '') || 0)
                                          : Number(value || 0)
                                      }
                                      addonAfter={field === 'priceChange' ? '%' : field === 'price' ? '₺' : undefined}
                                    />
                                  ) : (
                                    <Input placeholder={t('alertsV2.valuePlaceholder', 'Örn: Toyota')} />
                                  )}
                                </Form.Item>
                              );
                            }}
                          </Form.Item>
                        </Col>
                        <Col xs={4} sm={2}>
                          {fields.length > 1 && (
                            <Button
                              type="text"
                              danger
                              icon={<MinusCircleOutlined />}
                              onClick={() => remove(name)}
                            />
                          )}
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add({ field: 'brand', operator: 'eq', value: '' })}
                      block
                      icon={<PlusOutlined />}
                    >
                      {t('alertsV2.addCondition', 'Koşul Ekle')}
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            <Form.Item style={{ marginTop: tokens.spacing.lg }}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
                  {t('alertsV2.saveRule', 'Kuralı Kaydet')}
                </Button>
                <Button onClick={() => form.resetFields()}>
                  {t('common.reset', 'Sıfırla')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'triggered',
      label: (
        <Space>
          <BellOutlined />
          {t('alertsV2.triggered', 'Tetiklenenler')}
          {triggeredAlerts.length > 0 && <Tag color="red">{triggeredAlerts.length}</Tag>}
        </Space>
      ),
      children:
        triggeredAlerts.length > 0 ? (
          <div>
            <div style={{ marginBottom: tokens.spacing.md, textAlign: 'right' }}>
              <Popconfirm
                title={t('alertsV2.confirmClearAll', 'Tüm bildirimleri temizlemek istediğinize emin misiniz?')}
                onConfirm={() => {
                  clearTriggeredAlerts();
                  message.success(t('alertsV2.alertsCleared', 'Bildirimler temizlendi'));
                }}
                okText={t('common.yes', 'Evet')}
                cancelText={t('common.no', 'Hayır')}
              >
                <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                  {t('alertsV2.clearAll', 'Tümünü Temizle')}
                </Button>
              </Popconfirm>
            </div>
            <List
              dataSource={triggeredAlerts}
              renderItem={(alert) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<BellOutlined style={{ fontSize: 20, color: tokens.colors.primary }} />}
                    title={
                      <Space>
                        <Text strong>{alert.ruleName}</Text>
                        <Tag color="blue">{alert.vehicle.brand}</Tag>
                        <Tag>{alert.vehicle.model}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{alert.reason}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {alert.vehicle.trim} - {alert.vehicle.engine}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {new Date(alert.triggeredAt).toLocaleString('tr-TR')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size={4}>
                <Text type="secondary">{t('alertsV2.noTriggered', 'Tetiklenen uyarı yok')}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('alertsV2.triggeredHint', 'Kurallarınız fiyat değişikliklerinde otomatik kontrol edilir')}
                </Text>
              </Space>
            }
            style={{ padding: tokens.spacing.xl }}
          />
        ),
    },
  ];

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertOutlined style={{ color: tokens.colors.primary }} />
          {t('alertsV2.title', 'Gelişmiş Uyarılar')}
        </Title>
        <Paragraph type="secondary" style={{ marginTop: tokens.spacing.xs }}>
          {t('alertsV2.subtitle', 'Kural tabanlı fiyat uyarıları oluşturun ve takip edin')}
        </Paragraph>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: tokens.spacing.lg }}>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title={t('alertsV2.totalRules', 'Toplam Kural')}
              value={alertRules.length}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title={t('alertsV2.activeRules', 'Aktif Kurallar')}
              value={enabledRules}
              valueStyle={{ color: tokens.colors.success }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title={t('alertsV2.triggeredCount', 'Tetiklenen')}
              value={triggeredAlerts.length}
              valueStyle={{ color: triggeredAlerts.length > 0 ? tokens.colors.error : undefined }}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
      </Card>
    </div>
  );
}
