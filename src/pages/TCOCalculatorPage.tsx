// TCO Calculator Page - Total Cost of Ownership Calculator
// Calculates: Fuel cost, MTV, Insurance, Depreciation, 3-5 year total

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Card,
  Row,
  Col,
  InputNumber,
  Select,
  Slider,
  Statistic,
  Space,
  Divider,
  Table,
  Tag,
  Alert,
} from 'antd';
import {
  CalculatorOutlined,
  CarOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

import { tokens } from '../theme/tokens';
import { useIsMobile } from '../hooks/useMediaQuery';
import { PriceListRow } from '../types';
import { fetchAllRows } from '../utils/historicalData';

const { Title, Text, Paragraph } = Typography;

// Default fuel prices (TL/L or TL/kWh for electric)
const DEFAULT_FUEL_PRICES = {
  Benzin: 43.5,
  Dizel: 45.2,
  LPG: 22.8,
  Elektrik: 6.5, // TL/kWh
};

// MTV rates by engine displacement (simplified 2024 rates)
const MTV_RATES = {
  '0-1300': 2500,
  '1301-1600': 4500,
  '1601-1800': 8500,
  '1801-2000': 14000,
  '2001-2500': 22000,
  '2501-3000': 33000,
  '3001-3500': 50000,
  '3501-4000': 75000,
  '4001+': 120000,
  elektrik: 3000, // EV MTV
};

// Insurance rate by segment (% of vehicle price)
const INSURANCE_RATES = {
  budget: 0.025,
  compact: 0.028,
  midsize: 0.032,
  luxury: 0.038,
  suv: 0.035,
  electric: 0.04,
};

// Depreciation rates per year
const DEPRECIATION_RATES = [0.20, 0.15, 0.12, 0.10, 0.08]; // Year 1-5

interface TCOResult {
  year: number;
  fuelCost: number;
  mtvCost: number;
  insuranceCost: number;
  maintenanceCost: number;
  depreciation: number;
  totalYearly: number;
  cumulativeTotal: number;
}

export default function TCOCalculatorPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Vehicle selection
  const [vehicles, setVehicles] = useState<PriceListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<PriceListRow | null>(null);

  // Input parameters
  const [vehiclePrice, setVehiclePrice] = useState<number>(1500000);
  const [yearlyKm, setYearlyKm] = useState<number>(15000);
  const [fuelConsumption, setFuelConsumption] = useState<number>(7.5);
  const [fuelType, setFuelType] = useState<keyof typeof DEFAULT_FUEL_PRICES>('Benzin');
  const [years, setYears] = useState<number>(5);
  const [engineSize, setEngineSize] = useState<string>('1301-1600');
  const [segment, setSegment] = useState<keyof typeof INSURANCE_RATES>('compact');

  // Editable fuel prices
  const [fuelPrices, setFuelPrices] = useState(DEFAULT_FUEL_PRICES);

  // Load vehicles for selection
  useEffect(() => {
    const loadVehicles = async () => {
      setLoading(true);
      try {
        const rows = await fetchAllRows();
        setVehicles(rows);
      } catch (error) {
        console.error('Failed to load vehicles:', error);
      }
      setLoading(false);
    };
    loadVehicles();
  }, []);

  // Update inputs when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      setVehiclePrice(selectedVehicle.priceNumeric);

      // Determine fuel type
      const fuel = selectedVehicle.fuel.toLowerCase();
      if (fuel.includes('elektrik') || fuel.includes('electric')) {
        setFuelType('Elektrik');
        setFuelConsumption(18); // kWh/100km
        setEngineSize('elektrik');
        setSegment('electric');
      } else if (fuel.includes('dizel') || fuel.includes('diesel')) {
        setFuelType('Dizel');
        setFuelConsumption(6.5);
      } else {
        setFuelType('Benzin');
        setFuelConsumption(7.5);
      }

      // Estimate engine size from model name or power
      if (selectedVehicle.powerHP) {
        if (selectedVehicle.powerHP < 100) setEngineSize('0-1300');
        else if (selectedVehicle.powerHP < 130) setEngineSize('1301-1600');
        else if (selectedVehicle.powerHP < 180) setEngineSize('1601-1800');
        else if (selectedVehicle.powerHP < 220) setEngineSize('1801-2000');
        else if (selectedVehicle.powerHP < 280) setEngineSize('2001-2500');
        else setEngineSize('2501-3000');
      }

      // Estimate segment from price
      if (selectedVehicle.priceNumeric < 1000000) setSegment('budget');
      else if (selectedVehicle.priceNumeric < 2000000) setSegment('compact');
      else if (selectedVehicle.priceNumeric < 3500000) setSegment('midsize');
      else setSegment('luxury');
    }
  }, [selectedVehicle]);

  // Calculate TCO
  const tcoResults = useMemo<TCOResult[]>(() => {
    const results: TCOResult[] = [];
    let remainingValue = vehiclePrice;
    let cumulativeTotal = 0;

    for (let year = 1; year <= years; year++) {
      // Fuel cost
      const fuelCost = fuelType === 'Elektrik'
        ? (yearlyKm / 100) * fuelConsumption * fuelPrices.Elektrik
        : (yearlyKm / 100) * fuelConsumption * fuelPrices[fuelType];

      // MTV cost
      const mtvCost = MTV_RATES[engineSize as keyof typeof MTV_RATES] || MTV_RATES['1301-1600'];

      // Insurance cost (decreases with age)
      const ageMultiplier = 1 - (year - 1) * 0.05;
      const insuranceCost = vehiclePrice * INSURANCE_RATES[segment] * ageMultiplier;

      // Maintenance cost (increases with age)
      const maintenanceBase = vehiclePrice * 0.015;
      const maintenanceCost = maintenanceBase * (1 + (year - 1) * 0.2);

      // Depreciation
      const depreciationRate = DEPRECIATION_RATES[Math.min(year - 1, 4)];
      const depreciation = remainingValue * depreciationRate;
      remainingValue -= depreciation;

      // Total
      const totalYearly = fuelCost + mtvCost + insuranceCost + maintenanceCost;
      cumulativeTotal += totalYearly + depreciation;

      results.push({
        year,
        fuelCost: Math.round(fuelCost),
        mtvCost: Math.round(mtvCost),
        insuranceCost: Math.round(insuranceCost),
        maintenanceCost: Math.round(maintenanceCost),
        depreciation: Math.round(depreciation),
        totalYearly: Math.round(totalYearly),
        cumulativeTotal: Math.round(cumulativeTotal),
      });
    }

    return results;
  }, [vehiclePrice, yearlyKm, fuelConsumption, fuelType, fuelPrices, years, engineSize, segment]);

  // Summary stats
  const summary = useMemo(() => {
    if (tcoResults.length === 0) return null;

    const totalFuel = tcoResults.reduce((sum, r) => sum + r.fuelCost, 0);
    const totalMTV = tcoResults.reduce((sum, r) => sum + r.mtvCost, 0);
    const totalInsurance = tcoResults.reduce((sum, r) => sum + r.insuranceCost, 0);
    const totalMaintenance = tcoResults.reduce((sum, r) => sum + r.maintenanceCost, 0);
    const totalDepreciation = tcoResults.reduce((sum, r) => sum + r.depreciation, 0);
    const grandTotal = tcoResults[tcoResults.length - 1].cumulativeTotal;
    const costPerKm = grandTotal / (yearlyKm * years);
    const monthlyAvg = grandTotal / (years * 12);

    return {
      totalFuel,
      totalMTV,
      totalInsurance,
      totalMaintenance,
      totalDepreciation,
      grandTotal,
      costPerKm,
      monthlyAvg,
    };
  }, [tcoResults, yearlyKm, years]);

  // Vehicle options for select (deduplicated)
  const vehicleOptions = useMemo(() => {
    const uniqueMap = new Map<string, PriceListRow>();

    // Deduplicate by brand-model-trim-engine key
    vehicles.forEach((v) => {
      const key = `${v.brand}-${v.model}-${v.trim}-${v.engine}`.toLowerCase();
      // Keep the latest entry (last one wins)
      uniqueMap.set(key, v);
    });

    return Array.from(uniqueMap.values())
      .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`))
      .map((v) => ({
        value: `${v.brand}-${v.model}-${v.trim}-${v.engine}`,
        label: `${v.brand} ${v.model} - ${v.engine}`,
        vehicle: v,
      }));
  }, [vehicles]);

  // Table columns
  const columns = [
    {
      title: t('tco.year', 'Yıl'),
      dataIndex: 'year',
      key: 'year',
      width: 60,
      render: (year: number) => <Tag color="blue">{year}</Tag>,
    },
    {
      title: t('tco.fuel', 'Yakıt'),
      dataIndex: 'fuelCost',
      key: 'fuelCost',
      render: (v: number) => `${v.toLocaleString('tr-TR')} ₺`,
    },
    {
      title: 'MTV',
      dataIndex: 'mtvCost',
      key: 'mtvCost',
      render: (v: number) => `${v.toLocaleString('tr-TR')} ₺`,
    },
    {
      title: t('tco.insurance', 'Sigorta'),
      dataIndex: 'insuranceCost',
      key: 'insuranceCost',
      render: (v: number) => `${v.toLocaleString('tr-TR')} ₺`,
    },
    {
      title: t('tco.maintenance', 'Bakım'),
      dataIndex: 'maintenanceCost',
      key: 'maintenanceCost',
      render: (v: number) => `${v.toLocaleString('tr-TR')} ₺`,
    },
    {
      title: t('tco.depreciation', 'Değer Kaybı'),
      dataIndex: 'depreciation',
      key: 'depreciation',
      render: (v: number) => (
        <Text type="danger">{v.toLocaleString('tr-TR')} ₺</Text>
      ),
    },
    {
      title: t('tco.total', 'Toplam'),
      dataIndex: 'cumulativeTotal',
      key: 'cumulativeTotal',
      render: (v: number) => (
        <Text strong style={{ color: tokens.colors.primary }}>
          {v.toLocaleString('tr-TR')} ₺
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      {/* Header */}
      <div style={{ marginBottom: tokens.spacing.xl }}>
        <Title level={2} style={{ marginBottom: tokens.spacing.xs }}>
          <CalculatorOutlined style={{ marginRight: tokens.spacing.sm }} />
          {t('tco.title', 'Toplam Sahip Olma Maliyeti (TCO)')}
        </Title>
        <Paragraph type="secondary">
          {t('tco.description', 'Araç satın alma sonrası yakıt, vergi, sigorta, bakım ve değer kaybı dahil toplam maliyeti hesaplayın.')}
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {/* Input Panel */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <CarOutlined />
                {t('tco.vehicleParams', 'Araç Parametreleri')}
              </Space>
            }
            size="small"
          >
            {/* Vehicle Selection */}
            <div style={{ marginBottom: tokens.spacing.md }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('tco.selectVehicle', 'Araç Seçin (Opsiyonel)')}
              </Text>
              <Select
                showSearch
                allowClear
                virtual
                placeholder={t('tco.searchVehicle', 'Araç ara...')}
                style={{ width: '100%' }}
                loading={loading}
                options={vehicleOptions}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onChange={(_, option) => {
                  if (option && 'vehicle' in option) {
                    setSelectedVehicle(option.vehicle as PriceListRow);
                  } else {
                    setSelectedVehicle(null);
                  }
                }}
                listHeight={300}
                dropdownStyle={{ maxHeight: 300 }}
              />
            </div>

            <Divider />

            {/* Vehicle Price */}
            <div style={{ marginBottom: tokens.spacing.md }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('tco.vehiclePrice', 'Araç Fiyatı')} (₺)
              </Text>
              <InputNumber
                style={{ width: '100%' }}
                value={vehiclePrice}
                onChange={(v) => setVehiclePrice(v || 0)}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => Number(value?.replace(/\./g, '') || 0)}
                min={100000}
                max={50000000}
                step={100000}
              />
            </div>

            {/* Yearly KM */}
            <div style={{ marginBottom: tokens.spacing.md }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('tco.yearlyKm', 'Yıllık Kilometre')}
              </Text>
              <Slider
                value={yearlyKm}
                onChange={setYearlyKm}
                min={5000}
                max={50000}
                step={1000}
                marks={{
                  5000: '5K',
                  15000: '15K',
                  30000: '30K',
                  50000: '50K',
                }}
              />
              <InputNumber
                style={{ width: '100%', marginTop: 8 }}
                value={yearlyKm}
                onChange={(v) => setYearlyKm(v || 15000)}
                suffix="km"
              />
            </div>

            {/* Fuel Type */}
            <div style={{ marginBottom: tokens.spacing.md }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('tco.fuelType', 'Yakıt Tipi')}
              </Text>
              <Select
                style={{ width: '100%' }}
                value={fuelType}
                onChange={setFuelType}
                options={[
                  { value: 'Benzin', label: 'Benzin' },
                  { value: 'Dizel', label: 'Dizel' },
                  { value: 'LPG', label: 'LPG' },
                  { value: 'Elektrik', label: 'Elektrik' },
                ]}
              />
            </div>

            {/* Fuel Price */}
            <div style={{ marginBottom: tokens.spacing.md }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('tco.fuelPrice', 'Yakıt Fiyatı')} ({fuelType === 'Elektrik' ? '₺/kWh' : '₺/L'})
              </Text>
              <InputNumber
                style={{ width: '100%' }}
                value={fuelPrices[fuelType]}
                onChange={(v) => setFuelPrices(prev => ({ ...prev, [fuelType]: v || DEFAULT_FUEL_PRICES[fuelType] }))}
                min={0.1}
                max={100}
                step={0.1}
                precision={2}
                addonAfter={fuelType === 'Elektrik' ? '₺/kWh' : '₺/L'}
              />
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                {t('tco.fuelPriceHint', 'Güncel fiyatı girebilirsiniz')}
              </Text>
            </div>

            {/* Fuel Consumption */}
            <div style={{ marginBottom: tokens.spacing.md }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('tco.consumption', 'Tüketim')} ({fuelType === 'Elektrik' ? 'kWh/100km' : 'L/100km'})
              </Text>
              <InputNumber
                style={{ width: '100%' }}
                value={fuelConsumption}
                onChange={(v) => setFuelConsumption(v || 7.5)}
                min={1}
                max={fuelType === 'Elektrik' ? 50 : 30}
                step={0.5}
              />
            </div>

            {/* Engine Size */}
            <div style={{ marginBottom: tokens.spacing.md }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('tco.engineSize', 'Motor Hacmi (cc)')}
              </Text>
              <Select
                style={{ width: '100%' }}
                value={engineSize}
                onChange={setEngineSize}
                options={[
                  { value: '0-1300', label: '0 - 1300 cc' },
                  { value: '1301-1600', label: '1301 - 1600 cc' },
                  { value: '1601-1800', label: '1601 - 1800 cc' },
                  { value: '1801-2000', label: '1801 - 2000 cc' },
                  { value: '2001-2500', label: '2001 - 2500 cc' },
                  { value: '2501-3000', label: '2501 - 3000 cc' },
                  { value: '3001-3500', label: '3001 - 3500 cc' },
                  { value: '3501-4000', label: '3501 - 4000 cc' },
                  { value: '4001+', label: '4000+ cc' },
                  { value: 'elektrik', label: 'Elektrikli' },
                ]}
              />
            </div>

            {/* Years */}
            <div style={{ marginBottom: tokens.spacing.md }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('tco.years', 'Hesaplama Süresi')} ({t('tco.year', 'Yıl')})
              </Text>
              <Slider
                value={years}
                onChange={setYears}
                min={1}
                max={10}
                marks={{ 1: '1', 3: '3', 5: '5', 10: '10' }}
              />
            </div>

            {/* Segment */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('tco.segment', 'Araç Segmenti')}
              </Text>
              <Select
                style={{ width: '100%' }}
                value={segment}
                onChange={setSegment}
                options={[
                  { value: 'budget', label: t('tco.segments.budget', 'Ekonomik') },
                  { value: 'compact', label: t('tco.segments.compact', 'Kompakt') },
                  { value: 'midsize', label: t('tco.segments.midsize', 'Orta Sınıf') },
                  { value: 'luxury', label: t('tco.segments.luxury', 'Lüks') },
                  { value: 'suv', label: 'SUV' },
                  { value: 'electric', label: t('tco.segments.electric', 'Elektrikli') },
                ]}
              />
            </div>
          </Card>

          {/* Info Card */}
          <Alert
            style={{ marginTop: tokens.spacing.md }}
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message={t('tco.disclaimer', 'Bilgilendirme')}
            description={t('tco.disclaimerText', 'Bu hesaplama tahmini değerler içerir. Gerçek maliyetler kullanım şekli, bakım alışkanlıkları ve piyasa koşullarına göre değişebilir.')}
          />
        </Col>

        {/* Results Panel */}
        <Col xs={24} lg={16}>
          {/* Summary Cards */}
          <Row gutter={[8, 8]} style={{ marginBottom: tokens.spacing.md }}>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title={t('tco.totalCost', 'Toplam Maliyet')}
                  value={summary?.grandTotal || 0}
                  suffix="₺"
                  precision={0}
                  valueStyle={{ color: tokens.colors.error, fontSize: isMobile ? 16 : 20 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title={t('tco.costPerKm', 'Km Başı Maliyet')}
                  value={summary?.costPerKm || 0}
                  suffix="₺/km"
                  precision={2}
                  valueStyle={{ fontSize: isMobile ? 16 : 20 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title={t('tco.monthlyAvg', 'Aylık Ortalama')}
                  value={summary?.monthlyAvg || 0}
                  suffix="₺"
                  precision={0}
                  valueStyle={{ fontSize: isMobile ? 16 : 20 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title={t('tco.totalDepreciation', 'Değer Kaybı')}
                  value={summary?.totalDepreciation || 0}
                  suffix="₺"
                  precision={0}
                  valueStyle={{ color: tokens.colors.warning, fontSize: isMobile ? 16 : 20 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Cost Breakdown */}
          <Card
            title={
              <Space>
                <DollarOutlined />
                {t('tco.breakdown', 'Maliyet Dağılımı')} ({years} {t('tco.year', 'Yıl')})
              </Space>
            }
            size="small"
            style={{ marginBottom: tokens.spacing.md }}
          >
            <Row gutter={[16, 8]}>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title={<><ThunderboltOutlined /> {t('tco.fuel', 'Yakıt')}</>}
                  value={summary?.totalFuel || 0}
                  suffix="₺"
                  precision={0}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="MTV"
                  value={summary?.totalMTV || 0}
                  suffix="₺"
                  precision={0}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title={t('tco.insurance', 'Sigorta')}
                  value={summary?.totalInsurance || 0}
                  suffix="₺"
                  precision={0}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title={t('tco.maintenance', 'Bakım')}
                  value={summary?.totalMaintenance || 0}
                  suffix="₺"
                  precision={0}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title={t('tco.depreciation', 'Değer Kaybı')}
                  value={summary?.totalDepreciation || 0}
                  suffix="₺"
                  precision={0}
                  valueStyle={{ fontSize: 14, color: tokens.colors.error }}
                />
              </Col>
            </Row>
          </Card>

          {/* Yearly Breakdown Table */}
          <Card
            title={t('tco.yearlyBreakdown', 'Yıllık Detay')}
            size="small"
          >
            <Table
              dataSource={tcoResults}
              columns={isMobile ? columns.filter((_, i) => [0, 1, 5, 6].includes(i)) : columns}
              rowKey="year"
              size="small"
              pagination={false}
              scroll={{ x: isMobile ? 300 : 800 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
